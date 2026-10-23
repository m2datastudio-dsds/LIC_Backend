CREATE TABLE "Insurance"."Property" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "propertyType" TEXT NOT NULL,
  "listingType" TEXT NOT NULL DEFAULT 'SALE',
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "price" DECIMAL(14,2) NOT NULL,
  "location" TEXT NOT NULL,
  "address" TEXT,
  "bedrooms" INTEGER,
  "bathrooms" INTEGER,
  "area" DOUBLE PRECISION,
  "areaUnit" TEXT NOT NULL DEFAULT 'sq ft',
  "description" TEXT,
  "amenities" JSONB,
  "media" JSONB,
  "contactName" TEXT,
  "contactPhone" TEXT,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Property_slug_key" ON "Insurance"."Property"("slug");
CREATE INDEX "Property_isActive_idx" ON "Insurance"."Property"("isActive");
CREATE INDEX "Property_propertyType_idx" ON "Insurance"."Property"("propertyType");
CREATE INDEX "Property_location_idx" ON "Insurance"."Property"("location");
