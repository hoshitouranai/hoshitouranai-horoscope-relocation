// Preserve the approved serif letterforms from the original header lockup.
const original = new Image();
original.src = new URL('./engine/brand/wordmark-original.png', import.meta.url).href;
let preparedWordmark;

export function chartWordmark() {
  preparedWordmark ??= makeWordmark();
  return preparedWordmark;
}

async function makeWordmark() {
  if (!original.complete || !original.naturalWidth) await original.decode();
  const width = 620;
  const height = 58;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(original, 321, 115, width, height, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const coverage = Math.max(0, (pixels.data[i] - 7) / 248);
    pixels.data[i] = 16;
    pixels.data[i + 1] = 30;
    pixels.data[i + 2] = 54;
    pixels.data[i + 3] = Math.round(coverage * 255);
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}
