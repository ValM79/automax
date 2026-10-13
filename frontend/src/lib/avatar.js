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
