/*
  Warnings:

  - You are about to drop the column `template_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `variables` on the `messages` table. All the data in the column will be lost.
  - Made the column `contact_id` on table `messages` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_contact_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_template_id_fkey";

-- AlterTable
ALTER TABLE "public"."messages" DROP COLUMN "template_id",
DROP COLUMN "variables",
ALTER COLUMN "contact_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
