import z from "zod"
import { getApiErrorMessage } from "./api-error-message"

export const parseStateError = (error: Error) => {
  console.log(`Error of type: ${error.message}`)
    if (error instanceof z.ZodError) {
          return {
            success: false,
            data: null,
            errors: Object.fromEntries(
              Object.entries(error.flatten().fieldErrors).map(([key, value]) => [
                key,
                value?.join(", "),
              ])
            ),
          };
        }
        return {
          success: false,
          errors: {
            message: getApiErrorMessage(error),
          },
          data: null,
        };
}
