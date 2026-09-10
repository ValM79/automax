// Regenerate the Android launcher icons from resources/icon.png.
// Run manually when the brand icon changes:
//   SHARP_PATH=<path to a sharp install> node scripts/gen-android-icons.mjs
//
// Produces, per density:
//   mipmap-*/ic_launcher.png         legacy square icon (48dp)  = full-bleed art
//   mipmap-*/ic_launcher_round.png   legacy round icon  (48dp)  = full-bleed art, circle
//   mipmap-*/ic_launcher_foreground.png  adaptive fg   (108dp) = artwork trimmed to
//                                        ~62% of canvas, centred, transparent margin
//   mipmap-*/ic_launcher_background.png   adaptive bg   (108dp) = solid white
// plus mipmap-anydpi-v26/ic_launcher{,_round}.xml (adaptive-icon, NO inset).
//
// Why no <inset> in the XML: the foreground already places the artwork inside the
// adaptive safe zone. An extra inset (Android Studio's default, and what v20
// shipped) double-pads it -> tiny "icon inside an icon".
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');

const SRC = 'resources/icon.png';
const RES = 'android/app/src/main/res';
const WHITE = { r: 255, g: 255, b: 255 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

// legacy = 48dp base, adaptive = 108dp base
const LEGACY = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const ADAPT = { ldpi: 81, mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const FG_FRACTION = 0.62; // artwork share of the 108dp adaptive canvas

// Tight crop of the artwork (drops the white frame).
const artBuf = await sharp(SRC).trim({ threshold: 12 }).png().toBuffer();
const art = sharp(artBuf);
const artMeta = await art.metadata();
console.log(`trimmed artwork: ${artMeta.width}x${artMeta.height}`);

function circleMask(size) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
}

for (const [dpi, size] of Object.entries(LEGACY)) {
  const dir = resolve(RES, `mipmap-${dpi}`);
  mkdirSync(dir, { recursive: true });
  // full-bleed art on white, square
  const sq = await sharp({ create: { width: size, height: size, channels: 3, background: WHITE } })
    .composite([{ input: await sharp(artBuf).resize(size, size, { fit: 'contain', background: WHITE }).toBuffer() }])
    .png()
    .toBuffer();
  writeFileSync(resolve(dir, 'ic_launcher.png'), sq);
  writeFileSync(
    resolve(dir, 'ic_launcher_round.png'),
    await sharp(sq).composite([{ input: circleMask(size), blend: 'dest-in' }]).png().toBuffer(),
  );
}

for (const [dpi, size] of Object.entries(ADAPT)) {
  const dir = resolve(RES, `mipmap-${dpi}`);
  mkdirSync(dir, { recursive: true });
  const content = Math.round(size * FG_FRACTION);
  const fg = await sharp({ create: { width: size, height: size, channels: 4, background: CLEAR } })
    .composite([
      { input: await sharp(artBuf).resize(content, content, { fit: 'contain', background: CLEAR }).toBuffer(), gravity: 'centre' },
    ])
    .png()
    .toBuffer();
  writeFileSync(resolve(dir, 'ic_launcher_foreground.png'), fg);
  writeFileSync(
    resolve(dir, 'ic_launcher_background.png'),
    await sharp({ create: { width: size, height: size, channels: 3, background: WHITE } }).png().toBuffer(),
  );
}

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
mkdirSync(resolve(RES, 'mipmap-anydpi-v26'), { recursive: true });
writeFileSync(resolve(RES, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptiveXml);
writeFileSync(resolve(RES, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptiveXml);

console.log('done: legacy + adaptive icons + anydpi-v26 XML');
