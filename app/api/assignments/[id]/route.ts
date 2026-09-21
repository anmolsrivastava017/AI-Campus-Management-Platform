import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== "FACULTY") {
      return NextResponse.json(
        { message: "Only faculty can update complaints" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { status } = await request.json();

    const allowedStatuses = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "ASSIGNED",
      "RESOLVED",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid complaint status" },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        id: Number(id),
        facultyId: user.id,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { message: "Complaint not found or unauthorized" },
        { status: 404 }
      );
    }

    const updatedComplaint = await prisma.complaint.update({
      where: {
        id: Number(id),
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      message: "Complaint updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}