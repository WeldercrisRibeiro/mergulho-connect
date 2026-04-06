-- CreateTable
CREATE TABLE "wz_dispatches" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "target_group_id" TEXT,
    "target_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "wz_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wz_dispatch_attachments" (
    "id" TEXT NOT NULL,
    "dispatch_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,

    CONSTRAINT "wz_dispatch_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wz_dispatch_logs" (
    "id" TEXT NOT NULL,
    "dispatch_id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wz_dispatch_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "wz_dispatch_attachments" ADD CONSTRAINT "wz_dispatch_attachments_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "wz_dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wz_dispatch_logs" ADD CONSTRAINT "wz_dispatch_logs_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "wz_dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
