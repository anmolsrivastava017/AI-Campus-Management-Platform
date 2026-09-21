"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY";
};

type Course = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  faculty?: {
    id: number;
    name: string;
    email: string;
  };
  enrollments?: {
    id: number;
    student?: {
      id: number;
      name: string;
      email: string;
    };
  }[];
};

type Student = {
  id: number;
  name: string;
  email: string;
  status?: string;
  courses?: {
    id: number;
    name: string;
    code: string;
  }[];
};

type Assignment = {
  id: number;
  title: string;
  description?: string | null;
  dueDate: string;
  course?: Course;
  submissions?: {
    id: number;
    status: string;
    grade?: number | null;
    feedback?: string | null;
    student?: {
      id: number;
      name: string;
      email: string;
    };
  }[];
};

type Complaint = {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  student?: {
    id: number;
    name: string;
    email: string;
  };
  faculty?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  course?: Course | null;
};

type Material = {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  type: string;
  createdAt: string;
  course?: Course;
};

type Exam = {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  course?: Course;
  results?: {
    id: number;
  }[];
};

type Result = {
  id: number;
  marks: number;
  maxMarks: number;
  grade?: string | null;
  remarks?: string | null;
  published: boolean;
  createdAt: string;
  student?: {
    id: number;
    name: string;
    email: string;
  };
  course?: Course;
  exam?: Exam | null;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type Section =
  | "Dashboard"
  | "My Courses"
  | "Students"
  | "Attendance"
  | "Assignments"
  | "Materials"
  | "Announcements"
  | "Exams"
  | "Results"
  | "Complaints"
  | "Notifications"
  | "AI Assistant"
  | "RAG Documents";

export default function FacultyDashboardClient() {
  const [user, setUser] = useState<User | null>(null);

  const [activeSection, setActiveSection] =
    useState<Section>("Dashboard");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [mobileMenu, setMobileMenu] = useState(false);

  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    courseId: "",
  });

  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    url: "",
    type: "DOCUMENT",
    courseId: "",
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    courseId: "",
  });

  const [examForm, setExamForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    room: "",
    courseId: "",
  });

  const [resultForm, setResultForm] = useState({
    studentId: "",
    courseId: "",
    examId: "",
    marks: "",
    maxMarks: "",
    grade: "",
    remarks: "",
    published: true,
  });

  const [complaintForm, setComplaintForm] = useState({
    studentId: "",
    title: "",
    description: "",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    enrollmentId: "",
    date: new Date().toISOString().split("T")[0],
    present: true,
  });
  const [ragFile, setRagFile] = useState<File | null>(null);
  const [ragUploading, setRagUploading] = useState(false);
  const [aiInput, setAiInput] = useState("");
const [aiMessages, setAiMessages] = useState<
  { role: "user" | "assistant"; content: string }[]
>([]);
const [aiLoading, setAiLoading] = useState(false);

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);
  }

  function showError(message: string) {
    setErrorMessage(message);
    setSuccessMessage("");

    window.setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  }

  async function getJSON(url: string): Promise<any> {
    const response = await fetch(url, {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Something went wrong"
      );
    }

    return data;
  }

  async function postJSON(url: string, body: any) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Something went wrong"
      );
    }

    return data;
  }

  async function loadAllData(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [
        meData,
        coursesData,
        studentsData,
        assignmentsData,
        complaintsData,
        announcementsData,
        materialsData,
        examsData,
        resultsData,
        notificationsData,
      ] = await Promise.all([
        getJSON("/api/me"),
        getJSON("/api/courses"),
        getJSON("/api/students"),
        getJSON("/api/assignments"),
        getJSON("/api/complaints"),
        getJSON("/api/announcements"),
        getJSON("/api/materials"),
        getJSON("/api/exams"),
        getJSON("/api/results"),
        getJSON("/api/notifications"),
      ]);

      setUser(meData.user || meData);

      setCourses(coursesData.courses || []);
      setStudents(studentsData.students || []);
      setAssignments(
        assignmentsData.assignments || []
      );
      setComplaints(
        complaintsData.complaints || []
      );
      setAnnouncements(
        announcementsData.announcements || []
      );
      setMaterials(
        materialsData.materials || []
      );
      setExams(examsData.exams || []);
      setResults(resultsData.results || []);
      setNotifications(
        notificationsData.notifications || []
      );
    } catch (error) {
      console.error(error);

      showError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard"
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);


  async function notifyStudents(
    studentIds: number[],
    title: string,
    message: string,
    type: string
  ) {
    const uniqueIds = [...new Set(studentIds)];

    if (uniqueIds.length === 0) {
      return;
    }

    await Promise.allSettled(
      uniqueIds.map((studentId) =>
        postJSON("/api/notifications", {
          userId: studentId,
          title,
          message,
          type,
        })
      )
    );
  }

  function getCourseStudents(courseId: number) {
    const course = courses.find(
      (item) => item.id === courseId
    );

    return (
      course?.enrollments
        ?.map((item) => item.student?.id)
        .filter(
          (id): id is number =>
            typeof id === "number"
        ) || []
    );
  }

  function openSection(section: Section) {
    setActiveSection(section);
    setMobileMenu(false);
    setSuccessMessage("");
    setErrorMessage("");
  }


  async function createCourse(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!courseForm.name || !courseForm.code) {
      showError(
        "Course name and course code are required."
      );
      return;
    }

    try {
      setSaving(true);

      await postJSON("/api/courses", {
        name: courseForm.name,
        code: courseForm.code,
        description: courseForm.description,
      });

      setCourseForm({
        name: "",
        code: "",
        description: "",
      });

      await loadAllData(false);

      showSuccess(
        "Course created successfully."
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to create course"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createAssignment(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !assignmentForm.title ||
      !assignmentForm.dueDate ||
      !assignmentForm.courseId
    ) {
      showError(
        "Title, due date and course are required."
      );
      return;
    }

    try {
      setSaving(true);

      await postJSON("/api/assignments", {
        title: assignmentForm.title,
        description:
          assignmentForm.description,
        dueDate: assignmentForm.dueDate,
        courseId: Number(
          assignmentForm.courseId
        ),
      });

      const studentIds = getCourseStudents(
        Number(assignmentForm.courseId)
      );

      await notifyStudents(
        studentIds,
        "New Assignment",
        `${assignmentForm.title} has been added.`,
        "ASSIGNMENT"
      );

      setAssignmentForm({
        title: "",
        description: "",
        dueDate: "",
        courseId: "",
      });

      await loadAllData(false);

      showSuccess(
        "Assignment created successfully."
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to create assignment"
      );
    } finally {
      setSaving(false);
    }
  }
  async function uploadRAGDocument() {
  if (!ragFile) {
    showError("Please select a PDF file.");
    return;
  }

  if (ragFile.type !== "application/pdf") {
    showError("Only PDF files are allowed.");
    return;
  }

  try {
    setRagUploading(true);

    const formData = new FormData();
    formData.append("file", ragFile);

    const response = await fetch("/api/rag/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "RAG upload failed");
    }

    showSuccess(
      `PDF uploaded successfully. ${data.chunkCount} chunks created.`
    );

    setRagFile(null);

    const fileInput = document.getElementById(
      "rag-file"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  } catch (error) {
    console.error("RAG upload error:", error);

    showError(
      error instanceof Error
        ? error.message
        : "Failed to upload RAG document."
    );
  } finally {
    setRagUploading(false);
  }
}

  async function createMaterial(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !materialForm.title ||
      !materialForm.url ||
      !materialForm.courseId
    ) {
      showError(
        "Title, URL and course are required."
      );
      return;
    }

    try {
      setSaving(true);

      await postJSON("/api/materials", {
        title: materialForm.title,
        description:
          materialForm.description,
        url: materialForm.url,
        type: materialForm.type,
        courseId: Number(
          materialForm.courseId
        ),
      });

      const studentIds = getCourseStudents(
        Number(materialForm.courseId)
      );

      await notifyStudents(
        studentIds,
        "New Study Material",
        `${materialForm.title} has been added.`,
        "GENERAL"
      );

      setMaterialForm({
        title: "",
        description: "",
        url: "",
        type: "DOCUMENT",
        courseId: "",
      });

      await loadAllData(false);

      showSuccess(
        "Study material added successfully."
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to add material"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createAnnouncement(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !announcementForm.title ||
      !announcementForm.content
    ) {
      showError(
        "Announcement title and content are required."
      );
      return;
    }

    try {
      setSaving(true);

      await postJSON("/api/announcements", {
        title: announcementForm.title,
        content: announcementForm.content,
        courseId: announcementForm.courseId
          ? Number(announcementForm.courseId)
          : null,
      });

      let studentIds: number[] = [];

      if (announcementForm.courseId) {
        studentIds = getCourseStudents(
          Number(announcementForm.courseId)
        );
      } else {
        studentIds = students.map(
          (student) => student.id
        );
      }

      await notifyStudents(
        studentIds,
        "New Announcement",
        announcementForm.title,
        "ANNOUNCEMENT"
      );

      setAnnouncementForm({
        title: "",
        content: "",
        courseId: "",
      });

      await loadAllData(false);

      showSuccess(
        "Announcement published successfully."
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to create announcement"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createExam(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !examForm.title ||
      !examForm.date ||
      !examForm.courseId
    ) {
      showError(
        "Exam title, date and course are required."
      );
      return;
    }

    try {
      setSaving(true);

      await postJSON("/api/exams", {
        title: examForm.title,
        description: examForm.description,
        date: examForm.date,
        startTime: examForm.startTime,
        endTime: examForm.endTime,
        room: examForm.room,
        courseId: Number(examForm.courseId),
      });

      const studentIds = getCourseStudents(
        Number(examForm.courseId)
      );

      await notifyStudents(
        studentIds,
        "New Exam Scheduled",
        `${examForm.title} has been scheduled.`,
        "EXAM"
      );

      setExamForm({
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        room: "",
        courseId: "",
      });

      await loadAllData(false);

      showSuccess(
        "Exam scheduled successfully."
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to create exam"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createResult(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !resultForm.studentId ||
      !resultForm.courseId ||
      resultForm.marks === "" ||
      resultForm.maxMarks === ""
    ) {
      showError(
        "Student, course, marks and maximum marks are required."
      );
      return;
    }

    if (
      Number(resultForm.marks) >
      Number(resultForm.maxMarks)
    ) {
      showError(
        "Marks cannot be greater than maximum marks."
      );
      return;
    }

    try {
      setSaving(true);

      const data = await postJSON(
        "/api/results",
        {
          studentId: Number(
            resultForm.studentId
          ),
          courseId: Number(
            resultForm.courseId
          ),
          examId: resultForm.examId
            ? Number(resultForm.examId)
            : null,
          marks: Number(resultForm.marks),
          maxMarks: Number(
            resultForm.maxMarks
          ),
          grade: resultForm.grade,
          remarks: resultForm.remarks,
          published: resultForm.published,
        }
      );

      if (resultForm.published) {
        await notifyStudents(
          [Number(resultForm.studentId)],
          "Result Published",
          "Your result has been published.",
          "RESULT"
        );
      }

      setResultForm({
        studentId: "",
        courseId: "",
        examId: "",
        marks: "",
        maxMarks: "",
        grade: "",
        remarks: "",
        published: true,
      });

      await loadAllData(false);

      showSuccess(
        data?.message ||
          "Result created successfully."
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to create result"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createComplaint(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !complaintForm.studentId ||
      !complaintForm.title ||
      !complaintForm.description
    ) {
      showError(
        "Student, title and description are required."
      );
      return;
    }

    try {
      setSaving(true);

      await postJSON("/api/complaints", {
        studentId: Number(
          complaintForm.studentId
        ),
        title: complaintForm.title,
        description:
          complaintForm.description,
      });

      await notifyStudents(
        [Number(complaintForm.studentId)],
        "Complaint Created",
        "A complaint has been created for your account.",
        "COMPLAINT"
      );

      setComplaintForm({
        studentId: "",
        title: "",
        description: "",
      });

      await loadAllData(false);

      showSuccess(
        "Complaint created successfully."
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to create complaint"
      );
    } finally {
      setSaving(false);
    }
  }

  async function markAttendance(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!attendanceForm.enrollmentId) {
      showError("Please select a student.");
      return;
    }

    try {
      setSaving(true);

      await postJSON("/api/attendance", {
        enrollmentId: Number(
          attendanceForm.enrollmentId
        ),
        date: attendanceForm.date,
        present: attendanceForm.present,
      });

      const enrollment = courses
        .flatMap(
          (course) =>
            course.enrollments || []
        )
        .find(
          (item) =>
            item.id ===
            Number(
              attendanceForm.enrollmentId
            )
        );

      if (enrollment?.student?.id) {
        await notifyStudents(
          [enrollment.student.id],
          "Attendance Updated",
          "Your attendance has been updated.",
          "ATTENDANCE"
        );
      }

      await loadAllData(false);

      showSuccess(
        "Attendance saved successfully."
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to save attendance"
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      window.location.href =
        "/login/faculty";
    } catch (error) {
      console.error(error);
    }
  }
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
    console.error("Faculty AI assistant error:", error);

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

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  const totalStudents = students.length;
  const totalAssignments =
    assignments.length;
  const totalComplaints =
    complaints.length;

  const selectedResultCourse =
    courses.find(
      (course) =>
        course.id ===
        Number(resultForm.courseId)
    );

  const resultStudents = useMemo(() => {
    if (!resultForm.courseId) {
      return students;
    }

    const ids =
      selectedResultCourse?.enrollments
        ?.map(
          (enrollment) =>
            enrollment.student?.id
        )
        .filter(
          (id): id is number =>
            typeof id === "number"
        ) || [];

    if (ids.length > 0) {
      return students.filter((student) =>
        ids.includes(student.id)
      );
    }

    return students.filter((student) =>
      student.courses?.some(
        (course) =>
          course.id ===
          Number(resultForm.courseId)
      )
    );
  }, [
    resultForm.courseId,
    selectedResultCourse,
    students,
  ]);

  const resultExams = exams.filter(
    (exam) =>
      exam.course?.id ===
      Number(resultForm.courseId)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 px-10 py-9 text-center">
          <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />

          <h2 className="font-black text-xl text-slate-950">
            Loading Faculty Portal
          </h2>

          <p className="text-sm text-slate-600 mt-2">
            Preparing your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const menuItems: {
    label: Section;
    icon: string;
  }[] = [
    {
      label: "Dashboard",
      icon: "🏠",
    },
    {
      label: "My Courses",
      icon: "📚",
    },
    {
      label: "Students",
      icon: "👨‍🎓",
    },
    {
      label: "Attendance",
      icon: "📊",
    },
    {
      label: "Assignments",
      icon: "📝",
    },
    {
      label: "Materials",
      icon: "📖",
    },
    {
      label: "Announcements",
      icon: "📢",
    },
    {
      label: "Exams",
      icon: "🧾",
    },
    {
      label: "Results",
      icon: "🏆",
    },
    {
      label: "Complaints",
      icon: "⚠️",
    },
    {
      label: "Notifications",
      icon: "🔔",
    },
    {
      label: "AI Assistant",
      icon: "🤖",
    },
    {
      label: "RAG Documents",
      icon: "🧠",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">

      <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-slate-300 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-black text-xl text-slate-950">
            AI Campus
          </h1>

          <p className="text-xs text-slate-600">
            Faculty Portal
          </p>
        </div>

        <button
          onClick={() =>
            setMobileMenu(!mobileMenu)
          }
          className="rounded-xl bg-slate-900 text-white px-4 py-2 font-bold"
        >
          ☰
        </button>
      </div>
      {mobileMenu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/50">
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white p-5 pt-20 shadow-2xl overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() =>
                    openSection(item.label)
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold transition ${
                    activeSection ===
                    item.label
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <span>{item.icon}</span>

                  <span>{item.label}</span>

                  {item.label ===
                    "Notifications" &&
                    unreadNotifications >
                      0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                        {unreadNotifications}
                      </span>
                    )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex">

        <aside className="hidden lg:flex w-72 bg-slate-950 text-white h-screen p-5 flex-col sticky top-0 overflow-hidden">
          <div className="pb-5 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-600/20">
                🎓
              </div>

              <div>
                <h1 className="text-xl font-black text-slate-950">
                  AI Campus
                </h1>

                <p className="text-xs text-slate-600">
                  Faculty Management
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <p className="px-3 mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
              Navigation
            </p>

            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() =>
                    openSection(item.label)
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold transition-all ${
                    activeSection ===
                    item.label
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      :"text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <span className="text-lg">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>

                  {item.label ===
                    "Notifications" &&
                    unreadNotifications >
                      0 && (
                      <span
                        className={`ml-auto text-xs rounded-full px-2 py-1 font-bold ${
                          activeSection ===
                          "Notifications"
                            ? "bg-white text-blue-600"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {unreadNotifications}
                      </span>
                    )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-100 rounded-2xl p-4 mb-3 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  {user?.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950 truncate">
                    {user?.name}
                  </p>

                  <p className="text-xs text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <span className="inline-block mt-3 bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                FACULTY
              </span>
            </div>

            <button
              onClick={logout}
              className="w-full rounded-xl bg-red-50 text-red-700 border border-red-200 px-4 py-3 font-bold hover:bg-red-100 transition"
            >
              🚪 Logout
            </button>
          </div>
        </aside>


        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

            <div className="mb-7">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-blue-700 uppercase tracking-wide">
                    Faculty Portal
                  </p>

                  <h2 className="text-3xl md:text-4xl font-black text-slate-950 mt-1">
                    {activeSection}
                  </h2>

                  <p className="text-slate-700 mt-2">
                    Manage your campus activities
                    from one place.
                  </p>
                </div>

                <div className="bg-white border border-slate-300 rounded-2xl px-5 py-4 shadow-sm">
                  <p className="text-xs font-black text-slate-600 uppercase">
                    Welcome
                  </p>

                  <p className="font-black text-slate-950 mt-1">
                    {user?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* SUCCESS */}

            {successMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-950 shadow-sm flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                  ✓
                </span>

                <div>
                  <p className="font-black">
                    Success
                  </p>

                  <p className="text-sm font-medium">
                    {successMessage}
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-red-950 shadow-sm flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center font-black">
                  !
                </span>

                <div>
                  <p className="font-black">
                    Something went wrong
                  </p>

                  <p className="text-sm font-medium">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {activeSection === "Dashboard" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <DashboardCard
                    icon="📚"
                    title="My Courses"
                    value={courses.length}
                    description="Courses assigned to you"
                    onClick={() =>
                      openSection(
                        "My Courses"
                      )
                    }
                  />

                  <DashboardCard
                    icon="👨‍🎓"
                    title="Students"
                    value={totalStudents}
                    description="Students enrolled"
                    onClick={() =>
                      openSection(
                        "Students"
                      )
                    }
                  />

                  <DashboardCard
                    icon="📝"
                    title="Assignments"
                    value={totalAssignments}
                    description="Assignments created"
                    onClick={() =>
                      openSection(
                        "Assignments"
                      )
                    }
                  />

                  <DashboardCard
                    icon="⚠️"
                    title="Complaints"
                    value={totalComplaints}
                    description="Student complaints"
                    onClick={() =>
                      openSection(
                        "Complaints"
                      )
                    }
                  />
                </div>

                <div className="grid lg:grid-cols-2 gap-5 mt-7">
                  <QuickActionCard
                    title="Create Assignment"
                    description="Give students new academic work."
                    icon="📝"
                    onClick={() =>
                      openSection(
                        "Assignments"
                      )
                    }
                  />

                  <QuickActionCard
                    title="Publish Announcement"
                    description="Share important updates."
                    icon="📢"
                    onClick={() =>
                      openSection(
                        "Announcements"
                      )
                    }
                  />

                  <QuickActionCard
                    title="Schedule Exam"
                    description="Add exam date, time and room."
                    icon="🧾"
                    onClick={() =>
                      openSection("Exams")
                    }
                  />

                  <QuickActionCard
                    title="Publish Result"
                    description="Enter marks and publish results."
                    icon="🏆"
                    onClick={() =>
                      openSection(
                        "Results"
                      )
                    }
                  />
                </div>

                <div className="mt-7 bg-white border border-slate-300 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-xl font-black text-slate-950">
                      Recent Activity
                    </h3>

                    <p className="text-sm text-slate-600 mt-1">
                      Latest announcements from your portal.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {announcements
                      .slice(0, 4)
                      .map(
                        (announcement) => (
                          <div
                            key={
                              announcement.id
                            }
                            className="p-5 flex items-start gap-4 hover:bg-slate-50 transition"
                          >
                            <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
                              📢
                            </div>

                            <div className="min-w-0">
                              <p className="font-black text-slate-950">
                                {
                                  announcement.title
                                }
                              </p>

                              <p className="text-sm text-slate-700 mt-1">
                                {
                                  announcement.content
                                }
                              </p>

                              <p className="text-xs text-slate-500 mt-2">
                                {formatDate(
                                  announcement.createdAt
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      )}

                    {announcements.length ===
                      0 && (
                      <EmptyState
                        icon="📭"
                        title="No recent activity"
                        text="Create an announcement or assignment to get started."
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === "My Courses" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="📚"
                  title="My Courses"
                  text="Create and manage your courses."
                />

                <FormCard
                  title="Create New Course"
                  subtitle="Add a course to your faculty profile."
                  icon="➕"
                >
                  <form
                    onSubmit={createCourse}
                    className="grid md:grid-cols-2 gap-5"
                  >
                    <Input
                      label="Course Name"
                      value={courseForm.name}
                      onChange={(value) =>
                        setCourseForm({
                          ...courseForm,
                          name: value,
                        })
                      }
                      placeholder="e.g. Data Structures"
                      required
                    />

                    <Input
                      label="Course Code"
                      value={courseForm.code}
                      onChange={(value) =>
                        setCourseForm({
                          ...courseForm,
                          code: value,
                        })
                      }
                      placeholder="e.g. CS301"
                      required
                    />

                    <div className="md:col-span-2">
                      <TextArea
                        label="Description"
                        value={
                          courseForm.description
                        }
                        onChange={(value) =>
                          setCourseForm({
                            ...courseForm,
                            description:
                              value,
                          })
                        }
                        placeholder="Course description..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <SubmitButton
                        loading={saving}
                        text="Create Course"
                      />
                    </div>
                  </form>
                </FormCard>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-blue-700 uppercase">
                            {course.code}
                          </p>

                          <h3 className="text-xl font-black text-slate-950 mt-1">
                            {course.name}
                          </h3>
                        </div>

                        <span className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                          📚
                        </span>
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            Students
                          </span>

                          <span className="font-black text-slate-950">
                            {course.enrollments?.length || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            Course ID
                          </span>

                          <span className="font-bold text-slate-800">
                            #{course.id}
                          </span>
                        </div>
                      </div>

                      {course.description && (
                        <p className="text-sm text-slate-700 mt-4 leading-6">
                          {course.description}
                        </p>
                      )}
                    </div>
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            Students
                          </span>

                          <span className="font-black text-slate-950">
                            {course.enrollments?.length || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            Course ID
                          </span>

                          <span className="font-bold text-slate-800">
                            #{course.id}
                          </span>
                        </div>
                      </div>

                      {course.description && (
                        <p className="text-sm text-slate-700 mt-4 leading-6">
                          {course.description}
                        </p>
                      )}
                    </div>
                  ))}

                  {courses.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3">
                      <EmptyState
                        icon="📚"
                        title="No courses yet"
                        text="Create your first course using the form above."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "Students" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="👨‍🎓"
                  title="Students"
                  text="View students enrolled in your courses."
                />

                <div className="bg-white border border-slate-300 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">
                        Enrolled Students
                      </h3>

                      <p className="text-sm text-slate-600 mt-1">
                        Students connected to your assigned courses.
                      </p>
                    </div>

                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-black">
                      {students.length} Students
                    </span>
                  </div>

                  <div className="p-6 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
                            {student.name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-black text-slate-950 truncate">
                              {student.name}
                            </h4>

                            <p className="text-sm text-slate-600 break-all mt-1">
                              {student.email}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <span className="inline-flex bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black">
                            {student.status || "Active"}
                          </span>
                        </div>

                        <div className="mt-5">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">
                            Enrolled Courses
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {student.courses?.map((course) => (
                              <span
                                key={course.id}
                                className="bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold"
                              >
                                {course.code}
                              </span>
                            ))}

                            {(!student.courses ||
                              student.courses.length === 0) && (
                              <span className="text-sm text-slate-500">
                                No course information
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {students.length === 0 && (
                      <div className="md:col-span-2 xl:col-span-3">
                        <EmptyState
                          icon="👨‍🎓"
                          title="No students found"
                          text="Students will appear here after they enroll in your courses."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Attendance" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="📊"
                  title="Attendance"
                  text="Mark and update attendance for your students."
                />

                <FormCard
                  title="Mark Attendance"
                  subtitle="Select a student, date and attendance status."
                  icon="📊"
                >
                  <form
                    onSubmit={markAttendance}
                    className="grid md:grid-cols-2 gap-5"
                  >
                    <SelectInput
                      label="Student / Enrollment"
                      value={attendanceForm.enrollmentId}
                      onChange={(value) =>
                        setAttendanceForm({
                          ...attendanceForm,
                          enrollmentId: value,
                        })
                      }
                      options={courses.flatMap(
                        (course) =>
                          (course.enrollments || []).map(
                            (enrollment) => ({
                              value: String(enrollment.id),
                              label: `${enrollment.student?.name || "Student"} — ${course.code}`,
                            })
                          )
                      )}
                      placeholder="Select student"
                    />

                    <Input
                      label="Date"
                      type="date"
                      value={attendanceForm.date}
                      onChange={(value) =>
                        setAttendanceForm({
                          ...attendanceForm,
                          date: value,
                        })
                      }
                      required
                    />

                    <div className="md:col-span-2">
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        Attendance Status
                      </label>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setAttendanceForm({
                              ...attendanceForm,
                              present: true,
                            })
                          }
                          className={`flex-1 rounded-xl px-4 py-3 font-black border transition ${
                            attendanceForm.present
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-700 border-slate-300"
                          }`}
                        >
                          ✓ Present
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setAttendanceForm({
                              ...attendanceForm,
                              present: false,
                            })
                          }
                          className={`flex-1 rounded-xl px-4 py-3 font-black border transition ${
                            !attendanceForm.present
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-slate-700 border-slate-300"
                          }`}
                        >
                          ✕ Absent
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <SubmitButton
                        loading={saving}
                        text="Save Attendance"
                      />
                    </div>
                  </form>
                </FormCard>

                <div className="bg-white border border-slate-300 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-xl font-black text-slate-950">
                      Student Attendance
                    </h3>

                    <p className="text-sm text-slate-600 mt-1">
                      Select a student above to update their attendance.
                    </p>
                  </div>

                  <div className="p-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {courses.flatMap((course) =>
                      (course.enrollments || []).map(
                        (enrollment) => (
                          <div
                            key={enrollment.id}
                            className="border border-slate-200 rounded-2xl p-4"
                          >
                            <p className="font-black text-slate-950">
                              {enrollment.student?.name ||
                                "Unknown Student"}
                            </p>

                            <p className="text-sm text-slate-600 mt-1">
                              {enrollment.student?.email}
                            </p>

                            <p className="text-xs font-black text-blue-700 mt-3">
                              {course.code} — {course.name}
                            </p>
                          </div>
                        )
                      )
                    )}

                    {courses.every(
                      (course) =>
                        !course.enrollments ||
                        course.enrollments.length === 0
                    ) && (
                      <div className="md:col-span-2 xl:col-span-3">
                        <EmptyState
                          icon="📊"
                          title="No enrolled students"
                          text="Students enrolled in your courses will appear here."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Assignments" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="📝"
                  title="Assignments"
                  text="Create assignments and monitor student submissions."
                />

                <FormCard
                  title="Create Assignment"
                  subtitle="Publish academic work for a selected course."
                  icon="📝"
                >
                  <form
                    onSubmit={createAssignment}
                    className="grid md:grid-cols-2 gap-5"
                  >
                    <Input
                      label="Assignment Title"
                      value={assignmentForm.title}
                      onChange={(value) =>
                        setAssignmentForm({
                          ...assignmentForm,
                          title: value,
                        })
                      }
                      placeholder="e.g. Binary Tree Implementation"
                      required
                    />

                    <Input
                      label="Due Date"
                      type="datetime-local"
                      value={assignmentForm.dueDate}
                      onChange={(value) =>
                        setAssignmentForm({
                          ...assignmentForm,
                          dueDate: value,
                        })
                      }
                      required
                    />

                    <SelectInput
                      label="Course"
                      value={assignmentForm.courseId}
                      onChange={(value) =>
                        setAssignmentForm({
                          ...assignmentForm,
                          courseId: value,
                        })
                      }
                      options={courses.map((course) => ({
                        value: String(course.id),
                        label: `${course.code} — ${course.name}`,
                      }))}
                      placeholder="Select course"
                    />

                    <div />

                    <div className="md:col-span-2">
                      <TextArea
                        label="Description"
                        value={assignmentForm.description}
                        onChange={(value) =>
                          setAssignmentForm({
                            ...assignmentForm,
                            description: value,
                          })
                        }
                        placeholder="Describe the assignment..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <SubmitButton
                        loading={saving}
                        text="Create Assignment"
                      />
                    </div>
                  </form>
                </FormCard>

                <div className="grid lg:grid-cols-2 gap-5">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-lg transition"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <span className="text-xs font-black text-blue-700 uppercase">
                            {assignment.course?.code || "Course"}
                          </span>

                          <h3 className="text-xl font-black text-slate-950 mt-1">
                            {assignment.title}
                          </h3>
                        </div>

                        <span className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
                          📝
                        </span>
                      </div>

                      {assignment.description && (
                        <p className="text-sm text-slate-700 mt-4 leading-6">
                          {assignment.description}
                        </p>
                      )}

                      <div className="mt-5 bg-slate-50 rounded-2xl p-4">
                        <p className="text-xs font-black uppercase text-slate-500">
                          Due Date
                        </p>

                        <p className="font-bold text-slate-950 mt-1">
                          {formatDate(assignment.dueDate)}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          Submissions
                        </span>

                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black">
                          {assignment.submissions?.length || 0}
                        </span>
                      </div>

                      {assignment.submissions &&
                        assignment.submissions.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {assignment.submissions.map(
                              (submission) => (
                                <div
                                  key={submission.id}
                                  className="border border-slate-200 rounded-xl p-3"
                                >
                                  <div className="flex justify-between gap-3">
                                    <div>
                                      <p className="font-bold text-slate-950">
                                        {submission.student?.name ||
                                          "Student"}
                                      </p>

                                      <p className="text-xs text-slate-600">
                                        {submission.student?.email}
                                      </p>
                                    </div>

                                    <span className="text-xs font-black bg-slate-100 px-2 py-1 rounded-lg">
                                      {submission.status}
                                    </span>
                                  </div>

                                  {submission.grade !== null &&
                                    submission.grade !== undefined && (
                                      <p className="text-sm font-bold text-blue-700 mt-2">
                                        Grade: {submission.grade}
                                      </p>
                                    )}

                                  {submission.feedback && (
                                    <p className="text-xs text-slate-600 mt-1">
                                      {submission.feedback}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  ))}

                  {assignments.length === 0 && (
                    <div className="lg:col-span-2">
                      <EmptyState
                        icon="📝"
                        title="No assignments"
                        text="Create your first assignment above."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "Materials" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="📖"
                  title="Study Materials"
                  text="Share learning resources with your students."
                />

                <FormCard
                  title="Add Study Material"
                  subtitle="Provide a document, video, link or other resource."
                  icon="📖"
                >
                  <form
                    onSubmit={createMaterial}
                    className="grid md:grid-cols-2 gap-5"
                  >
                    <Input
                      label="Title"
                      value={materialForm.title}
                      onChange={(value) =>
                        setMaterialForm({
                          ...materialForm,
                          title: value,
                        })
                      }
                      placeholder="e.g. Unit 1 Notes"
                      required
                    />

                    <SelectInput
                      label="Type"
                      value={materialForm.type}
                      onChange={(value) =>
                        setMaterialForm({
                          ...materialForm,
                          type: value,
                        })
                      }
                      options={[
                        {
                          value: "DOCUMENT",
                          label: "Document",
                        },
                        {
                          value: "PDF",
                          label: "PDF",
                        },
                        {
                          value: "VIDEO",
                          label: "Video",
                        },
                        {
                          value: "LINK",
                          label: "Link",
                        },
                        {
                          value: "OTHER",
                          label: "Other",
                        },
                      ]}
                    />

                    <SelectInput
                      label="Course"
                      value={materialForm.courseId}
                      onChange={(value) =>
                        setMaterialForm({
                          ...materialForm,
                          courseId: value,
                        })
                      }
                      options={courses.map((course) => ({
                        value: String(course.id),
                        label: `${course.code} — ${course.name}`,
                      }))}
                      placeholder="Select course"
                    />

                    <Input
                      label="Resource URL"
                      value={materialForm.url}
                      onChange={(value) =>
                        setMaterialForm({
                          ...materialForm,
                          url: value,
                        })
                      }
                      placeholder="https://..."
                      required
                    />

                    <div className="md:col-span-2">
                      <TextArea
                        label="Description"
                        value={materialForm.description}
                        onChange={(value) =>
                          setMaterialForm({
                            ...materialForm,
                            description: value,
                          })
                        }
                        placeholder="Describe this material..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <SubmitButton
                        loading={saving}
                        text="Add Material"
                      />
                    </div>
                  </form>
                </FormCard>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-lg transition"
                    >
                      <div className="flex justify-between">
                        <div>
                          <span className="text-xs font-black text-blue-700 uppercase">
                            {material.type}
                          </span>

                          <h3 className="font-black text-lg text-slate-950 mt-1">
                            {material.title}
                          </h3>
                        </div>

                        <span className="h-11 w-11 rounded-xl bg-purple-100 flex items-center justify-center">
                          📖
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-600 mt-3">
                        {material.course?.code || "Course"}
                      </p>

                      {material.description && (
                        <p className="text-sm text-slate-700 mt-3">
                          {material.description}
                        </p>
                      )}

                      <a
                        href={material.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex mt-5 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition"
                      >
                        Open Resource →
                      </a>
                    </div>
                  ))}

                  {materials.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3">
                      <EmptyState
                        icon="📖"
                        title="No study materials"
                        text="Add learning material using the form above."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "Announcements" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="📢"
                  title="Announcements"
                  text="Publish updates to your students."
                />

                <FormCard
                  title="Publish Announcement"
                  subtitle="Target a specific course or all your students."
                  icon="📢"
                >
                  <form
                    onSubmit={createAnnouncement}
                    className="space-y-5"
                  >
                    <Input
                      label="Announcement Title"
                      value={announcementForm.title}
                      onChange={(value) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          title: value,
                        })
                      }
                      placeholder="Important announcement"
                      required
                    />

                    <SelectInput
                      label="Target Course"
                      value={announcementForm.courseId}
                      onChange={(value) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          courseId: value,
                        })
                      }
                      options={courses.map((course) => ({
                        value: String(course.id),
                        label: `${course.code} — ${course.name}`,
                      }))}
                      placeholder="All students"
                    />

                    <TextArea
                      label="Content"
                      value={announcementForm.content}
                      onChange={(value) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          content: value,
                        })
                      }
                      placeholder="Write announcement..."
                      rows={6}
                      required
                    />

                    <SubmitButton
                      loading={saving}
                      text="Publish Announcement"
                    />
                  </form>
                </FormCard>

                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm"
                    >
                      <div className="flex gap-4">
                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-blue-100 flex items-center justify-center text-xl">
                          📢
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-xl font-black text-slate-950">
                            {announcement.title}
                          </h3>

                          <p className="text-sm text-slate-600 mt-1">
                            {announcement.course
                              ? `${announcement.course.code} — ${announcement.course.name}`
                              : "All Students"}
                          </p>

                          <p className="text-slate-700 mt-4 leading-7">
                            {announcement.content}
                          </p>

                          <p className="text-xs text-slate-500 mt-4">
                            Published {formatDate(announcement.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {announcements.length === 0 && (
                    <EmptyState
                      icon="📢"
                      title="No announcements"
                      text="Publish your first announcement above."
                    />
                  )}
                </div>
              </div>
            )}

            {activeSection === "Exams" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="🧾"
                  title="Exams"
                  text="Schedule examinations for your courses."
                />

                <FormCard
                  title="Schedule Exam"
                  subtitle="Add date, timing and room information."
                  icon="🧾"
                >
                  <form
                    onSubmit={createExam}
                    className="grid md:grid-cols-2 gap-5"
                  >
                    <Input
                      label="Exam Title"
                      value={examForm.title}
                      onChange={(value) =>
                        setExamForm({
                          ...examForm,
                          title: value,
                        })
                      }
                      placeholder="e.g. Mid Semester Examination"
                      required
                    />

                    <SelectInput
                      label="Course"
                      value={examForm.courseId}
                      onChange={(value) =>
                        setExamForm({
                          ...examForm,
                          courseId: value,
                        })
                      }
                      options={courses.map((course) => ({
                        value: String(course.id),
                        label: `${course.code} — ${course.name}`,
                      }))}
                      placeholder="Select course"
                    />

                    <Input
                      label="Date"
                      type="date"
                      value={examForm.date}
                      onChange={(value) =>
                        setExamForm({
                          ...examForm,
                          date: value,
                        })
                      }
                      required
                    />

                    <Input
                      label="Room"
                      value={examForm.room}
                      onChange={(value) =>
                        setExamForm({
                          ...examForm,
                          room: value,
                        })
                      }
                      placeholder="e.g. Room 204"
                    />

                    <Input
                      label="Start Time"
                      type="time"
                      value={examForm.startTime}
                      onChange={(value) =>
                        setExamForm({
                          ...examForm,
                          startTime: value,
                        })
                      }
                    />

                    <Input
                      label="End Time"
                      type="time"
                      value={examForm.endTime}
                      onChange={(value) =>
                        setExamForm({
                          ...examForm,
                          endTime: value,
                        })
                      }
                    />

                    <div className="md:col-span-2">
                      <TextArea
                        label="Description"
                        value={examForm.description}
                        onChange={(value) =>
                          setExamForm({
                            ...examForm,
                            description: value,
                          })
                        }
                        placeholder="Exam instructions..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <SubmitButton
                        loading={saving}
                        text="Schedule Exam"
                      />
                    </div>
                  </form>
                </FormCard>

                <div className="grid lg:grid-cols-2 gap-5">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-black text-orange-700 uppercase">
                            {exam.course?.code || "Exam"}
                          </span>

                          <h3 className="text-xl font-black text-slate-950 mt-1">
                            {exam.title}
                          </h3>
                        </div>

                        <span className="h-11 w-11 rounded-xl bg-orange-100 flex items-center justify-center">
                          🧾
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <InfoBox
                          label="Date"
                          value={formatDate(exam.date)}
                        />

                        <InfoBox
                          label="Room"
                          value={exam.room || "Not assigned"}
                        />

                        <InfoBox
                          label="Start"
                          value={exam.startTime || "—"}
                        />

                        <InfoBox
                          label="End"
                          value={exam.endTime || "—"}
                        />
                      </div>

                      {exam.description && (
                        <p className="text-sm text-slate-700 mt-4">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  ))}

                  {exams.length === 0 && (
                    <div className="lg:col-span-2">
                      <EmptyState
                        icon="🧾"
                        title="No exams scheduled"
                        text="Schedule an exam using the form above."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "Results" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="🏆"
                  title="Results"
                  text="Enter marks and publish student results."
                />

                <FormCard
                  title="Publish Student Result"
                  subtitle="Select course first, then choose the enrolled student."
                  icon="🏆"
                >
                  <form
                    onSubmit={createResult}
                    className="grid md:grid-cols-2 gap-5"
                  >
                    <SelectInput
                      label="Course"
                      value={resultForm.courseId}
                      onChange={(value) =>
                        setResultForm({
                          ...resultForm,
                          courseId: value,
                          studentId: "",
                          examId: "",
                        })
                      }
                      options={courses.map((course) => ({
                        value: String(course.id),
                        label: `${course.code} — ${course.name}`,
                      }))}
                      placeholder="Select course"
                    />

                    <SelectInput
                      label="Student"
                      value={resultForm.studentId}
                      onChange={(value) =>
                        setResultForm({
                          ...resultForm,
                          studentId: value,
                        })
                      }
                      options={resultStudents.map((student) => ({
                        value: String(student.id),
                        label: `${student.name} — ${student.email}`,
                      }))}
                      placeholder={
                        resultForm.courseId
                          ? "Select enrolled student"
                          : "Select course first"
                      }
                    />

                    <SelectInput
                      label="Exam"
                      value={resultForm.examId}
                      onChange={(value) =>
                        setResultForm({
                          ...resultForm,
                          examId: value,
                        })
                      }
                      options={resultExams.map((exam) => ({
                        value: String(exam.id),
                        label: exam.title,
                      }))}
                      placeholder="Optional exam"
                    />

                    <Input
                      label="Marks"
                      type="number"
                      value={resultForm.marks}
                      onChange={(value) =>
                        setResultForm({
                          ...resultForm,
                          marks: value,
                        })
                      }
                      placeholder="e.g. 78"
                      required
                    />

                    <Input
                      label="Maximum Marks"
                      type="number"
                      value={resultForm.maxMarks}
                      onChange={(value) =>
                        setResultForm({
                          ...resultForm,
                          maxMarks: value,
                        })
                      }
                      placeholder="e.g. 100"
                      required
                    />

                    <Input
                      label="Grade"
                      value={resultForm.grade}
                      onChange={(value) =>
                        setResultForm({
                          ...resultForm,
                          grade: value,
                        })
                      }
                      placeholder="e.g. A"
                    />

                    <div className="md:col-span-2">
                      <TextArea
                        label="Remarks"
                        value={resultForm.remarks}
                        onChange={(value) =>
                          setResultForm({
                            ...resultForm,
                            remarks: value,
                          })
                        }
                        placeholder="Performance remarks..."
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <input
                        type="checkbox"
                        checked={resultForm.published}
                        onChange={(event) =>
                          setResultForm({
                            ...resultForm,
                            published:
                              event.target.checked,
                          })
                        }
                        className="h-5 w-5 accent-blue-600"
                      />

                      <div>
                        <p className="font-black text-slate-950">
                          Publish immediately
                        </p>

                        <p className="text-xs text-slate-600">
                          Student will be able to see the result.
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <SubmitButton
                        loading={saving}
                        text="Save Result"
                      />
                    </div>
                  </form>
                </FormCard>

                <div className="bg-white border border-slate-300 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-xl font-black text-slate-950">
                      Published / Saved Results
                    </h3>
                  </div>

                  <div className="p-6 space-y-4">
                    {results.map((result) => (
                      <div
                        key={result.id}
                        className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h4 className="font-black text-slate-950">
                              {result.student?.name ||
                                "Student"}
                            </h4>

                            <p className="text-sm text-slate-600">
                              {result.student?.email}
                            </p>

                            <p className="text-xs font-bold text-blue-700 mt-2">
                              {result.course?.code} —{" "}
                              {result.course?.name}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-slate-950">
                              {result.marks}/
                              {result.maxMarks}
                            </span>

                            {result.grade && (
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-black">
                                {result.grade}
                              </span>
                            )}

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black ${
                                result.published
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {result.published
                                ? "Published"
                                : "Draft"}
                            </span>
                          </div>
                        </div>

                        {result.remarks && (
                          <p className="text-sm text-slate-700 mt-4 bg-slate-50 rounded-xl p-3">
                            {result.remarks}
                          </p>
                        )}
                      </div>
                    ))}

                    {results.length === 0 && (
                      <EmptyState
                        icon="🏆"
                        title="No results"
                        text="Create a result using the form above."
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeSection === "Complaints" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="⚠️"
                  title="Complaints"
                  text="Create and monitor student-related complaints."
                />

                <FormCard
                  title="Create Complaint"
                  subtitle="Select the student associated with the complaint."
                  icon="⚠️"
                >
                  <form
                    onSubmit={createComplaint}
                    className="space-y-5"
                  >
                    <SelectInput
                      label="Student"
                      value={complaintForm.studentId}
                      onChange={(value) =>
                        setComplaintForm({
                          ...complaintForm,
                          studentId: value,
                        })
                      }
                      options={students.map((student) => ({
                        value: String(student.id),
                        label: `${student.name} — ${student.email}`,
                      }))}
                      placeholder="Select student"
                    />

                    <Input
                      label="Complaint Title"
                      value={complaintForm.title}
                      onChange={(value) =>
                        setComplaintForm({
                          ...complaintForm,
                          title: value,
                        })
                      }
                      placeholder="Complaint title"
                      required
                    />

                    <TextArea
                      label="Description"
                      value={complaintForm.description}
                      onChange={(value) =>
                        setComplaintForm({
                          ...complaintForm,
                          description: value,
                        })
                      }
                      placeholder="Describe the issue..."
                      rows={6}
                      required
                    />

                    <SubmitButton
                      loading={saving}
                      text="Create Complaint"
                    />
                  </form>
                </FormCard>

                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-950">
                              {complaint.title}
                            </h3>

                            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-black">
                              {complaint.status}
                            </span>
                          </div>

                          <p className="text-sm text-slate-600 mt-2">
                            Student:{" "}
                            <span className="font-bold text-slate-950">
                              {complaint.student?.name ||
                                "Unknown"}
                            </span>
                          </p>

                          <p className="text-sm text-slate-600">
                            {complaint.student?.email}
                          </p>
                        </div>

                        <span className="text-xs text-slate-500">
                          {formatDate(
                            complaint.createdAt
                          )}
                        </span>
                      </div>

                      <p className="text-slate-700 mt-5 leading-7 bg-slate-50 rounded-2xl p-4">
                        {complaint.description}
                      </p>
                    </div>
                  ))}

                  {complaints.length === 0 && (
                    <EmptyState
                      icon="⚠️"
                      title="No complaints"
                      text="There are currently no complaints assigned to you."
                    />
                  )}
                </div>
              </div>
            )}

            {activeSection === "Notifications" && (
              <div className="space-y-6">
                <SectionHeader
                  icon="🔔"
                  title="Notifications"
                  text="Track notifications generated by your campus activity."
                />

                <div className="bg-white border border-slate-300 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">
                        Notification Center
                      </h3>

                      <p className="text-sm text-slate-600 mt-1">
                        New activities are reflected here.
                      </p>
                    </div>

                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-black">
                      {notifications.length} Total
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-5 flex gap-4 ${
                          !notification.isRead
                            ? "bg-blue-50/50"
                            : "bg-white"
                        }`}
                      >
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center">
                          🔔
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h4 className="font-black text-slate-950">
                              {notification.title}
                            </h4>

                            <span className="text-xs text-slate-500">
                              {formatDate(
                                notification.createdAt
                              )}
                            </span>
                          </div>

                          <p className="text-sm text-slate-700 mt-1">
                            {notification.message}
                          </p>

                          <span className="inline-block mt-3 text-xs font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                            {notification.type}
                          </span>
                        </div>

                        {!notification.isRead && (
                          <span className="h-3 w-3 rounded-full bg-blue-600 mt-2 shrink-0" />
                        )}
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <EmptyState
                        icon="🔔"
                        title="No notifications"
                        text="Notifications will appear here when activities are created."
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "AI Assistant" && (
  <div className="space-y-6">
    <SectionHeader
      icon="🤖"
      title="AI Assistant"
      text="Ask questions about campus policies, academics, courses and study-related topics."
    />

    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
            🤖
          </div>

          <div>
            <h3 className="text-xl font-black">
              AI Campus Assistant
            </h3>

            <p className="mt-1 text-sm text-blue-100">
              Powered by Gemini + RAG
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-[420px] max-h-[520px] space-y-4 overflow-y-auto bg-slate-50 p-6">
        {aiMessages.length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="max-w-md text-center">
              <div className="text-6xl">🤖</div>

              <h4 className="mt-5 text-xl font-black text-slate-900">
                How can I help you?
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ask me about campus policies, attendance, exams,
                assignments, courses or other academic topics.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAiInput(
                      "What is the minimum attendance requirement?"
                    )
                  }
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                >
                  Attendance policy
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAiInput(
                      "What are the library hours?"
                    )
                  }
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                >
                  Library hours
                </button>
              </div>
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
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-800 shadow-sm"
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
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                🤖 Thinking...
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendAIMessage();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={aiInput}
            onChange={(event) =>
              setAiInput(event.target.value)
            }
            placeholder="Ask the AI Campus Assistant..."
            disabled={aiLoading}
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!aiInput.trim() || aiLoading}
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiLoading ? "..." : "Send"}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-slate-400">
          AI responses are generated using Gemini and campus knowledge.
        </p>
      </div>
    </div>
  </div>
)}

{activeSection === "RAG Documents" && (
  <div className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-8 text-white shadow-2xl md:p-10">
      <div className="relative z-10 max-w-3xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl shadow-xl shadow-blue-600/30">
          🤖
        </div>

        <p className="mt-6 text-xs font-black tracking-widest text-blue-300">
          RAG KNOWLEDGE BASE
        </p>

        <h2 className="mt-2 text-3xl font-black md:text-4xl">
          AI Campus Knowledge
        </h2>

        <p className="mt-4 max-w-2xl leading-7 text-slate-300">
          Upload official campus documents such as attendance policies,
          exam guidelines, academic calendars and course materials.
          These documents will be processed and used by the AI Campus
          Assistant to provide campus-specific answers.
        </p>
      </div>

      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
    </section>

    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-black text-slate-950">
          📄 Upload Knowledge Document
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Upload a PDF containing official campus information.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
        <div className="mb-4 text-5xl">📄</div>

        <h4 className="text-lg font-bold text-slate-900">
          Select a PDF document
        </h4>

        <p className="mt-2 text-sm text-slate-500">
          Only PDF files are supported.
        </p>

        <input
          id="rag-file"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setRagFile(file);
          }}
          className="mx-auto mt-6 block w-full max-w-md cursor-pointer rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700"
        />

        {ragFile && (
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left">
            <p className="text-sm font-bold text-blue-900">
              Selected file
            </p>

            <p className="mt-1 break-all text-sm text-blue-700">
              {ragFile.name}
            </p>

            <p className="mt-1 text-xs text-blue-600">
              {(ragFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={uploadRAGDocument}
          disabled={!ragFile || ragUploading}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ragUploading ? "Processing PDF..." : "Upload & Process PDF"}
        </button>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-3xl">📄</div>
        <h4 className="mt-3 font-bold text-slate-900">
          PDF Processing
        </h4>
        <p className="mt-1 text-sm text-slate-500">
          Extracts readable text from uploaded PDFs.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-3xl">✂️</div>
        <h4 className="mt-3 font-bold text-slate-900">
          Smart Chunking
        </h4>
        <p className="mt-1 text-sm text-slate-500">
          Splits documents into smaller searchable chunks.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-3xl">🧠</div>
        <h4 className="mt-3 font-bold text-slate-900">
          AI Knowledge
        </h4>
        <p className="mt-1 text-sm text-slate-500">
          Prepared for embedding and vector search.
        </p>
      </div>
    </div>
  </div>
)}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  value: number;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-xl">
          {icon}
        </div>

        <span className="text-slate-400 group-hover:text-blue-600 transition">
          →
        </span>
      </div>

      <p className="text-sm font-bold text-slate-600 mt-5">
        {title}
      </p>

      <p className="text-4xl font-black text-slate-950 mt-1">
        {value}
      </p>

      <p className="text-xs text-slate-600 mt-2">
        {description}
      </p>
    </button>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-slate-300 rounded-3xl p-6 text-left shadow-sm hover:shadow-xl hover:border-blue-300 transition group"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-xl">
          {icon}
        </div>

        <div>
          <h3 className="font-black text-slate-950">
            {title}
          </h3>

          <p className="text-sm text-slate-600 mt-1">
            {description}
          </p>
        </div>

        <span className="ml-auto text-slate-400 group-hover:text-blue-600">
          →
        </span>
      </div>
    </button>
  );
}

function SectionHeader({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-7 text-white shadow-lg">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl">
          {icon}
        </div>

        <div>
          <h3 className="text-2xl font-black">
            {title}
          </h3>

          <p className="text-blue-100 mt-1">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-300 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
            {icon}
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">
              {title}
            </h3>

            <p className="text-sm text-slate-600 mt-1">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-800 mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="input"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-800 mb-2">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="input resize-y"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-800 mb-2">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="input"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SubmitButton({
  loading,
  text,
}: {
  loading: boolean;
  text: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn w-full md:w-auto min-w-48 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          Saving...
        </span>
      ) : (
        `✓ ${text}`
      )}
    </button>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <p className="text-xs font-black text-slate-500 uppercase">
        {label}
      </p>

      <p className="text-sm font-black text-slate-950 mt-1">
        {value}
      </p>
    </div>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
      <div className="text-2xl">{icon}</div>

      <p className="font-black mt-3">
        {title}
      </p>

      <p className="text-sm text-white/75 mt-1">
        {text}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white border border-slate-300 rounded-3xl p-10 text-center shadow-sm">
      <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
        {icon}
      </div>

      <h3 className="font-black text-xl text-slate-950 mt-5">
        {title}
      </h3>

      <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
        {text}
      </p>
    </div>
  );
}

function formatDate(date: string) {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date;
  }
}
<style jsx global>{`
  .input {
    width: 100%;
    border: 2px solid #cbd5e1;
    border-radius: 14px;
    padding: 12px 14px;
    background: #ffffff;
    color: #0f172a;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .input::placeholder {
    color: #64748b;
    opacity: 1;
  }

  .input:hover {
    border-color: #94a3b8;
  }

  .input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  }

  .input:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }

  .btn {
    background: linear-gradient(
      135deg,
      #2563eb,
      #4f46e5
    );
    color: white;
    padding: 12px 20px;
    border-radius: 14px;
    font-weight: 800;
    transition: all 0.2s ease;
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18);
  }

  .btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 12px 25px rgba(37, 99, 235, 0.25);
  }

  .btn:active:not(:disabled) {
    transform: translateY(0);
  }

  select.input {
    cursor: pointer;
  }

  input[type="date"],
  input[type="time"],
  input[type="datetime-local"] {
    color-scheme: light;
  }
`}</style>