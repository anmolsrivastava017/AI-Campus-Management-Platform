import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
        enrollments: {
          where: {
            course: {
              facultyId: user.id,
            },
          },
          include: {
            course: true,
          },
        },
      },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}