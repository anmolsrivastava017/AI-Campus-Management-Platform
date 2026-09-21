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
      const materials = await prisma.studyMaterial.findMany({
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

      return NextResponse.json({ materials });
    }

    const materials = await prisma.studyMaterial.findMany({
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

    return NextResponse.json({ materials });
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
        { message: "Only faculty can add materials" },
        { status: 403 }
      );
    }

    const { title, description, url, type, courseId } =
      await request.json();

    if (!title || !url || !courseId) {
      return NextResponse.json(
        { message: "Title, URL and course are required" },
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

    const material = await prisma.studyMaterial.create({
      data: {
        title,
        description: description || null,
        url,
        type: type || "DOCUMENT",
        courseId: Number(courseId),
        facultyId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Study material added successfully",
        material,
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