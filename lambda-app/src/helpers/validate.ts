import { ZodSchema } from 'zod'
import { emailSchema } from '../schema'

type ValidationError = {
    message: string
}

function safeValidateString<T>(
    data: string,
    schema: ZodSchema<T>,
): { validatedValue?: T; error?: string } {
    const validatedData = schema.safeParse(data)
    if ('error' in validatedData) {
        return { error: validatedData.error!.errors[0].message }
    }
    return { validatedValue: validatedData.data }
}

export function validateEmail(email?: string) {
    if (!email) {
        return undefined
    }
    const { error: validationError } = safeValidateString(
        email.trim(),
        emailSchema,
    )
    if (validationError) {
        return undefined
    }
    return email.trim()
}

export function validate<T>(
    data: Partial<T>,
    schema: any,
): T & { errors?: string[] } {
    const cleanedData = Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(data).filter(([_, v]) => v !== undefined),
    )
    // eslint-disable-next-line
    const validated = schema.safeParse(cleanedData)
    return {
        ...('error' in validated && {
            errors: (validated.error.errors as ValidationError[]).map(
                ({ message }) => message,
            ),
        }),
        ...('data' in validated && validated.data),
    }
}
