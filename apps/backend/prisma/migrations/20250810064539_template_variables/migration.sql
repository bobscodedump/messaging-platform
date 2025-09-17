-- AlterTable
ALTER TABLE "public"."messages" ADD COLUMN     "variables" TEXT;

-- AlterTable
ALTER TABLE "public"."templates" ADD COLUMN     "variables" TEXT[] DEFAULT ARRAY[]::TEXT[];
