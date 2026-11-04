// Tries the sketchpad's AI endpoint without the sketchpad: sends a few typed questions and, optionally,
// a picture of handwriting, then prints what came back.
//
// Usage (with `npm run dev` running, or against the live site):
//   node scripts/ask-test.mjs                                   # typed questions only, to localhost:5173
//   node scripts/ask-test.mjs http://localhost:5173 photo.png 2 # plus a picture with 2 numbered boxes
//   node scripts/ask-test.mjs https://ali-hussain-portfolio.netlify.app
//
// The picture should already have the numbered boxes drawn on it (the sketchpad does this itself);
// any PNG/JPEG with handwriting works for a first look, with the box count as the last argument.

import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const [origin = 'http://localhost:5173', image, boxes = '1'] = process.argv.slice(2);

const typed = [
  { id: 'q1', text: 'What does Ali do?' },
  { id: 'q2', text: 'has he worked with postgres?' },
  { id: 'q3', text: 'cool site!' },
  { id: 'q4', text: "What's the capital of France?" },
];
const body = { typed, marks: [] };
if (image) {
  const type = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp' }[extname(image).toLowerCase()];
  if (!type) throw new Error('The picture must be a .png, .jpg or .webp');
  body.image = `data:image/${type};base64,${readFileSync(image).toString('base64')}`;
  body.marks = Array.from({ length: Number(boxes) }, (_, i) => i + 1);
}

const started = Date.now();
const res = await fetch(new URL('/api/ask', origin), {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const reply = await res.json();
console.log(`${res.status} in ${Date.now() - started} ms${reply.provider ? ` from ${reply.provider}` : ''}`);
if (!reply.ok) {
  console.log(`${reply.code}: ${reply.error}`);
  process.exit(1);
}
for (const item of reply.items) {
  console.log(`\n[${item.ref}] ${item.kind}: ${JSON.stringify(item.text)}`);
  if (item.answer) console.log(`  → ${item.answer}`);
}
