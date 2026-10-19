// Turns whatever picture the person chose into a small square JPEG before it is uploaded, so a 12 MB phone photo
// becomes a profile picture of a few dozen KB. A private person's photo is cropped to a square around the centre;
// a trader's logo is fitted inside the square on white so a wide logo is never cut off.
export async function squareImage(file, { size = 400, fit = 'cover' } = {}) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read that picture. Please choose a JPG or PNG.'));
      i.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    if (fit === 'contain') {
      const scale = Math.min(size / w, size / h);
      const dw = w * scale;
      const dh = h * scale;
      ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
    } else {
      const side = Math.min(w, h);
      ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) throw new Error('Could not prepare that picture. Please try another one.');
    return new File([blob], 'profile.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Pictures saved or screenshotted from a website often carry a plain white (or near white) border. On a banner that shows as
// white strips at the sides, so the border is cut off: any outer rows or columns that are all white are removed
// (never more than a quarter of the picture from each side).
function trimWhiteBorders(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const white = (data, i) => data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238;
  const column = (x) => { const d = ctx.getImageData(x, 0, 1, h).data; for (let y = 0; y < h; y += 3) if (!white(d, y * 4)) return false; return true; };
  const row = (y) => { const d = ctx.getImageData(0, y, w, 1).data; for (let x = 0; x < w; x += 3) if (!white(d, x * 4)) return false; return true; };
  let left = 0; while (left < w * 0.25 && column(left)) left += 1;
  let right = 0; while (right < w * 0.25 && column(w - 1 - right)) right += 1;
  let top = 0; while (top < h * 0.25 && row(top)) top += 1;
  let bottom = 0; while (bottom < h * 0.25 && row(h - 1 - bottom)) bottom += 1;
  if (left + right + top + bottom < 4) return canvas;
  const out = document.createElement('canvas');
  out.width = w - left - right;
  out.height = h - top - bottom;
  out.getContext('2d').drawImage(canvas, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

// A business's cover photo (the banner of its dealer page and the background of its card): kept wide, not cropped here,
// shrunk to at most 1600 px across and saved as a JPEG so a 12 MB phone photo becomes a few hundred KB.
export async function coverImage(file, { maxWidth = 1600 } = {}) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read that picture. Please choose a JPG or PNG.'));
      i.src = url;
    });
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const trimmed = trimWhiteBorders(canvas);
    const blob = await new Promise((resolve) => trimmed.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('Could not prepare that picture. Please try another one.');
    return new File([blob], 'cover.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}
