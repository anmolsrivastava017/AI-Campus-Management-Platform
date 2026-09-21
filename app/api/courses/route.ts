import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        { message: "Only faculty can create courses" },
        { status: 403 }
      );
    }

    const { name, code, description } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { message: "Course name and code are required" },
        { status: 400 }
      );
    }

    const existingCourse = await prisma.course.findUnique({
      where: {
        code,
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { message: "Course code already exists" },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        description: description || null,
        facultyId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Course created successfully",
        course,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create course error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role === "FACULTY") {
      const courses = await prisma.course.findMany({
        where: {
          facultyId: user.id,
        },
        include: {
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        courses,
      });
    }

    const courses = await prisma.course.findMany({
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enrollments: {
          where: {
            studentId: user.id,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

const coursesWithEnrollmentStatus = courses.map(
  (course: typeof courses[number]) => ({      ...course,
      isEnrolled: course.enrollments.length > 0,
      enrollments: undefined,
    }));

    return NextResponse.json({
      courses: coursesWithEnrollmentStatus,
    });
  } catch (error) {
    console.error("Get courses error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}