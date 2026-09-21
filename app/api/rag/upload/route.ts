import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { extractText, getDocumentProxy } from "unpdf";
import { generateEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "FACULTY") {
      return NextResponse.json(
        { message: "Only faculty can upload RAG documents" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "PDF file is required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const pdf = await getDocumentProxy(buffer);

    const { totalPages, text } = await extractText(pdf, {
      mergePages: true,
    });

   const extractedText = text.trim();

    if (!extractedText) {
      return NextResponse.json(
        { message: "No readable text found in PDF" },
        { status: 400 }
      );
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments([extractedText]);

    const document = await prisma.rAGDocument.create({
      data: {
        title: file.name,
        fileUrl: file.name,
        faculty: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    await prisma.rAGChunk.createMany({
  data: chunks.map((chunk, index) => ({
    documentId: document.id,
    content: chunk.pageContent,
    chunkIndex: index,
  })),
});

   for (let index = 0; index < chunks.length; index++) {
  const chunk = chunks[index];

  const embedding = await generateEmbedding(
    chunk.pageContent
  );

  const vectorString = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    UPDATE "RAGChunk"
    SET embedding = ${vectorString}::vector
    WHERE "documentId" = ${document.id}
      AND "chunkIndex" = ${index};
  `;
}

    return NextResponse.json(
      {
        message: "RAG document uploaded successfully",
        documentId: document.id,
        fileName: file.name,
        pageCount: totalPages,
        chunkCount: chunks.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("RAG upload error:", error);

    return NextResponse.json(
      {
        message: "Failed to process RAG document",
      },
      { status: 500 }
    );
  }
}