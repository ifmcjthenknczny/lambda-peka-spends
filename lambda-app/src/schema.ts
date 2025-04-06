import { z } from 'zod'
import dayjs from 'dayjs'

export const emailSchema = z.string().email()

export const paramsSchema = z
    .object({
        START_DAY: z
            .string()
            .default(dayjs().subtract(1, 'month').format('YYYY-MM-DD'))
            .transform((val) =>
                dayjs(val).isValid()
                    ? dayjs(val)
                    : dayjs().subtract(1, 'month'),
            ),
        END_DAY: z
            .string()
            .default(dayjs().format('YYYY-MM-DD'))
            .transform((val) => (dayjs(val).isValid() ? dayjs(val) : dayjs())),
    })
    .refine(
        (data) =>
            data.END_DAY &&
            data.START_DAY &&
            data.END_DAY.isSameOrAfter(data.START_DAY),
        {
            message: 'END_DAY must be the same as or after START_DAY',
        },
    )

export const envSchema = z.object({
    EMAIL: emailSchema,
    PASSWORD: z.string().min(1, 'PASSWORD is required'),
    MONGO_URI: z.string().min(1, 'Mongo URI is required'),
    DATABASE_NAME: z.string().min(1, 'Database name is required'),
})
