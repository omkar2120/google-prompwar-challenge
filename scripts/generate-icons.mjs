// Rasterizes the brand SVG marks into the PNG icons referenced by index.html
// and the PWA manifest. Run once (or whenever the SVGs change):
//   node scripts/generate-icons.mjs
// `sharp` is a devDependency used only here — nothing ships to the runtime bundle.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');

const standard = readFileSync(path.join(pub, 'icon.svg'));
const maskable = readFileSync(path.join(pub, 'icon-maskable.svg'));

/** @type {Array<{src: Buffer, size: number, out: string}>} */
const targets = [
  { src: standard, size: 16, out: 'favicon-16x16.png' },
  { src: standard, size: 32, out: 'favicon-32x32.png' },
  { src: standard, size: 180, out: 'apple-touch-icon.png' },
  { src: standard, size: 192, out: 'pwa-192x192.png' },
  { src: standard, size: 512, out: 'pwa-512x512.png' },
  { src: maskable, size: 192, out: 'maskable-192x192.png' },
  { src: maskable, size: 512, out: 'maskable-512x512.png' },
];

await Promise.all(
  targets.map(({ src, size, out }) =>
    sharp(src, { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(pub, out))
      .then(() => console.log(`✓ ${out} (${size}x${size})`))
  )
);

console.log('Done — icons written to public/');
