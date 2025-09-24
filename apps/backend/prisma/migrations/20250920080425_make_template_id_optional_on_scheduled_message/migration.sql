-- DropForeignKey
ALTER TABLE "public"."scheduled_messages" DROP CONSTRAINT "scheduled_messages_template_id_fkey";

-- AlterTable
ALTER TABLE "public"."scheduled_messages" ALTER COLUMN "template_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."scheduled_messages" ADD CONSTRAINT "scheduled_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
