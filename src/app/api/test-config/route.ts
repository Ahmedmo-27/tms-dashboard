import { NextResponse } from "next/server";

/** Dev-only config probe. Not available in production. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    config: {
      hasApiUrl: Boolean(process.env.NEXT_PUBLIC_TMS_API_URL),
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    message: "Configuration test successful",
  });
}
