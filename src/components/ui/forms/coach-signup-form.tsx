"use client";
import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { tms } from "@/lib/tms-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Coach {
  _id: string;
  coachName: string;
}

export function CoachSignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await tms.get("/external/unlinked-coaches");
        setCoaches(response.data.data);
      } catch (err: any) {
        console.error("Failed to load coaches", err);
      } finally {
        setLoadingCoaches(false);
      }
    };
    fetchCoaches();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const password = formData.get("password") as string;

    const selectedCoach = coaches.find((c) => c._id === selectedCoachId);

    if (!selectedCoach) {
      setErrorMsg("Please select your name from the list.");
      setPending(false);
      return;
    }

    try {
      await tms.post("/external/register-coach", {
        coachId: selectedCoachId,
        name: selectedCoach.coachName,
        email,
        phoneNumber,
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Registration failed.");
    } finally {
      setPending(false);
    }
  };

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Registration Successful!</CardTitle>
            <CardDescription>
              Your account has been created successfully. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="text-3xl font-bold">Coach Registration 👋</div>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Select your name and enter your details to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="coachId">Select Your Name</Label>
                <Select
                  value={selectedCoachId}
                  onValueChange={setSelectedCoachId}
                  disabled={loadingCoaches || pending}
                  required
                >
                  <SelectTrigger id="coachId">
                    <SelectValue placeholder={loadingCoaches ? "Loading..." : "Select your name"} />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map((coach) => (
                      <SelectItem key={coach._id} value={coach._id}>
                        {coach.coachName}
                      </SelectItem>
                    ))}
                    {!loadingCoaches && coaches.length === 0 && (
                      <SelectItem value="none" disabled>
                        No unlinked coaches found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="coach@example.com"
                  disabled={pending}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="01234567890"
                  disabled={pending}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  disabled={pending}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must contain at least 8 characters, one uppercase, one lowercase, and one number.
                </p>
              </div>

              {errorMsg && (
                <div className="text-destructive text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Registering..." : "Register"}
              </Button>

              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Login
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
