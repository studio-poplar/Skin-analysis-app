-- AlterTable
ALTER TABLE "care_step_order" ADD COLUMN     "category_id" TEXT;

-- AlterTable
ALTER TABLE "design_settings" ADD COLUMN     "body_text_color_hex" TEXT,
ADD COLUMN     "font_family" TEXT NOT NULL DEFAULT 'sans';

-- CreateTable
CREATE TABLE "faq_items" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "care_step_order" ADD CONSTRAINT "care_step_order_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;
