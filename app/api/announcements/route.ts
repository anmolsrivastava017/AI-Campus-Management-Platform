import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSocketIO } from "@/lib/socket-server";
import { prisma } from "@/lib/prisma";
import {
  createNotificationsForStudents,
  getAllStudentIds,
  getCourseStudentIds,
} from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "STUDENT") {
      const announcements = await prisma.announcement.findMany({
        where: {
          OR: [
            {
              course: {
                enrollments: {
                  some: {
                    studentId: user.id,
                  },
                },
              },
            },
            {
              courseId: null,
            },
          ],
        },
        include: {
          course: true,
          faculty: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ announcements });
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        facultyId: user.id,
      },
      include: {
        course: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ announcements });
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

    if (!user || user.role !== "FACULTY") {
      return NextResponse.json(
        { message: "Only faculty can create announcements" },
        { status: 403 }
      );
    }

    const { title, content, courseId } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: Number(courseId),
          facultyId: user.id,
        },
      });

      if (!course) {
        return NextResponse.json(
          { message: "Course not found or unauthorized" },
          { status: 403 }
        );
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        courseId: courseId ? Number(courseId) : null,
        facultyId: user.id,
      },
    });
    const studentIds = courseId
  ? await getCourseStudentIds(Number(courseId))
  : await getAllStudentIds();

await createNotificationsForStudents({
  studentIds,
  title: `📢 ${title}`,
  message: content,
  type: "ANNOUNCEMENT",
});
const io = getSocketIO();

if (io) {
  for (const studentId of studentIds) {
    io.to(`user:${studentId}`).emit("notification:new", {
      id: Date.now(),
      title: `📢 ${title}`,
      message: content,
      type: "ANNOUNCEMENT",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    io.to(`user:${studentId}`).emit("announcement:new", {
      ...announcement,
      course: null,
    });
  }
}

    return NextResponse.json(
      {
        message: "Announcement created successfully",
        announcement,
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