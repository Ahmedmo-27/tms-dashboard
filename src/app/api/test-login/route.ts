import { NextResponse } from "next/server";
import { tms } from "@/lib/tms-api";

/** Dev-only login probe. Not available in production. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    const { phoneNumber, password } = await request.json();

    const response = await tms.post("/auth/login", {
      phoneNumber,
      password,
    });

    // Never echo tokens in test responses
    const data = response.data?.data ?? {};
    const { token: _token, ...safe } = data;

    return NextResponse.json({
      success: true,
      data: safe,
      message: "Login test successful",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: err.message,
          type: err.constructor.name,
        },
        message: "Login test failed",
      },
      { status: 500 }
    );
  }
}
