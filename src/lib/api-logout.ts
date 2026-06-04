import { redirect } from "next/navigation";
import { deleteToken } from "@/lib/cookie";

export async function POST() {
  await deleteToken();
  redirect("/login")
}
