"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { coachLoginSchema, CoachLoginFormValues } from "@/lib/validations/coach";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setCoachCredentials } from "@/lib/store/features/coachSlice";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_TMS_API_URL as string;

export function CoachLoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const token = useAppSelector((state) => state.coach.token);
  const [serverError, setServerError] = useState<string | null>(null);

  // If already logged in as coach, redirect to coach dashboard
  useEffect(() => {
    if (token) {
      router.replace("/coach/dashboard");
    }
  }, [token, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CoachLoginFormValues>({
    resolver: zodResolver(coachLoginSchema),
  });

  const onSubmit = async (values: CoachLoginFormValues) => {
    setServerError(null);
    try {
      const response = await axios.post(
        `${API_URL}/api/coach/auth/login`,
        {
          phoneNumber: values.phoneNumber,
          password: values.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 30000,
        }
      );

      const { token: coachToken, coachId, hasPtSessions } = response.data.data as {
        token: string;
        coachId: string;
        hasPtSessions: boolean;
      };

      dispatch(setCoachCredentials({ token: coachToken, coachId, hasPtSessions }));
      router.replace("/coach/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.message ??
          "Invalid credentials. Please try again.";
        setServerError(msg);
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="text-3xl font-bold">Coach Portal 🏋️</div>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your credentials below to access the Coach Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="08123456789"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  {...register("phoneNumber")}
                />
                {errors.phoneNumber && (
                  <p className="text-destructive text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  disabled={isSubmitting}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {serverError && (
                  <p className="text-destructive text-sm">{serverError}</p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
