/*
  Warnings:

  - The `variables` column on the `messages` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."messages" DROP COLUMN "variables",
ADD COLUMN     "variables" TEXT[] DEFAULT ARRAY[]::TEXT[];
