-- CreateTable
CREATE TABLE "diagnosis_flow_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lifestyle_before_genre" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosis_flow_settings_pkey" PRIMARY KEY ("id")
);
