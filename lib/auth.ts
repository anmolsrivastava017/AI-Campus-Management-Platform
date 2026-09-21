import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

type TokenPayload = {
  id: number;
  role: "STUDENT" | "FACULTY";
};

export async function getAuthUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const decoded = jwt.verify(token, secret);

    if (typeof decoded !== "object" || decoded === null) {
      return null;
    }

    const { id, role } = decoded as {
      id?: unknown;
      role?: unknown;
    };

    if (
      typeof id !== "number" ||
      (role !== "STUDENT" && role !== "FACULTY")
    ) {
      return null;
    }

    return {
      id,
      role,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}