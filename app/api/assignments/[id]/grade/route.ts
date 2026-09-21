import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FACULTY") {
      return NextResponse.json(
        { message: "Only faculty can grade submissions" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const { grade, feedback } = await request.json();

    if (grade === undefined || grade === null) {
      return NextResponse.json(
        { message: "Grade is required" },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.assignment.course.facultyId !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const updatedSubmission = await prisma.submission.update({
      where: {
        id: Number(id),
      },
      data: {
        grade: Number(grade),
        feedback: feedback || null,
        status: "GRADED",
      },
    });

    return NextResponse.json({
      message: "Submission graded successfully",
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}