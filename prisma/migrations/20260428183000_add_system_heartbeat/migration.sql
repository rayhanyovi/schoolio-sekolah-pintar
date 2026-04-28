CREATE TABLE "SystemHeartbeat" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'vercel-cron',
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "note" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SystemHeartbeat_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SystemHeartbeat_triggeredAt_idx" ON "SystemHeartbeat"("triggeredAt" DESC);
