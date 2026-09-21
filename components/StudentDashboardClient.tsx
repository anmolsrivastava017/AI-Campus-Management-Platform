"use client";

import { useEffect, useMemo, useState } from "react";
import { socket } from "@/lib/socket";

type Course = {
  id: number;
  name: string;
  code: string;
  description?: string;
  faculty?: {
    name: string;
    email: string;
  };
  isEnrolled?: boolean;
};

type Attendance = {
  course: Course;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  percentage: number;
  warning: boolean;
  attendance?: {
    id: number;
    date: string;
    present: boolean;
  }[];
};

type Assignment = {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  courseId: number;
  course?: Course;
  submissions?: {
    studentId: number;
    status: string;
    grade?: number;
    feedback?: string;
  }[];
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  course?: Course;
  createdAt: string;
};

type Exam = {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  course?: Course;
};

type Result = {
  id: number;
  marks: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
  course?: Course;
  exam?: Exam;
  published: boolean;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
};

type StudentUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

const menu = [
  ["🏠", "Dashboard"],
  ["📚", "My Courses"],
  ["📊", "Attendance"],
  ["📝", "Assignments"],
  ["📅", "Exams"],
  ["🏆", "Results"],
  ["📢", "Announcements"],
  ["🔔", "Notifications"],
  ["🤖", "AI Assistant"],
];

function formatDate(date: string) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClasses(status: string) {
  switch (status?.toUpperCase()) {
    case "SUBMITTED":
      return "bg-blue-100 text-blue-700 border-blue-200";

    case "GRADED":
      return "bg-green-100 text-green-700 border-green-200";

    case "LATE":
      return "bg-red-100 text-red-700 border-red-200";

    case "PENDING":
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function getNotificationIcon(type?: string) {
  switch (type) {
    case "ATTENDANCE":
      return "📊";

    case "ASSIGNMENT":
      return "📝";

    case "RESULT":
      return "🏆";

    case "EXAM":
      return "📅";

    case "COMPLAINT":
      return "📩";

    case "ANNOUNCEMENT":
      return "📢";

    case "MESSAGE":
      return "💬";

    default:
      return "🔔";
  }
}

export default function StudentDashboardClient() {
  const [user, setUser] = useState<StudentUser | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [activeSection, setActiveSection] = useState("Dashboard");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] =
    useState<number | null>(null);
    const [aiInput, setAiInput] = useState("");
const [aiMessages, setAiMessages] = useState<
  { role: "user" | "assistant"; content: string }[]
>([]);
const [aiLoading, setAiLoading] = useState(false);
async function sendAIMessage() {
  if (!aiInput.trim() || aiLoading) {
    return;
  }

  const message = aiInput.trim();

  setAiMessages((previous) => [
    ...previous,
    {
      role: "user",
      content: message,
    },
  ]);

  setAiInput("");
  setAiLoading(true);

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "AI request failed");
    }

    setAiMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content: data.answer,
      },
    ]);
  } catch (error) {
    console.error("AI assistant error:", error);

    setAiMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content:
          "Sorry, I couldn't process your request right now.",
      },
    ]);
  } finally {
    setAiLoading(false);
  }
}

  async function loadData(showLoader = false) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const responses = await Promise.allSettled([
        fetch("/api/me"),
        fetch("/api/courses"),
        fetch("/api/attendance"),
        fetch("/api/assignments"),
        fetch("/api/announcements"),
        fetch("/api/exams"),
        fetch("/api/results"),
        fetch("/api/notifications"),
      ]);

      const [
        meResult,
        coursesResult,
        attendanceResult,
        assignmentsResult,
        announcementsResult,
        examsResult,
        resultsResult,
        notificationsResult,
      ] = responses;

      if (
        meResult.status === "fulfilled" &&
        meResult.value.ok
      ) {
        const data = await meResult.value.json();

const currentUser = data.user ?? data;

setUser(currentUser);

if (currentUser?.id) {
  socket.emit("join:user", currentUser.id);
}
      }

      if (
        coursesResult.status === "fulfilled" &&
        coursesResult.value.ok
      ) {
        const data = await coursesResult.value.json();
        setCourses(data.courses ?? []);
      }

      if (
        attendanceResult.status === "fulfilled" &&
        attendanceResult.value.ok
      ) {
        const data = await attendanceResult.value.json();
        setAttendance(data.attendance ?? []);
      }

      if (
        assignmentsResult.status === "fulfilled" &&
        assignmentsResult.value.ok
      ) {
        const data = await assignmentsResult.value.json();
        setAssignments(data.assignments ?? []);
      }

      if (
        announcementsResult.status === "fulfilled" &&
        announcementsResult.value.ok
      ) {
        const data = await announcementsResult.value.json();
        setAnnouncements(data.announcements ?? []);
      }

      if (
        examsResult.status === "fulfilled" &&
        examsResult.value.ok
      ) {
        const data = await examsResult.value.json();
        setExams(data.exams ?? []);
      }

      if (
        resultsResult.status === "fulfilled" &&
        resultsResult.value.ok
      ) {
        const data = await resultsResult.value.json();
        setResults(data.results ?? []);
      }

      if (
        notificationsResult.status === "fulfilled" &&
        notificationsResult.value.ok
      ) {
        const data = await notificationsResult.value.json();

        const loadedNotifications =
          data.notifications ?? [];

        setNotifications(loadedNotifications);
      }
    } catch (error) {
      console.error("Student dashboard load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(() => {
  socket.connect();

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  socket.on("notification:new", (notification) => {
    console.log("🔔 Real-time notification:", notification);

    setNotifications((previous) => [
      notification,
      ...previous,
    ]);
  });
  socket.on("announcement:new", (announcement) => {
  console.log("📢 Real-time announcement:", announcement);

  setAnnouncements((previous) => [
    announcement,
    ...previous,
  ]);
});

  return () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("notification:new");
    socket.off("announcement:new");
    socket.disconnect();
  };
}, []);

  useEffect(() => {
    loadData(true);
  }, []);
  useEffect(() => {
  if (activeSection === "Notifications") {
    markAllNotificationsAsRead();
  }
}, [activeSection]);
  async function markAllNotificationsAsRead() {
  const hasUnread = notifications.some(
    (notification) => !notification.isRead
  );

  if (!hasUnread) {
    return;
  }

  try {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        markAll: true,
      }),
    });

    if (!response.ok) {
      return;
    }

    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
  } catch (error) {
    console.error(
      "Mark notifications as read error:",
      error
    );
  }
}

  async function enroll(courseId: number) {
    try {
      const response = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to enroll");
        return;
      }

      alert("Course enrolled successfully.");

      await loadData(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  async function submitAssignment(assignmentId: number) {
    const content = window.prompt(
      "Enter your assignment submission:"
    );

    if (!content?.trim()) {
      return;
    }

    try {
      setSubmittingAssignment(assignmentId);

      const response = await fetch(
        `/api/assignments/${assignmentId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Submission failed");
        return;
      }

      alert("Assignment submitted successfully.");

      await loadData(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSubmittingAssignment(null);
    }
  }

  async function logout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/login/student";
    }
  }

  const enrolledCourses = useMemo(
    () => courses.filter((course) => course.isEnrolled),
    [courses]
  );

  const averageAttendance = useMemo(() => {
    if (attendance.length === 0) {
      return 0;
    }

    return Math.round(
      attendance.reduce(
        (sum, item) => sum + item.percentage,
        0
      ) / attendance.length
    );
  }, [attendance]);

  const pendingAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const submission = assignment.submissions?.[0];

      return (
        !submission ||
        submission.status === "PENDING"
      );
    }).length;
  }, [assignments]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.isRead
    ).length;
  }, [notifications]);

  const upcomingExams = useMemo(() => {
    return [...exams]
      .filter(
        (exam) =>
          new Date(exam.date).getTime() >=
          new Date().setHours(0, 0, 0, 0)
      )
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );
  }, [exams]);

  const latestNotifications = notifications.slice(0, 5);

  const latestAnnouncements = announcements.slice(0, 5);

  const publishedResults = results.filter(
    (result) => result.published
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl mx-auto animate-pulse shadow-2xl shadow-blue-600/30">
            🎓
          </div>

          <h2 className="text-white text-xl font-bold mt-5">
            Loading Student Portal...
          </h2>

          <p className="text-slate-400 mt-2">
            Preparing your academic dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950 text-white px-4 py-3 flex items-center justify-between shadow-xl">
        <button
          onClick={() => setMobileMenu(true)}
          className="h-11 w-11 rounded-xl bg-slate-800 flex items-center justify-center text-xl"
        >
          ☰
        </button>

        <div className="font-black">
          Student Portal
        </div>

        <button
          onClick={() => setActiveSection("Notifications")}
          className="relative h-11 w-11 rounded-xl bg-slate-800 flex items-center justify-center"
        >
          🔔

          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadNotifications > 9
                ? "9+"
                : unreadNotifications}
            </span>
          )}
        </button>
      </div>

      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenu(false)}
          />

          <aside className="relative w-80 max-w-[85%] h-full bg-slate-950 text-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-blue-400 text-xs font-bold tracking-widest">
                  AI CAMPUS
                </p>

                <h2 className="text-2xl font-black mt-1">
                  Student Portal
                </h2>
              </div>

              <button
                onClick={() => setMobileMenu(false)}
                className="h-10 w-10 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {menu.map(([icon, label]) => (
                <button
                  key={label}
                  onClick={() => {
                    setActiveSection(label);
                    setMobileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition ${
                    activeSection === label
                      ? "bg-blue-600 shadow-lg shadow-blue-600/20"
                      : "hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg">
                    {icon}
                  </span>

                  <span className="font-semibold">
                    {label}
                  </span>

                  {label === "Notifications" &&
                    unreadNotifications > 0 && (
                      <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                        {unreadNotifications}
                      </span>
                    )}
                </button>
              ))}
            </div>

            <button
              onClick={logout}
              className="w-full mt-8 bg-red-600 hover:bg-red-700 px-4 py-3.5 rounded-xl font-bold transition"
            >
              🚪 Logout
            </button>
          </aside>
        </div>
      )}

      <aside className="hidden md:flex w-72 bg-slate-950 text-white h-screen p-5 flex-col sticky top-0 overflow-hidden">
        <div className="mb-8">
          <p className="text-blue-400 text-xs font-bold tracking-[0.2em]">
            AI CAMPUS
          </p>

          <h1 className="text-2xl font-black mt-1">
            Student Portal
          </h1>

          <p className="text-slate-500 text-sm mt-2">
            Academic management system
          </p>
        </div>

        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {menu.map(([icon, label]) => (
            <button
              key={label}
              onClick={() => setActiveSection(label)}
              className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition ${
                activeSection === label
                  ? "bg-blue-600 shadow-lg shadow-blue-600/20"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="text-lg">
                {icon}
              </span>

              <span className="font-semibold">
                {label}
              </span>

              {label === "Notifications" &&
                unreadNotifications > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-5">
          <div className="bg-slate-900 rounded-2xl p-4 mb-4">
            <p className="text-xs text-slate-500">
              Logged in as
            </p>

            <p className="font-bold mt-1 truncate">
              {user?.name}
            </p>

            <p className="text-xs text-slate-500 truncate mt-1">
              {user?.email}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-bold transition"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pt-16 md:pt-0">
        <header className="bg-white border-b border-slate-200 px-5 md:px-8 py-5 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-blue-600 text-xs font-black tracking-widest">
                STUDENT PORTAL
              </p>

              <h1 className="text-2xl md:text-3xl font-black text-slate-950 mt-1">
                {activeSection}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData(false)}
                disabled={refreshing}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 transition disabled:opacity-50"
              >
                <span
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                >
                  ↻
                </span>
                Refresh
              </button>

              <button
                onClick={() =>
                  setActiveSection("Notifications")
                }
                className="relative h-11 w-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
              >
                🔔

                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {unreadNotifications > 9
                      ? "9+"
                      : unreadNotifications}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                  {user?.name
                    ?.charAt(0)
                    .toUpperCase() ?? "S"}
                </div>

                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {user?.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    Student
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8">
          {activeSection === "Dashboard" && (
            <div className="space-y-7">
              <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-7 md:p-9 text-white shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                  <p className="text-blue-300 font-bold text-sm">
                    GOOD TO SEE YOU
                  </p>

                  <h2 className="text-3xl md:text-4xl font-black mt-2">
                    Welcome back, {user?.name} 👋
                  </h2>

                  <p className="text-slate-300 mt-3 leading-7">
                    Keep track of your courses, attendance,
                    assignments, exams and academic performance
                    from one place.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      onClick={() =>
                        setActiveSection("My Courses")
                      }
                      className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold transition"
                    >
                      📚 View Courses
                    </button>

                    <button
                      onClick={() =>
                        setActiveSection("Notifications")
                      }
                      className="bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-3 rounded-xl font-bold transition"
                    >
                      🔔 Notifications
                    </button>
                  </div>
                </div>

                <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute -right-20 -bottom-32 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
              </section>

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <button
                  onClick={() =>
                    setActiveSection("My Courses")
                  }
                  className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
                      📚
                    </div>

                    <span className="text-slate-400 group-hover:text-blue-600 transition">
                      →
                    </span>
                  </div>

                  <div className="text-3xl font-black text-slate-950 mt-5">
                    {enrolledCourses.length}
                  </div>

                  <p className="text-slate-500 font-semibold mt-1">
                    My Courses
                  </p>
                </button>

                <button
                  onClick={() =>
                    setActiveSection("Attendance")
                  }
                  className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl">
                      📊
                    </div>

                    <span className="text-slate-400 group-hover:text-emerald-600 transition">
                      →
                    </span>
                  </div>

                  <div className="text-3xl font-black text-slate-950 mt-5">
                    {averageAttendance}%
                  </div>

                  <p className="text-slate-500 font-semibold mt-1">
                    Average Attendance
                  </p>
                </button>

                <button
                  onClick={() =>
                    setActiveSection("Assignments")
                  }
                  className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">
                      📝
                    </div>

                    <span className="text-slate-400 group-hover:text-amber-600 transition">
                      →
                    </span>
                  </div>

                  <div className="text-3xl font-black text-slate-950 mt-5">
                    {pendingAssignments}
                  </div>

                  <p className="text-slate-500 font-semibold mt-1">
                    Pending Assignments
                  </p>
                </button>

                <button
                  onClick={() =>
                    setActiveSection("Notifications")
                  }
                  className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl">
                      🔔
                    </div>

                    <span className="text-slate-400 group-hover:text-purple-600 transition">
                      →
                    </span>
                  </div>

                  <div className="text-3xl font-black text-slate-950 mt-5">
                    {unreadNotifications}
                  </div>

                  <p className="text-slate-500 font-semibold mt-1">
                    Unread Notifications
                  </p>
                </button>
              </div>

              <div className="grid xl:grid-cols-2 gap-6">
                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-blue-600 text-xs font-black tracking-widest">
                        ACADEMICS
                      </p>

                      <h2 className="text-xl font-black text-slate-950 mt-1">
                        My Courses
                      </h2>
                    </div>

                    <button
                      onClick={() =>
                        setActiveSection("My Courses")
                      }
                      className="text-blue-600 font-bold text-sm hover:underline"
                    >
                      View all →
                    </button>
                  </div>

                  {enrolledCourses.length === 0 ? (
                    <EmptyState
                      icon="📚"
                      title="No enrolled courses"
                      message="You haven't enrolled in any course yet."
                    />
                  ) : (
                    <div className="space-y-3">
                      {enrolledCourses
                        .slice(0, 4)
                        .map((course) => (
                          <div
                            key={course.id}
                            className="border border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs text-blue-600 font-black">
                                  {course.code}
                                </p>

                                <h3 className="font-bold text-slate-950 mt-1">
                                  {course.name}
                                </h3>

                                <p className="text-sm text-slate-500 mt-1">
                                  Faculty:{" "}
                                  {course.faculty?.name ??
                                    "Not available"}
                                </p>
                              </div>

                              <span className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                📚
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </section>

                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-purple-600 text-xs font-black tracking-widest">
                        UPDATES
                      </p>

                      <h2 className="text-xl font-black text-slate-950 mt-1">
                        Recent Notifications
                      </h2>
                    </div>

                    <button
                      onClick={() =>
                        setActiveSection("Notifications")
                      }
                      className="text-blue-600 font-bold text-sm hover:underline"
                    >
                      View all →
                    </button>
                  </div>

                  {latestNotifications.length === 0 ? (
                    <EmptyState
                      icon="🔔"
                      title="No notifications"
                      message="New academic updates will appear here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {latestNotifications.map(
                        (notification) => (
                          <div
                            key={notification.id}
                            className={`rounded-2xl p-4 border ${
                              notification.isRead
                                ? "bg-slate-50 border-slate-200"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                {getNotificationIcon(
                                  notification.type
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-slate-950">
                                    {notification.title}
                                  </h3>

                                  {!notification.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                                  )}
                                </div>

                                <p className="text-sm text-slate-600 mt-1">
                                  {notification.message}
                                </p>

                                <p className="text-xs text-slate-400 mt-2">
                                  {formatDateTime(
                                    notification.createdAt
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              </div>

              <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-orange-600 text-xs font-black tracking-widest">
                      CAMPUS UPDATES
                    </p>

                    <h2 className="text-xl font-black text-slate-950 mt-1">
                      Recent Announcements
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setActiveSection("Announcements")
                    }
                    className="text-blue-600 font-bold text-sm hover:underline"
                  >
                    View all →
                  </button>
                </div>

                {latestAnnouncements.length === 0 ? (
                  <EmptyState
                    icon="📢"
                    title="No announcements"
                    message="There are no announcements available right now."
                  />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {latestAnnouncements.map(
                      (announcement) => (
                        <div
                          key={announcement.id}
                          className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-11 rounded-xl bg-orange-100 flex items-center justify-center text-xl shrink-0">
                              📢
                            </div>

                            <div>
                              <h3 className="font-bold text-slate-950">
                                {announcement.title}
                              </h3>

                              <p className="text-sm text-slate-500 mt-1">
                                {announcement.course?.name ??
                                  "Campus Announcement"}
                              </p>
                            </div>
                          </div>

                          <p className="text-slate-600 text-sm leading-6 mt-4">
                            {announcement.content}
                          </p>

                          <p className="text-xs text-slate-400 mt-4">
                            {formatDateTime(
                              announcement.createdAt
                            )}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeSection === "My Courses" && (
            <div className="space-y-6">
              <SectionHeader
                eyebrow="ACADEMIC COURSES"
                title="My Courses"
                description="View your enrolled courses and available courses."
              />

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <span className="inline-flex bg-blue-100 text-blue-700 text-xs font-black px-3 py-1.5 rounded-lg">
                          {course.code}
                        </span>

                        <h3 className="text-xl font-black text-slate-950 mt-4">
                          {course.name}
                        </h3>
                      </div>

                      <span className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center text-xl shrink-0">
                        📚
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mt-4 leading-6 min-h-12">
                      {course.description ??
                        "No description available."}
                    </p>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-sm text-slate-500">
                        Faculty
                      </p>

                      <p className="font-bold text-slate-900 mt-1">
                        {course.faculty?.name ??
                          "Not assigned"}
                      </p>
                    </div>

                    {course.isEnrolled ? (
                      <div className="mt-5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm">
                          <span className="h-2 w-2 bg-emerald-500 rounded-full" />
                          Enrolled
                        </span>

                        <span className="text-xs text-slate-400">
                          Active
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => enroll(course.id)}
                        className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-600/20"
                      >
                        Enroll in Course
                      </button>
                    )}
                  </div>
                ))}

                {courses.length === 0 && (
                  <div className="md:col-span-2 xl:col-span-3">
                    <EmptyState
                      icon="📚"
                      title="No courses available"
                      message="Courses assigned by faculty will appear here."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "Attendance" && (
            <div className="space-y-6">
              <SectionHeader
                eyebrow="ACADEMIC PERFORMANCE"
                title="Attendance"
                description="Track your attendance course by course."
              />

              {attendance.length === 0 ? (
                <EmptyState
                  icon="📊"
                  title="No attendance data"
                  message="Attendance records will appear once your faculty marks attendance."
                />
              ) : (
                <div className="grid lg:grid-cols-2 gap-5">
                  {attendance.map((item) => (
                    <div
                      key={item.course.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-black text-blue-600">
                            {item.course.code}
                          </span>

                          <h3 className="text-xl font-black text-slate-950 mt-1">
                            {item.course.name}
                          </h3>
                        </div>

                        <div
                          className={`h-16 w-16 rounded-2xl flex items-center justify-center text-lg font-black ${
                            item.warning
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.percentage}%
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">
                            Attendance progress
                          </span>

                          <span className="font-bold text-slate-800">
                            {item.percentage}%
                          </span>
                        </div>

                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.warning
                                ? "bg-red-500"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                item.percentage,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-6">
                        <StatMini
                          label="Total"
                          value={item.totalClasses}
                        />

                        <StatMini
                          label="Present"
                          value={item.attendedClasses}
                        />

                        <StatMini
                          label="Absent"
                          value={item.absentClasses}
                        />
                      </div>

                      {item.warning ? (
                        <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-semibold">
                          ⚠️ Your attendance is below 75%.
                          Please attend upcoming classes regularly.
                        </div>
                      ) : (
                        <div className="mt-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-semibold">
                          ✓ Your attendance is above the
                          required 75% threshold.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "Assignments" && (
            <div className="space-y-6">
              <SectionHeader
                eyebrow="ACADEMIC WORK"
                title="Assignments"
                description="View assignments, deadlines and submission status."
              />

              {assignments.length === 0 ? (
                <EmptyState
                  icon="📝"
                  title="No assignments"
                  message="New assignments from your faculty will appear here."
                />
              ) : (
                <div className="grid lg:grid-cols-2 gap-5">
                  {assignments.map((assignment) => {
                    const submission =
                      assignment.submissions?.[0];

                    const status =
                      submission?.status ?? "PENDING";

                    return (
                      <div
                        key={assignment.id}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-xs font-black text-blue-600">
                              {assignment.course?.code ??
                                "COURSE"}
                            </span>

                            <h3 className="text-xl font-black text-slate-950 mt-2">
                              {assignment.title}
                            </h3>

                            <p className="text-sm text-slate-500 mt-1">
                              {assignment.course?.name}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 border px-3 py-1.5 rounded-xl text-xs font-black ${getStatusClasses(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </div>

                        <p className="text-slate-600 leading-6 mt-5">
                          {assignment.description ??
                            "No description provided."}
                        </p>

                        <div className="mt-5 bg-slate-50 rounded-2xl p-4">
                          <p className="text-xs text-slate-500">
                            Due Date
                          </p>

                          <p className="font-bold text-slate-900 mt-1">
                            {formatDateTime(
                              assignment.dueDate
                            )}
                          </p>
                        </div>

                        {!submission ||
                        submission.status === "PENDING" ? (
                          <button
                            onClick={() =>
                              submitAssignment(assignment.id)
                            }
                            disabled={
                              submittingAssignment ===
                              assignment.id
                            }
                            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition disabled:opacity-50"
                          >
                            {submittingAssignment ===
                            assignment.id
                              ? "Submitting..."
                              : "Submit Assignment"}
                          </button>
                        ) : (
                          <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                            <p className="font-bold text-emerald-800">
                              ✓ Assignment submitted
                            </p>

                            {submission.grade !==
                              undefined && (
                              <p className="text-sm text-emerald-700 mt-2">
                                Grade:{" "}
                                <b>{submission.grade}</b>
                              </p>
                            )}

                            {submission.feedback && (
                              <p className="text-sm text-slate-600 mt-2">
                                Feedback:{" "}
                                {submission.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSection === "Exams" && (
            <div className="space-y-6">
              <SectionHeader
                eyebrow="EXAMINATION"
                title="Exam Timetable"
                description="View your upcoming examination schedule."
              />

              {exams.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title="No exams scheduled"
                  message="Your exam schedule will appear here once published."
                />
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition"
                    >
                      <div className="bg-slate-950 text-white p-5">
                        <p className="text-blue-300 text-xs font-black">
                          {exam.course?.code ??
                            "EXAMINATION"}
                        </p>

                        <h3 className="text-xl font-black mt-2">
                          {exam.title}
                        </h3>
                      </div>

                      <div className="p-5 space-y-4">
                        <InfoRow
                          icon="📅"
                          label="Date"
                          value={formatDate(exam.date)}
                        />

                        <InfoRow
                          icon="⏰"
                          label="Time"
                          value={`${exam.startTime ?? "--"} - ${
                            exam.endTime ?? "--"
                          }`}
                        />

                        <InfoRow
                          icon="🏫"
                          label="Room"
                          value={exam.room ?? "Not assigned"}
                        />

                        {exam.description && (
                          <p className="text-sm text-slate-600 leading-6 pt-2 border-t border-slate-100">
                            {exam.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "Results" && (
            <div className="space-y-6">
              <SectionHeader
                eyebrow="ACADEMIC PERFORMANCE"
                title="Results"
                description="View your published examination results."
              />

              {publishedResults.length === 0 ? (
                <EmptyState
                  icon="🏆"
                  title="No results published"
                  message="Your published results will appear here."
                />
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {publishedResults.map((result) => {
                    const percentage =
                      result.maxMarks > 0
                        ? Math.round(
                            (result.marks /
                              result.maxMarks) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={result.id}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition"
                      >
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="text-xs text-blue-600 font-black">
                              {result.course?.code}
                            </p>

                            <h3 className="font-black text-xl text-slate-950 mt-1">
                              {result.course?.name}
                            </h3>
                          </div>

                          <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-xl">
                            🏆
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="text-3xl font-black text-slate-950">
                            {result.marks}
                            <span className="text-lg text-slate-400">
                              {" "}
                              / {result.maxMarks}
                            </span>
                          </div>

                          <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${Math.min(
                                  percentage,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <p className="text-sm text-slate-500 mt-2">
                            {percentage}% score
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
  <p className="text-sm text-slate-950">
    <span className="font-bold text-slate-800">
      Grade:
    </span>{" "}
    <b className="font-black text-slate-950">
      {result.grade ?? "-"}
    </b>
  </p>

  <p className="text-sm text-slate-950">
    <span className="font-bold text-slate-800">
      Remarks:
    </span>{" "}
    <span className="font-semibold text-slate-950">
      {result.remarks ?? "-"}
    </span>
  </p>
</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {activeSection === "Announcements" && (
            <div className="space-y-6">
              <SectionHeader
                eyebrow="CAMPUS UPDATES"
                title="Announcements"
                description="Stay updated with announcements from your faculty."
              />

              {announcements.length === 0 ? (
                <EmptyState
                  icon="📢"
                  title="No announcements"
                  message="Announcements published by faculty will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition"
                    >
                      <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-xl shrink-0">
                          📢
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                            <div>
                              <h3 className="text-xl font-black text-slate-950">
                                {announcement.title}
                              </h3>

                              <p className="text-sm text-blue-600 font-semibold mt-1">
                                {announcement.course
                                  ?.name ??
                                  "Campus Announcement"}
                              </p>
                            </div>

                            <span className="text-xs text-slate-400">
                              {formatDateTime(
                                announcement.createdAt
                              )}
                            </span>
                          </div>

                          <p className="text-slate-600 leading-7 mt-5">
                            {announcement.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "Notifications" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-7 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div>
                    <p className="text-blue-200 text-xs font-black tracking-widest">
                      REAL-TIME UPDATES
                    </p>

                    <h2 className="text-3xl font-black mt-2">
                      Your Notifications 🔔
                    </h2>

                    <p className="text-blue-100 mt-2">
                      Stay updated with attendance, assignments,
                      results, exams and announcements.
                    </p>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4">
                    <p className="text-blue-100 text-xs">
                      Unread
                    </p>

                    <p className="text-3xl font-black">
                      {unreadNotifications}
                    </p>
                  </div>
                </div>
              </div>

              {notifications.length === 0 ? (
                <EmptyState
                  icon="🔔"
                  title="No notifications yet"
                  message="When faculty creates announcements, assignments, exams, results or attendance updates, your notifications will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`bg-white border rounded-3xl p-5 md:p-6 shadow-sm transition hover:shadow-md ${
                        notification.isRead
                          ? "border-slate-200"
                          : "border-blue-300 bg-blue-50/40"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center text-xl ${
                            notification.isRead
                              ? "bg-slate-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {getNotificationIcon(
                            notification.type
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-lg text-slate-950">
                                {notification.title}
                              </h3>

                              {!notification.isRead && (
                                <span className="text-[10px] uppercase tracking-wider font-black bg-blue-600 text-white px-2 py-1 rounded-full">
                                  New
                                </span>
                              )}
                            </div>

                            <span className="text-xs text-slate-400 shrink-0">
                              {formatDateTime(
                                notification.createdAt
                              )}
                            </span>
                          </div>

                          <p className="text-slate-600 leading-6 mt-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => loadData(false)}
                disabled={refreshing}
                className="w-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-2xl py-4 font-bold text-slate-700 transition disabled:opacity-50"
              >
                {refreshing
                  ? "Refreshing notifications..."
                  : "↻ Refresh Notifications"}
              </button>
            </div>
          )}

          {activeSection === "AI Assistant" && (
  <section className="space-y-6">
    <div>
      <h2 className="text-3xl font-black text-slate-900">
        🤖 AI Campus Assistant
      </h2>

      <p className="mt-2 text-slate-500">
        Ask anything about your courses, assignments, exams,
        attendance, results or studies.
      </p>
    </div>

    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-200 bg-slate-900 px-6 py-5">
        <h3 className="font-bold text-white">
          AI Assistant
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Powered by GEMINI
        </p>
      </div>

      <div className="min-h-[400px] max-h-[500px] space-y-4 overflow-y-auto bg-slate-50 p-6">
        {aiMessages.length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center text-center">
            <div>
              <div className="mb-4 text-5xl">🤖</div>

              <h3 className="text-xl font-bold text-slate-900">
                How can I help you?
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Ask me about attendance, assignments, exams,
                courses or study topics.
              </p>
            </div>
          </div>
        ) : (
          aiMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-900 shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}

        {aiLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              🤖 Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={aiInput}
            onChange={(event) => setAiInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendAIMessage();
              }
            }}
            placeholder="Ask the AI Campus Assistant..."
            disabled={aiLoading}
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={sendAIMessage}
            disabled={aiLoading || !aiInput.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  </section>
)}
        </div>
      </main>
    </div>
  );
}


function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-blue-600 text-xs font-black tracking-widest">
        {eyebrow}
      </p>

      <h2 className="text-3xl font-black text-slate-950 mt-1">
        {title}
      </h2>

      <p className="text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: string;
  title: string;
  message: string;
}) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mx-auto">
        {icon}
      </div>

      <h3 className="font-black text-xl text-slate-950 mt-5">
        {title}
      </h3>

      <p className="text-slate-500 mt-2 max-w-md mx-auto leading-6">
        {message}
      </p>
    </div>
  );
}

function StatMini({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 text-center">
      <p className="text-2xl font-black text-slate-950">
        {value}
      </p>

      <p className="text-xs text-slate-500 font-semibold mt-1">
        {label}
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <p className="font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function AIFeature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
      <div className="text-xl">
        {icon}
      </div>

      <p className="font-bold mt-3">
        {title}
      </p>

      <p className="text-xs text-slate-400 mt-1">
        {text}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-slate-200 rounded-2xl p-5">
      <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
        {icon}
      </div>

      <h4 className="font-black text-slate-950 mt-4">
        {title}
      </h4>

      <p className="text-sm text-slate-500 leading-6 mt-1">
        {text}
      </p>
    </div>
  );
}