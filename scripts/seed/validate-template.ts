import { resolve } from "node:path";
import { loadTemplateFile, templateRow } from "./templates";

const file = process.argv[2];
if (!file) {
  console.error(
    "Usage: npx tsx scripts/seed/validate-template.ts <file.json>"
  );
  process.exit(2);
}

try {
  const t = loadTemplateFile(resolve(file));
  const row = templateRow(t);
  console.log(
    `OK ${t.slug}: ${t.slides.length} slides, theme ${t.themeId}, slideCount="${row.slideCount}", stages=${row.config.stages.length}`
  );
  process.exit(0);
} catch (err) {
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
}
