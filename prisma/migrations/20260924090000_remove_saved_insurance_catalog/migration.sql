-- Insurance products are read live from LIC and Star Health, not persisted locally.
ALTER TABLE "Insurance"."Enquiry" DROP CONSTRAINT IF EXISTS "Enquiry_productId_fkey";
ALTER TABLE "Insurance"."ProductView" DROP CONSTRAINT IF EXISTS "ProductView_productId_fkey";
ALTER TABLE "Insurance"."ProductView" DROP CONSTRAINT IF EXISTS "ProductView_userId_fkey";
DROP TABLE IF EXISTS "Insurance"."ProductView";
ALTER TABLE "Insurance"."Enquiry" DROP COLUMN IF EXISTS "productId";
DROP TABLE IF EXISTS "Insurance"."Product";
DROP TABLE IF EXISTS "Insurance"."InsurancePlanType";
DROP TABLE IF EXISTS "Insurance"."Category";
