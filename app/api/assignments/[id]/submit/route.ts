import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Only students can submit assignments" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const assignmentId = Number(id);

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { message: "Submission content is required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      },
      include: {
        course: {
          include: {
            enrollments: {
              where: {
                studentId: user.id,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.course.enrollments.length === 0) {
      return NextResponse.json(
        { message: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: user.id,
        },
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { message: "Assignment already submitted" },
        { status: 400 }
      );
    }

    const isLate = new Date() > assignment.dueDate;

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: user.id,
        content,
        status: isLate ? "LATE" : "SUBMITTED",
      },
    });

    return NextResponse.json(
      {
        message: "Assignment submitted successfully",
        submission,
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