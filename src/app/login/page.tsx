export const dynamic = 'force-dynamic';
import React from "react"
import { LoginForm } from "@/components/ui/forms/login-form"

export default async function Page() {
  console.log('TMS API URL:', process.env.NEXT_PUBLIC_TMS_API_URL);
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
