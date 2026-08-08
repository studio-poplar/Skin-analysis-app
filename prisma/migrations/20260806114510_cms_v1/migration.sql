-- AlterTable
ALTER TABLE "concern_general_knowledge" ADD COLUMN "draft_content_text" TEXT;
ALTER TABLE "concern_general_knowledge" ADD COLUMN "draft_self_care_text" TEXT;

-- CreateTable
CREATE TABLE "admin_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "site_contents" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "page" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "draft_value" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "site_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "folder" TEXT,
    "usage" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "design_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "primary_color_hex" TEXT NOT NULL DEFAULT '#e11d48',
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "button_style" TEXT NOT NULL DEFAULT 'rounded-full',
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "line_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "line_url" TEXT NOT NULL,
    "button_text" TEXT NOT NULL DEFAULT 'LINEで相談する',
    "banner_image_url" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "care_step_order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keyword" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_concern_categories" (
    "category_id" TEXT NOT NULL PRIMARY KEY,
    "genre_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "draft_name" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "line_url_override" TEXT,
    "line_message_override" TEXT,
    CONSTRAINT "concern_categories_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres" ("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_concern_categories" ("category_id", "description", "genre_id", "name", "sort_order") SELECT "category_id", "description", "genre_id", "name", "sort_order" FROM "concern_categories";
DROP TABLE "concern_categories";
ALTER TABLE "new_concern_categories" RENAME TO "concern_categories";
CREATE TABLE "new_genres" (
    "genre_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "draft_name" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_genres" ("genre_id", "name", "sort_order") SELECT "genre_id", "name", "sort_order" FROM "genres";
DROP TABLE "genres";
ALTER TABLE "new_genres" RENAME TO "genres";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");
