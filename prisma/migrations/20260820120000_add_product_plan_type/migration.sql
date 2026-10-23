ALTER TABLE "Insurance"."Product" ADD COLUMN "planType" TEXT;
CREATE INDEX "Product_planType_idx" ON "Insurance"."Product"("planType");
