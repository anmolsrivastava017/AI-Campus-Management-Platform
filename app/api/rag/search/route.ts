import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { question } = await request.json();

    if (!question || !question.trim()) {
      return NextResponse.json(
        { message: "Question is required" },
        { status: 400 }
      );
    }

    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: question.trim(),
      config: {
        outputDimensionality: 768,
      },
    });

    const embedding = result.embeddings?.[0]?.values;

    if (!embedding) {
      return NextResponse.json(
        { message: "Failed to generate question embedding" },
        { status: 500 }
      );
    }

    const vectorString = `[${embedding.join(",")}]`;

    const chunks = await prisma.$queryRaw<
      {
        id: number;
        content: string;
        documentId: number;
        similarity: number;
      }[]
    >`
      SELECT
        id,
        content,
        "documentId",
        1 - (embedding <=> ${vectorString}::vector) AS similarity
      FROM "RAGChunk"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT 5;
    `;

    return NextResponse.json({
      question: question.trim(),
      results: chunks,
    });
  } catch (error) {
    console.error("RAG search error:", error);

    return NextResponse.json(
      { message: "RAG search failed" },
      { status: 500 }
    );
  }
}