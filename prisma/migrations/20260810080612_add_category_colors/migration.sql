-- CreateTable
CREATE TABLE "category_colors" (
    "category" TEXT NOT NULL,
    "tag_color_hex" TEXT NOT NULL,
    "border_color_hex" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_colors_pkey" PRIMARY KEY ("category")
);
