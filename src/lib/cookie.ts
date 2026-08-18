'use server'
import { cookies } from "next/headers";

const TOKEN_COOKIE = "token";
const TOKEN_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

export async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      // On client, you cannot access HttpOnly cookies
      return null;
    }

    const token = (await cookies()).get(TOKEN_COOKIE)?.value;
    return token || null;
  } catch (err) {
    console.error("Error reading token from cookies:", err);
    return null;
  }
}

export const setToken = async (token: string) => {
  (await cookies()).set(TOKEN_COOKIE, token, TOKEN_OPTIONS);
}

export const deleteToken = async () => {
  const jar = await cookies();
  // Match attributes used at set time so the browser clears the cookie
  jar.set(TOKEN_COOKIE, "", {
    ...TOKEN_OPTIONS,
    maxAge: 0,
  });
  jar.delete(TOKEN_COOKIE);
}
