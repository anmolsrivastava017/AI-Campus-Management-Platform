
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get("receiverId");

    if (!receiverId) {
      return NextResponse.json(
        { message: "receiverId is required" },
        { status: 400 }
      );
    }

    const receiver = await prisma.user.findUnique({
      where: {
        id: Number(receiverId),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!receiver) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: user.id,
            receiverId: Number(receiverId),
          },
          {
            senderId: Number(receiverId),
            receiverId: user.id,
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      receiver,
      messages,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, content, type, fileUrl } = await request.json();

    if (!receiverId) {
      return NextResponse.json(
        { message: "Receiver is required" },
        { status: 400 }
      );
    }

    if (!content && !fileUrl) {
      return NextResponse.json(
        { message: "Message content or file is required" },
        { status: 400 }
      );
    }

    const receiver = await prisma.user.findUnique({
      where: {
        id: Number(receiverId),
      },
    });

    if (!receiver) {
      return NextResponse.json(
        { message: "Receiver not found" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: Number(receiverId),
        content: content || null,
        type: type || "TEXT",
        fileUrl: fileUrl || null,
      },
    });

    return NextResponse.json(
      {
        message: "Message sent successfully",
        data: message,
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