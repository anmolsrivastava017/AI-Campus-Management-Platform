
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "STUDENT") {
      const exams = await prisma.exam.findMany({
        where: {
          course: {
            enrollments: {
              some: {
                studentId: user.id,
              },
            },
          },
        },
        include: {
          course: true,
        },
        orderBy: {
          date: "asc",
        },
      });

      return NextResponse.json({ exams });
    }

    const exams = await prisma.exam.findMany({
      where: {
        createdById: user.id,
      },
      include: {
        course: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({ exams });
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
        { message: "Only faculty can create exams" },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      date,
      startTime,
      endTime,
      room,
      courseId,
    } = await request.json();

    if (!title || !date || !courseId) {
      return NextResponse.json(
        { message: "Title, date and course are required" },
        { status: 400 }
      );
    }

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

    const exam = await prisma.exam.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        room: room || null,
        courseId: Number(courseId),
        createdById: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Exam created successfully",
        exam,
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