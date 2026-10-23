ALTER TABLE "Service" ADD COLUMN "category" "ProductCategory";
CREATE INDEX "Service_category_idx" ON "Service"("category");
