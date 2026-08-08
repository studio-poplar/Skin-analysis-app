-- CreateTable
CREATE TABLE "products" (
    "product_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_code" TEXT NOT NULL,
    "name_jp" TEXT NOT NULL,
    "name_us_ref" TEXT,
    "category" TEXT NOT NULL,
    "price_jpy" INTEGER NOT NULL,
    "product_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "product_clinical_data" (
    "data_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER NOT NULL,
    "summary_text" TEXT NOT NULL,
    "has_anti_wrinkle_test" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,
    "last_verified_at" DATETIME,
    CONSTRAINT "product_clinical_data_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "genres" (
    "genre_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "concern_categories" (
    "category_id" TEXT NOT NULL PRIMARY KEY,
    "genre_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "concern_categories_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres" ("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "concern_general_knowledge" (
    "knowledge_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category_id" TEXT NOT NULL,
    "content_text" TEXT NOT NULL,
    "is_source_verified" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,
    CONSTRAINT "concern_general_knowledge_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories" ("category_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_concern_map" (
    "map_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER NOT NULL,
    "category_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    CONSTRAINT "product_concern_map_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_concern_map_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories" ("category_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questions" (
    "question_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "step" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "parent_category_id" TEXT,
    CONSTRAINT "questions_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "concern_categories" ("category_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_options" (
    "option_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question_id" INTEGER NOT NULL,
    "option_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("question_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "option_product_map" (
    "map_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "option_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    CONSTRAINT "option_product_map_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_options" ("option_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "option_product_map_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "option_concern_map" (
    "map_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "option_id" INTEGER NOT NULL,
    "category_id" TEXT NOT NULL,
    CONSTRAINT "option_concern_map_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_options" ("option_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "option_concern_map_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories" ("category_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "diagnosis_sessions" (
    "session_id" TEXT NOT NULL PRIMARY KEY,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers_json" JSONB NOT NULL,
    "line_redirect_clicked" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "diagnosis_results" (
    "result_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "recommended_product_ids" JSONB NOT NULL,
    "displayed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diagnosis_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnosis_sessions" ("session_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "diagnosis_results_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "concern_categories" ("category_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE UNIQUE INDEX "product_clinical_data_product_id_key" ON "product_clinical_data"("product_id");
