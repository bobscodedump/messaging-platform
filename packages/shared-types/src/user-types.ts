import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const userSchema = z.object({
    id: z.string(),
    companyId: z.string(),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.nativeEnum(UserRole),
    isActive: z.boolean().optional(),
    lastLoginAt: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

export interface CreateUserDto {
    companyId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

export const updateUserSchema = z.object({
    email: z.string().email().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.nativeEnum(UserRole).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

// model User {
//   id          String   @id @default(cuid())
//   companyId   String   @map("company_id")
//   email       String   @unique
//   passwordHash String  @map("password_hash")
//   firstName   String   @map("first_name")
//   lastName    String   @map("last_name")
//   role        UserRole
//   isActive    Boolean  @default(true) @map("is_active")
//   lastLoginAt DateTime? @map("last_login_at")
//   createdAt   DateTime @default(now()) @map("created_at")
//   updatedAt   DateTime @updatedAt @map("updated_at")
  
//   company     Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
//   messages    Message[]
//   scheduledMessages ScheduledMessage[]
//   auditLogs   AuditLog[]
  
//   @@map("users")
// }