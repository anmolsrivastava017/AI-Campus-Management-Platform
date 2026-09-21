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

    const where =
      user.role === "STUDENT"
        ? { studentId: user.id }
        : { facultyId: user.id };

    const complaints = await prisma.complaint.findMany({
      where,

      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      complaints,
    });
  } catch (error) {
    console.error("Get complaints error:", error);

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

    const body = await request.json();

    const {
      title,
      description,
      facultyId,
      studentId,
    } = body;

    if (user.role === "STUDENT") {
      if (!title || !description) {
        return NextResponse.json(
          {
            message:
              "Title and description are required",
          },
          { status: 400 }
        );
      }

      const complaint = await prisma.complaint.create({
        data: {
          title,
          description,
          studentId: user.id,
          facultyId: facultyId
            ? Number(facultyId)
            : null,
        },

        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message:
            "Complaint submitted successfully",
          complaint,
        },
        { status: 201 }
      );
    }

    if (user.role === "FACULTY") {
      if (!title || !description || !studentId) {
        return NextResponse.json(
          {
            message:
              "Student, title and description are required",
          },
          { status: 400 }
        );
      }

      const numericStudentId = Number(studentId);

      const student = await prisma.user.findFirst({
        where: {
          id: numericStudentId,
          role: "STUDENT",
        },
      });

      if (!student) {
        return NextResponse.json(
          { message: "Student not found" },
          { status: 404 }
        );
      }

      const complaint = await prisma.complaint.create({
        data: {
          title,
          description,
          studentId: numericStudentId,
          facultyId: user.id,
        },

        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message:
            "Complaint created successfully",
          complaint,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Create complaint error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}