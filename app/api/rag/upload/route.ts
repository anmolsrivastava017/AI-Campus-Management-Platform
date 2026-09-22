import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import qdrant from "@/lib/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { extractText, getDocumentProxy } from "unpdf";
import { generateEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";

const COLLECTION_NAME = "ai_campus_documents";

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

    const createdChunks = await prisma.rAGChunk.createManyAndReturn({
      data: chunks.map((chunk, index) => ({
        documentId: document.id,
        content: chunk.pageContent,
        chunkIndex: index,
      })),
    });

    const points = [];

    for (const chunk of createdChunks) {
      const embedding = await generateEmbedding(chunk.content);

      points.push({
        id: chunk.id,
        vector: embedding,
        payload: {
          chunkId: chunk.id,
          documentId: document.id,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          title: file.name,
        },
      });
    }

    await qdrant.upsert(COLLECTION_NAME, {
      points,
    });

    await prisma.$transaction(
      createdChunks.map((chunk) =>
        prisma.rAGChunk.update({
          where: {
            id: chunk.id,
          },
          data: {
            vectorId: String(chunk.id),
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: "RAG document uploaded successfully",
        documentId: document.id,
        fileName: file.name,
        pageCount: totalPages,
        chunkCount: chunks.length,
        vectorCount: points.length,
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