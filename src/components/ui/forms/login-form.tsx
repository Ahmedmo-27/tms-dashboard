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
import { loginAction } from "@/lib/actions/auth-actions";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks";
import { setCredentials } from "@/lib/store/features/authSlice";
import {
  logoutCoach,
  setCoachCredentials,
} from "@/lib/store/features/coachSlice";
import { ApiError } from "@/core/api-error";

type LoginRole = "coach" | "admin" | "fd" | string;

interface LoginResponseData {
  token: string;
  userId: string;
  role: LoginRole;
  [key: string]: unknown;
}

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: LoginResponseData | null;
  defaultValues?: {
    phoneNumber: string;
    password: string;
  };
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  };
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (currentState: ActionState, formData: FormData) => {
      const defaultValues = {
        phoneNumber: formData.get("phoneNumber") as string,
        password: formData.get("password") as string,
      };

      const result = (await loginAction(currentState, formData)) as ActionState;

      if (result.success) {
        const loginData = result.data;

        if (!loginData) {
          return {
            success: false,
            errors: { message: "Invalid login response" },
            data: null,
            defaultValues,
          };
        }

        if (loginData.role === "coach") {
          dispatch(
            setCoachCredentials({
              token: loginData.token,
              coachId: loginData.userId,
            })
          );
          router.push("/coach/dashboard");
          return initialState;
        }

        if (loginData.role === "admin" || loginData.role === "fd") {
          dispatch(logoutCoach());
          dispatch(setCredentials(loginData));
          router.push("/dashboard");
          return initialState;
        }

        return {
          success: false,
          errors: { message: "Unauthorized role" },
          data: null,
          defaultValues,
        };
      }
      return {
        ...result,
        defaultValues,
      };
    },
    initialState
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Flow: POST /api/auth/login → response.role === "coach" → dispatch setCoachCredentials → push("/coach/dashboard") → RequireCoachAuth validates coachSlice.token → CoachDashboardShell renders */}
      <div className="text-3xl font-bold">Welcome Spacer 👋</div>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your credentials below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="phoneNumber"
                  placeholder="08123456789"
                  autoComplete="phoneNumber"
                  defaultValue={state?.defaultValues?.phoneNumber}
                  disabled={pending}
                  required
                />
                {state?.errors && "phoneNumber" in state.errors && (
                  <p className="text-destructive text-sm">
                    {state.errors.phoneNumber}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={pending}
                  defaultValue={state?.defaultValues?.password}
                  placeholder="********"
                />
              </div>
              {state?.errors && "password" in state.errors && (
                <p className="text-destructive text-sm">
                  {state.errors.password}
                </p>
              )}
              <div className="flex flex-col gap-3">
                {state.errors && state.errors.message && (
                  <div className="text-destructive">{state.errors.message}</div>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <p className="opacity-50">Contact an admin</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
