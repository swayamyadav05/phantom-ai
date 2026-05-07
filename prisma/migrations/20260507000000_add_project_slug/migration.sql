-- Add nullable project slugs for room URLs.
ALTER TABLE "projects" ADD COLUMN "slug" TEXT;

CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");
