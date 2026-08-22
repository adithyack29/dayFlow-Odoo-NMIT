import { z } from 'zod';

// Password complexity regex: at least 1 number and at least 1 special character
const numberRegex = /[0-9]/;
const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export const signUpSchema = z.object({
  employeeId: z
    .string()
    .min(3, 'Employee ID must be at least 3 characters long')
    .max(20, 'Employee ID must not exceed 20 characters')
    .trim(),
  email: z
    .string()
    .email('Please provide a valid email address (e.g. user@company.com)')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .refine((val) => numberRegex.test(val), {
      message: 'Password must contain at least one number (0-9)',
    })
    .refine((val) => specialCharRegex.test(val), {
      message: 'Password must contain at least one special character (e.g. !@#$%^&*)',
    }),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  role: z.enum(['EMPLOYEE', 'ADMIN'], {
    message: 'Role must be either EMPLOYEE or ADMIN',
  }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

// Formats Zod errors into a clean field-error map: { [field]: "Error message" }
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const fieldName = issue.path[0]?.toString() || 'general';
    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = issue.message;
    }
  }
  return fieldErrors;
}
