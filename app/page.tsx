import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen ring-black">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
            AI Campus Management Platform
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Smart Campus.
            <br />
            Connected Students.
            <br />
            Smarter Learning.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-200">
            A modern campus platform connecting students and faculty with
            real-time communication, academic management, and an AI-powered
            campus assistant.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/login/student"
              className="rounded-lg bg-red-600 px-6 py-3 font-medium text-black hover:bg-red-700"
            >
              Student Login
            </Link>
            <Link
              href="/login/faculty"
              className="rounded-lg border border-gray-300 bg-black px-6 py-3 font-medium text-white hover:bg-gray-400"
            >
              Faculty Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}