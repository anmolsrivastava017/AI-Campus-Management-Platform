import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import qdrant from "@/lib/qdrant";
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

    const { question } = await request.json();

    if (!question || !question.trim()) {
      return NextResponse.json(
        { message: "Question is required" },
        { status: 400 }
      );
    }

    const embedding = await generateEmbedding(question.trim());

    const searchResult = await qdrant.query(COLLECTION_NAME, {
      query: embedding,
      limit: 5,
      with_payload: true,
    });

    const results = searchResult.points.map((point) => ({
      id: point.id,
      content: point.payload?.content,
      documentId: point.payload?.documentId,
      chunkIndex: point.payload?.chunkIndex,
      title: point.payload?.title,
      similarity: point.score,
    }));

    return NextResponse.json({
      question: question.trim(),
      results,
    });
  } catch (error) {
    console.error("RAG search error:", error);

    return NextResponse.json(
      { message: "RAG search failed" },
      { status: 500 }
    );
  }
}