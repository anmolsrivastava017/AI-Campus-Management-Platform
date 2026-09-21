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

    if (user.role !== "FACULTY") {
      return NextResponse.json(
        { message: "Only faculty can access students" },
        { status: 403 }
      );
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        enrollments: {
          some: {
            course: {
              facultyId: user.id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        enrollments: {
          where: {
            course: {
              facultyId: user.id,
            },
          },
          select: {
            id: true,
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      status: "Active",
      courses: student.enrollments.map(
        (enrollment) => enrollment.course
      ),
    }));

    return NextResponse.json({
      students: formattedStudents,
    });
  } catch (error) {
    console.error("Get students error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
