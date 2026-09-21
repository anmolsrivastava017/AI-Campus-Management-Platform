import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const pathname = request.nextUrl.pathname;

  const isStudentRoute = pathname.startsWith("/student");
  const isFacultyRoute = pathname.startsWith("/faculty");

  if (isStudentRoute || isFacultyRoute) {
    if (!token) {
      const loginPath = isStudentRoute
        ? "/login/student"
        : "/login/faculty";

      return NextResponse.redirect(
        new URL(loginPath, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/faculty/:path*"],
};