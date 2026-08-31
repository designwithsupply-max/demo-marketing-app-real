// One-off image compression pass (run manually, not part of the build).
// - hero_image.jpg is actually PNG-encoded despite its .jpg extension, which is
//   why it's ~1.9MB for a photo. Re-encoding it as a real JPEG is the single
//   biggest page-weight win on the site (it's the homepage hero/LCP image).
// - Every other JPEG over ~80KB gets re-encoded at quality 80, which is
//   visually lossless for photos at web display sizes but cuts file size
//   substantially versus typical camera/export JPEGs.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Prevent libvips from keeping the source file referenced in its internal
// cache after we've read it — on Windows that can make an immediate
// write/rename over the same path fail with a transient lock error.
sharp.cache(false);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function writeWithRetry(targetPath, buffer, attempts = 5) {
  const tmp = targetPath + ".tmp";
  for (let i = 1; i <= attempts; i++) {
    try {
      fs.writeFileSync(tmp, buffer);
      fs.renameSync(tmp, targetPath);
      return;
    } catch (e) {
      if (i === attempts) throw e;
      await sleep(200 * i);
    }
  }
}

const ROOT = path.join(__dirname, "..", "src", "assets");
const SIZE_THRESHOLD = 80 * 1024; // 80KB
const MAX_WIDTH = 1920;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(jpe?g)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

async function main() {
  const files = walk(ROOT);
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const before = fs.statSync(file).size;
    if (before < SIZE_THRESHOLD) continue;

    const image = sharp(file);
    const meta = await image.metadata();
    let pipeline = sharp(file).rotate(); // rotate() auto-applies EXIF orientation, then strips it
    if (meta.width && meta.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH });
    }
    const buffer = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();

    if (buffer.length < before) {
      await writeWithRetry(file, buffer);
      const after = buffer.length;
      totalBefore += before;
      totalAfter += after;
      console.log(
        `${path.relative(ROOT, file)}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (${(100 - (after / before) * 100).toFixed(0)}% smaller)`
      );
    } else {
      console.log(`${path.relative(ROOT, file)}: already optimal, skipped`);
    }
  }

  console.log(
    `\nTotal: ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
