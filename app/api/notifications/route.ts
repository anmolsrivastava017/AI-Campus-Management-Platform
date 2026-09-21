import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const unreadCount = notifications.filter(
  (notification: typeof notifications[number]) => !notification.isRead
).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

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
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "FACULTY") {
      return NextResponse.json(
        {
          message: "Only faculty can create notifications",
        },
        { status: 403 }
      );
    }

    const {
      userId,
      title,
      message,
      type,
    } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json(
        {
          message: "User, title and message are required",
        },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
      select: {
        id: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "Target user not found" },
        { status: 404 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: Number(userId),
        title,
        message,
        type: type || "GENERAL",
      },
    });

    return NextResponse.json(
      {
        message: "Notification created successfully",
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create notification error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { notificationId, markAll } = await request.json();
    if (markAll === true) {
      const result = await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        message: "All notifications marked as read",
        updatedCount: result.count,
      });
    }
    if (!notificationId) {
      return NextResponse.json(
        {
          message:
            "notificationId or markAll is required",
        },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: Number(notificationId),
        userId: user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          isRead: true,
        },
      });

    return NextResponse.json({
      message: "Notification marked as read",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}