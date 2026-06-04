"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth-actions";
import { logout } from "@/lib/store/features/authSlice";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function UserInfo() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  if(!user){
    // router.push('/login')
  }
  const dispatch = useAppDispatch();
  const [state, formAction, pending] = useActionState(logoutAction, {
    success: false,
    errors: null,
    data: null,
  });
  useEffect(() => {
    if (state?.success) {
      dispatch(logout());
      router.push("/login");
    }
  }, [state?.success, dispatch, router]);
  return (
    <form action={formAction}>
        {user?<div className="flex space-x-1 justify-between items-center">
        <p className="text-lg">
          Welcome <span className="text-md opacity-60">{user.name}</span>
        </p>
        <button type="submit" disabled={pending}>
          <LogOut className="size-5 mr-4 cursor-pointer" />
        </button>
      </div>:
      <div className="text-lg font-bold">I'll Miss Youu</div>}
    </form>
  );
}
