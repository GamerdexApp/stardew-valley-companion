// Makes a small copy of each location picture. The cards show them at 40 px, and the originals are
// map sized (the largest is 3.7 MB). A failure here only costs speed, so it never stops an install.
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const SOURCE = "public/images/locations";
const TARGET = path.join(SOURCE, "thumbs");
const WIDTH = 160;

try {
  const { default: sharp } = await import("sharp");
  if (!existsSync(SOURCE)) throw new Error(`${SOURCE} is missing`);
  mkdirSync(TARGET, { recursive: true });
  const files = readdirSync(SOURCE).filter((name) =>
    /\.(png|jpe?g)$/i.test(name),
  );
  await Promise.all(
    files.map((name) =>
      sharp(path.join(SOURCE, name))
        .resize({ width: WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(TARGET, `${path.parse(name).name}.webp`)),
    ),
  );
  console.log(`Made ${files.length} location thumbnails in ${TARGET}`);
} catch (error) {
  console.warn(`Skipped location thumbnails: ${error.message}`);
}
