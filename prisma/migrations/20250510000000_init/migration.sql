-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "otp_code" TEXT,
    "otp_expiry" TIMESTAMP(3),
    "otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "otp_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_path" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "variety" TEXT,
    "price_per_gram" DECIMAL(65,30),
    "veg_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_inquiries" (
    "id" SERIAL NOT NULL,
    "business_name" TEXT NOT NULL,
    "contact_person_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "estimated_quantity" TEXT,
    "delivery_frequency" TEXT,
    "address" TEXT,
    "additional_notes" TEXT,
    "business_nature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "staff_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "business_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_inquiry_products" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "business_inquiry_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_inquiry_history" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_inquiry_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "image_path" TEXT NOT NULL,
    "alt_text" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "products_variety_idx" ON "products"("variety");

-- CreateIndex
CREATE INDEX "business_inquiries_is_deleted_created_at_idx" ON "business_inquiries"("is_deleted", "created_at");

-- CreateIndex
CREATE INDEX "business_inquiries_is_deleted_status_idx" ON "business_inquiries"("is_deleted", "status");

-- AddForeignKey
ALTER TABLE "business_inquiry_products" ADD CONSTRAINT "business_inquiry_products_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "business_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_inquiry_products" ADD CONSTRAINT "business_inquiry_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_inquiry_history" ADD CONSTRAINT "business_inquiry_history_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "business_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
