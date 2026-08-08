-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('single_select', 'multi_select');

-- CreateTable
CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "product_code" TEXT NOT NULL,
    "name_jp" TEXT NOT NULL,
    "name_us_ref" TEXT,
    "category" TEXT NOT NULL,
    "price_jpy" INTEGER NOT NULL,
    "product_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "product_clinical_data" (
    "data_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "summary_text" TEXT NOT NULL,
    "has_anti_wrinkle_test" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,
    "last_verified_at" TIMESTAMP(3),

    CONSTRAINT "product_clinical_data_pkey" PRIMARY KEY ("data_id")
);

-- CreateTable
CREATE TABLE "genres" (
    "genre_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "draft_name" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "concern_categories" (
    "category_id" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "draft_name" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "line_url_override" TEXT,
    "line_message_override" TEXT,

    CONSTRAINT "concern_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "concern_general_knowledge" (
    "knowledge_id" SERIAL NOT NULL,
    "category_id" TEXT NOT NULL,
    "content_text" TEXT NOT NULL,
    "draft_content_text" TEXT,
    "self_care_text" TEXT,
    "draft_self_care_text" TEXT,
    "is_source_verified" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,

    CONSTRAINT "concern_general_knowledge_pkey" PRIMARY KEY ("knowledge_id")
);

-- CreateTable
CREATE TABLE "product_concern_map" (
    "map_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "category_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "product_concern_map_pkey" PRIMARY KEY ("map_id")
);

-- CreateTable
CREATE TABLE "questions" (
    "question_id" SERIAL NOT NULL,
    "step" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "parent_category_id" TEXT,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "option_id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("option_id")
);

-- CreateTable
CREATE TABLE "option_product_map" (
    "map_id" SERIAL NOT NULL,
    "option_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "option_product_map_pkey" PRIMARY KEY ("map_id")
);

-- CreateTable
CREATE TABLE "option_concern_map" (
    "map_id" SERIAL NOT NULL,
    "option_id" INTEGER NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "option_concern_map_pkey" PRIMARY KEY ("map_id")
);

-- CreateTable
CREATE TABLE "diagnosis_sessions" (
    "session_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers_json" JSONB NOT NULL,
    "line_redirect_clicked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "diagnosis_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "diagnosis_results" (
    "result_id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "recommended_product_ids" JSONB NOT NULL,
    "displayed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosis_results_pkey" PRIMARY KEY ("result_id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_contents" (
    "key" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "draft_value" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_contents_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "site_images" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "folder" TEXT,
    "usage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "primary_color_hex" TEXT NOT NULL DEFAULT '#e11d48',
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "button_style" TEXT NOT NULL DEFAULT 'rounded-full',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "line_url" TEXT NOT NULL,
    "button_text" TEXT NOT NULL DEFAULT 'LINEで相談する',
    "banner_image_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_step_order" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "care_step_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE UNIQUE INDEX "product_clinical_data_product_id_key" ON "product_clinical_data"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- AddForeignKey
ALTER TABLE "product_clinical_data" ADD CONSTRAINT "product_clinical_data_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concern_categories" ADD CONSTRAINT "concern_categories_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concern_general_knowledge" ADD CONSTRAINT "concern_general_knowledge_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_concern_map" ADD CONSTRAINT "product_concern_map_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_concern_map" ADD CONSTRAINT "product_concern_map_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "concern_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_product_map" ADD CONSTRAINT "option_product_map_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_options"("option_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_product_map" ADD CONSTRAINT "option_product_map_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_concern_map" ADD CONSTRAINT "option_concern_map_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_options"("option_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_concern_map" ADD CONSTRAINT "option_concern_map_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_results" ADD CONSTRAINT "diagnosis_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnosis_sessions"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_results" ADD CONSTRAINT "diagnosis_results_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
