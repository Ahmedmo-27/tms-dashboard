import z from "zod"

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
            message:
              error.message ? error.message : "Unknown error occurred",
          },
          data: null,
        };
}