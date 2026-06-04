"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus } from "lucide-react";
import { ApiError } from "@/core/api-error";
import { toast } from "react-hot-toast";
import { registerUser } from "@/lib/actions/auth-actions";
import { useRouter } from "next/navigation";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: any | null;
  defaultValues?: {
    name: string;
    phoneNumber: string;
    password: string;
  };
}

export function RegisterMember() {
  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      name: "",
      password: "",
      phoneNumber: "",
    },
  };

  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [copiedMessage, setCopiedMessage] = useState("");

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      setIsLoading(true);
      setError(null);
      const defaultValues = {
        name: formData.get("name") as string,
        password: formData.get("password") as string,
        phoneNumber: formData.get("phoneNumber") as string,
      };

      const result = await registerUser(currentState, formData);

      if (result.success) {
        router.push(`/dashboard/our-members/${result.data._id}`);
        return initialState;
      }

      setError(result.errors as Error);
      setIsLoading(false); 
      return {
        ...result,
        defaultValues,
      };
    },
    initialState
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(copiedMessage);
    toast.success("Copied!", { duration: 1500, position: "top-center" });
  };

  useEffect(() => {
    const randomDigits = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    const usedName = name.replace(/\s/g, "") + "-";
    const password = usedName + randomDigits;
    const message = `Hello ${name}
Welcome to The Mind Space! 🚀🌟

We’re so happy to have you as part of our community! 💚
You can now log in to our app using 
your 
Phone number: ${phoneNumber} 
Password: ${password}

Once you’re in, you’ll be able to:
-Book your classes
-Track your package and remaining sessions
✨ Stay connected with everything happening at The Mind Space.

If you need any help, feel free to reach out anytime.

The Mind Space Team 💫`;
    setCopiedMessage(message);
    setGeneratedPassword(password);
  }, [name, phoneNumber]);

  return (
    <div>
      {/* Full-screen loader when redirecting */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-lg font-semibold">Redirecting...</p>
          </div>
        </div>
      )}

      <Button onClick={() => setIsOpen(true)} className="w-full md:w-auto min-h-[40px]">
        <Plus className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Add Member</span>
        <span className="sm:hidden">Add</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="z-50 w-[95vw] max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Adding Member
            </DialogTitle>
            <DialogDescription className="text-sm">Add member data</DialogDescription>
          </DialogHeader>

          <form action={formAction} className="mt-4">
            <input type="hidden" name="password" defaultValue={generatedPassword} />

            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <input hidden name="name" value={name} readOnly />
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    type="string"
                    className="w-full min-h-[40px]"
                    onChange={(e) => setName(e.target.value)}
                  />
                  {state?.errors &&
                    typeof state.errors == "object" &&
                    "name" in state.errors && (
                      <p className="text-destructive text-xs sm:text-sm">
                        {(state.errors as any).name}
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <input hidden name="phoneNumber" value={phoneNumber} readOnly />
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <Input
                    type="string"
                    className="w-full min-h-[40px]"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  {state?.errors &&
                    typeof state.errors == "object" &&
                    "phoneNumber" in state.errors && (
                      <p className="text-destructive text-xs sm:text-sm">
                        {(state.errors as any).phoneNumber}
                      </p>
                    )}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6 w-full">
                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium">Generated Password</Label>
                  <div className="flex gap-2 sm:gap-3">
                    <Input
                      type="string"
                      readOnly
                      disabled
                      className="w-full min-h-[40px]"
                      value={generatedPassword}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={handleCopy}
                            className="min-h-[40px] px-3"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Copy Password
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {state?.errors &&
                    typeof state.errors == "object" &&
                    state.errors instanceof Error && (
                      <p className="text-destructive text-xs sm:text-sm">
                        {(state.errors as any).message}
                      </p>
                    )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6 sm:mt-8">
                <Button
                  type="button"
                  className="px-4 min-h-[40px] order-2 sm:order-1"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-4 min-h-[40px] order-1 sm:order-2"
                  disabled={pending}
                  variant="default"
                >
                  {pending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  