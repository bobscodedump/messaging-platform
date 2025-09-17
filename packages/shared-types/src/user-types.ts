import type { UserRole } from '@prisma/client';

export interface CreateUserDto {
    companyId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

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