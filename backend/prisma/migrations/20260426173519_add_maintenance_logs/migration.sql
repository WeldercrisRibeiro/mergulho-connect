-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "script_id" TEXT NOT NULL,
    "executor_id" UUID NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);
