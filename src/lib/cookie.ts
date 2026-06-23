'use server'
import { cookies } from "next/headers";

export async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      // On client, you cannot access HttpOnly cookies
      return null;
    }

    const token = (await cookies()).get("token")?.value;
    return token || null;
  } catch (err) {
    console.error("Error reading token from cookies:", err);
    return null;
  }
}

export const setToken = async (token: string) => {
  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}
export const deleteToken = async () => {
  console.log("Deleting token");
  (await cookies()).delete("token");
}

