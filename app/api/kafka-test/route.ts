import { NextResponse } from "next/server";
import { producer } from "@/lib/kafka";

export async function POST() {
  try {
    await producer.connect();

    await producer.send({
      topic: "complaints",
      messages: [
        {
          value: JSON.stringify({
            message: "Test complaint event",
            createdAt: new Date().toISOString(),
          }),
        },
      ],
    });

    await producer.disconnect();

    return NextResponse.json({
      message: "Kafka event sent successfully",
    });
  } catch (error) {
    console.error("Kafka error:", error);

    return NextResponse.json(
      {
        message: "Kafka event failed",
      },
      { status: 500 }
    );
  }
}