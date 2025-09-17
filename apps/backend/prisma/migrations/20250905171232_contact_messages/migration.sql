-- AlterTable
ALTER TABLE "public"."messages" ADD COLUMN     "contact_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
