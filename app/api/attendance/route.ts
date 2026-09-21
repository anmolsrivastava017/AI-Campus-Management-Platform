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
        { message: "Only faculty can mark attendance" },
        { status: 403 }
      );
    }

    const { enrollmentId, date, present } = await request.json();

    if (!enrollmentId || !date || typeof present !== "boolean") {
      return NextResponse.json(
        {
          message:
            "Enrollment ID, date and attendance status are required",
        },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        id: Number(enrollmentId),
      },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "Enrollment not found" },
        { status: 404 }
      );
    }

    if (enrollment.course.facultyId !== user.id) {
      return NextResponse.json(
        {
          message:
            "You are not authorized to mark attendance for this course",
        },
        { status: 403 }
      );
    }

    const attendanceDate = new Date(date);

    const attendance = await prisma.attendance.upsert({
      where: {
        enrollmentId_date: {
          enrollmentId: Number(enrollmentId),
          date: attendanceDate,
        },
      },
      update: {
        present,
      },
      create: {
        enrollmentId: Number(enrollmentId),
        date: attendanceDate,
        present,
      },
    });

    return NextResponse.json(
      {
        message: "Attendance saved successfully",
        attendance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mark attendance error:", error);

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

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Only students can view this attendance" },
        { status: 403 }
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        course: true,
        attendance: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

const attendanceData = enrollments.map(
  (enrollment: typeof enrollments[number]) => {      const totalClasses = enrollment.attendance.length;

      const attendedClasses = enrollment.attendance.filter(
(record: typeof enrollment.attendance[number]) => record.present      ).length;

      const percentage =
        totalClasses === 0
          ? 0
          : Number(
              ((attendedClasses / totalClasses) * 100).toFixed(2)
            );

      return {
        course: enrollment.course,
        totalClasses,
        attendedClasses,
        absentClasses: totalClasses - attendedClasses,
        percentage,
        warning: percentage < 75,
        attendance: enrollment.attendance,
      };
    });

    return NextResponse.json({
      attendance: attendanceData,
    });
  } catch (error) {
    console.error("Get attendance error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}