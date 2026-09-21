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

    if (user.role === "STUDENT") {
      const results = await prisma.result.findMany({
        where: {
          studentId: user.id,
          published: true,
        },
        include: {
          course: true,
          exam: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ results });
    }

    if (user.role !== "FACULTY") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const results = await prisma.result.findMany({
      where: {
        course: {
          facultyId: user.id,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: true,
        exam: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Get results error:", error);

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
        { message: "Only faculty can create results" },
        { status: 403 }
      );
    }

    const {
      studentId,
      courseId,
      examId,
      marks,
      maxMarks,
      grade,
      remarks,
      published,
    } = await request.json();

    if (
      !studentId ||
      !courseId ||
      marks === undefined ||
      maxMarks === undefined
    ) {
      return NextResponse.json(
        {
          message:
            "Student, course, marks and maximum marks are required",
        },
        { status: 400 }
      );
    }

    const numericStudentId = Number(studentId);
    const numericCourseId = Number(courseId);
    const numericMarks = Number(marks);
    const numericMaxMarks = Number(maxMarks);

    if (
      Number.isNaN(numericStudentId) ||
      Number.isNaN(numericCourseId) ||
      Number.isNaN(numericMarks) ||
      Number.isNaN(numericMaxMarks)
    ) {
      return NextResponse.json(
        { message: "Invalid result data" },
        { status: 400 }
      );
    }

    if (numericMarks < 0 || numericMarks > numericMaxMarks) {
      return NextResponse.json(
        {
          message:
            "Marks must be between 0 and maximum marks",
        },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: {
        id: numericCourseId,
        facultyId: user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found or unauthorized" },
        { status: 403 }
      );
    }

    const student = await prisma.user.findFirst({
      where: {
        id: numericStudentId,
        role: "STUDENT",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: numericStudentId,
          courseId: numericCourseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          message:
            "Selected student is not enrolled in this course",
        },
        { status: 400 }
      );
    }

    const result = await prisma.result.create({
      data: {
        studentId: numericStudentId,
        courseId: numericCourseId,
        examId: examId ? Number(examId) : null,
        marks: numericMarks,
        maxMarks: numericMaxMarks,
        grade: grade || null,
        remarks: remarks || null,
        published: Boolean(published),
        publishedBy: published ? user.id : null,
      },

      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: true,
        exam: true,
      },
    });

    return NextResponse.json(
      {
        message: "Result created successfully",
        result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create result error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}