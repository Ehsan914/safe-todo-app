import {z} from 'zod';

export const TaskSchema = z.object({
    id: z.number(),
    taskName: z.string(),
    isCompleted: z.boolean(),
    createdAt: z.string().or(z.date())
})

export const TaskInputSchema = z.object({
    taskName: z.string().min(1, 'Task name cannot be empty'),
    isCompleted: z.boolean().default(false)
})

export type Task = z.infer<typeof TaskSchema>
export type TaskInput = z.infer<typeof TaskInputSchema>