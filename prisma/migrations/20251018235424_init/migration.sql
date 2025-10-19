-- CreateTable
CREATE TABLE "ShortenedUrl" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShortenedUrl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortenedUrl_code_key" ON "ShortenedUrl"("code");

-- CreateIndex
CREATE INDEX "ShortenedUrl_code_idx" ON "ShortenedUrl"("code");
