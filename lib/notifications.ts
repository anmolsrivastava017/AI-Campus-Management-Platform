import { prisma } from "@/lib/prisma";

type NotificationType =
  | "ANNOUNCEMENT"
  | "ASSIGNMENT"
  | "EXAM"
  | "RESULT"
  | "ATTENDANCE"
  | "COMPLAINT"
  | "MESSAGE"
  | "GENERAL";

export async function createNotification({
  userId,
  title,
  message,
  type = "GENERAL",
}: {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
}) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
  });
}

export async function createNotificationsForStudents({
  studentIds,
  title,
  message,
  type = "GENERAL",
}: {
  studentIds: number[];
  title: string;
  message: string;
  type?: NotificationType;
}) {
  if (studentIds.length === 0) {
    return;
  }

  return prisma.notification.createMany({
    data: studentIds.map((studentId) => ({
      userId: studentId,
      title,
      message,
      type,
    })),
  });
}

export async function getCourseStudentIds(courseId: number) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
    },
    select: {
      studentId: true,
    },
  });

  return enrollments.map((enrollment) => enrollment.studentId);
}

export async function getAllStudentIds() {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
    },
    select: {
      id: true,
    },
  });

  return students.map((student) => student.id);
}