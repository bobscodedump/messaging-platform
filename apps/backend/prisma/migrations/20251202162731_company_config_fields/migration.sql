-- AlterTable
ALTER TABLE "public"."companies" ADD COLUMN     "google_calendar_id" TEXT,
ADD COLUMN     "message_send_delay_ms" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Singapore';
