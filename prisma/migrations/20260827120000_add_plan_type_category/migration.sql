ALTER TABLE "Insurance"."InsurancePlanType"
ADD COLUMN "categorySlug" TEXT NOT NULL DEFAULT 'life-insurance';

CREATE INDEX "InsurancePlanType_categorySlug_idx"
ON "Insurance"."InsurancePlanType"("categorySlug");
