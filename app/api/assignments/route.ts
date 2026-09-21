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
      const assignments = await prisma.assignment.findMany({
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
          submissions: {
            where: {
              studentId: user.id,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      });

const formatted = assignments.map((assignment: typeof assignments[number]) => {  const submission = assignment.submissions[0];

  let status = submission?.status ?? "PENDING";

  if (!submission && new Date() > assignment.dueDate) {
    status = "LATE";
  }

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    courseId: assignment.courseId,
    course: assignment.course,

    submissions: submission ? [submission] : [],

    submission: submission ?? null,

    status,
  };
});

      return NextResponse.json({
        assignments: formatted,
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        course: {
          facultyId: user.id,
        },
      },
      include: {
        course: true,
        submissions: {
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
        dueDate: "asc",
      },
    });

    return NextResponse.json({ assignments });
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

    if (user.role !== "FACULTY") {
      return NextResponse.json(
        { message: "Only faculty can create assignments" },
        { status: 403 }
      );
    }

    const { title, description, dueDate, courseId } = await request.json();

    if (!title || !dueDate || !courseId) {
      return NextResponse.json(
        { message: "Title, due date and course are required" },
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

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        courseId: Number(courseId),
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json(
      {
        message: "Assignment created successfully",
        assignment,
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