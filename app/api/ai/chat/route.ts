import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemInstruction =
  "You are the AI Campus Assistant for an AI Campus Management Platform. Help students and faculty with academic, campus, course, attendance, assignments, exams, results, and general study-related questions. Give clear, concise and useful answers.";

async function generateWithRetry(
  model: string,
  message: string,
  attempts = 2
) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model,
        contents: message,
        config: {
          systemInstruction,
        },
      });
    } catch (error) {
      console.error(
        `Gemini ${model} attempt ${attempt} failed:`,
        error
      );

      if (attempt < attempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const message = body.message;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 1. Generate embedding for the question
    // ----------------------------------------

    const embeddingResult = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: message.trim(),
      config: {
        outputDimensionality: 768,
      },
    });

    const questionEmbedding =
      embeddingResult.embeddings?.[0]?.values;

    if (!questionEmbedding) {
      return NextResponse.json(
        { message: "Failed to generate question embedding" },
        { status: 500 }
      );
    }

    const vectorString = `[${questionEmbedding.join(",")}]`;

    // ----------------------------------------
    // 2. Search relevant RAG chunks
    // ----------------------------------------

    const ragChunks = await prisma.$queryRaw<
      {
        content: string;
        similarity: number;
      }[]
    >`
      SELECT
        content,
        1 - (embedding <=> ${vectorString}::vector) AS similarity
      FROM "RAGChunk"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT 5;
    `;

    const context = ragChunks
      .map(
  (chunk: { content: string; similarity: number }, index: number) =>
    `[Context ${index + 1}]\n${chunk.content}`
)
      .join("\n\n");

    const ragPrompt = `
Use the following campus knowledge when it is relevant to the user's question.

IMPORTANT:
- Prefer the provided campus knowledge when answering campus-specific questions.
- Do not invent campus policies or rules.
- If the provided context does not contain the answer, clearly say that the available campus documents do not provide that information.
- You can still answer general academic questions using your general knowledge.

Campus Knowledge:
${context || "No relevant campus knowledge was found."}

User Question:
${message.trim()}
`;

    let response = await generateWithRetry(
      "gemini-3.7-flash",
      ragPrompt
    );

    if (!response) {
      console.log(
        "⚠️ Gemini 3.7 unavailable. Trying Gemini 3.6..."
      );

      response = await generateWithRetry(
        "gemini-3.6-flash",
        ragPrompt
      );
    }

    if (!response) {
      return NextResponse.json(
        {
          message:
            "AI service is temporarily unavailable. Please try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      answer: response.text,
    });
  } catch (error) {
    console.error("AI chat error:", error);

    return NextResponse.json(
      { message: "AI assistant failed to respond" },
      { status: 500 }
    );
  }
}