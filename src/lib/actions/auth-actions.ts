"use server";
import z from "zod";
import { credentialsSchema } from "@/lib/schemas/credentialsSchema";
import { newUserSchema } from "@/lib/schemas/newUserSchema";
import { login, logout } from "@/lib/data/auth";
import { parseStateError } from "@/lib/utils/state-errors";
import { registerMember } from "../data/member";
import { ApiError, NotFoundError } from "@/core/api-error";

export const registerUser = async (_prevState: unknown, formData: FormData) => {
  try {
    const userData = {
      name: formData.get("name") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      password: formData.get("password") as string,
    };
    const validatedUser = newUserSchema.parse(userData);
    const user = await registerMember(
      validatedUser.name,
      validatedUser.password,
      validatedUser.phoneNumber
    );
    return {
      success: true,
      errors: null,
      data: user,
    };
  } catch (e) {
    if (e instanceof ApiError) {
      return {
        success: false,
        errors: e,
        data: null,
      };
    }
    return parseStateError(e as Error);
  }
};

export const loginAction = async (_prevState: unknown, formData: FormData) => {
  const phoneNumber = String(formData.get("phoneNumber") ?? "");
  // Never echo password back to the client
  const defaultValues = { phoneNumber };

  try {
    const credentials = credentialsSchema.parse({
      phoneNumber: formData.get("phoneNumber"),
      password: formData.get("password"),
    });
    const response = await login(credentials);
    return {
      defaultValues,
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        defaultValues,
        success: false,
        errors: {
          message: error.message,
        },
      };
    }
    const parsed = parseStateError(error as Error);
    return { ...parsed, defaultValues };
  }
};

export const logoutAction = async () => {
  await logout();
  return {
    success: true,
    errors: null,
    data: null,
  };
};
