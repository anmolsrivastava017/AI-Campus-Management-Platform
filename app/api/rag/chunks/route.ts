import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== "FACULTY") {
      return NextResponse.json(
        { message: "Only faculty can create RAG chunks" },
        { status: 403 }
      );
    }
    const { documentId, chunks } = await request.json();

    if (!documentId || !Array.isArray(chunks)) {
      return NextResponse.json(
        { message: "Document ID and chunks are required" },
        { status: 400 }
      );
    }
    const document = await prisma.rAGDocument.findFirst({
      where: {
        id: Number(documentId),
        facultyId: user.id,
      },
    });
    if (!document) {
      return NextResponse.json(
        { message: "Document not found or unauthorized" },
        { status: 404 }
      );
    }

    const createdChunks = await prisma.$transaction(
      chunks.map(
        (
          chunk: {
            content: string;
            chunkIndex: number;
            vectorId?: string;
          }
        ) =>
          prisma.rAGChunk.create({
            data: {
              documentId: Number(documentId),
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
              vectorId: chunk.vectorId || null,
            },
          })
      )
    );

    return NextResponse.json(
      {
        message: "RAG chunks created successfully",
        chunks: createdChunks,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}