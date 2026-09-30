import { api } from '@/api/apiClient';

// Phone cameras routinely produce 4000px+, multi-MB JPEGs, and store portrait
// shots with the pixel buffer in landscape plus an EXIF orientation tag --
// iPhone always does this, and many Android phones do too. Resizing via a
// plain <img> + canvas.drawImage ignores that tag inconsistently across
// browser engines, so a portrait phone photo can come out sideways after
// resize. createImageBitmap's `imageOrientation: 'from-image'` applies the
// embedded orientation during decode itself, so the bitmap (and anything
// drawn from it) is already correctly rotated -- no manual EXIF parsing
// needed, and it works the same for Android and iPhone photos alike.
async function decodeWithOrientation(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Some older engines choke on the option itself -- fall through to
      // the <img>-based path below.
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

// Downscales to a 2000px long edge and re-encodes as JPEG at 85% quality --
// sharp at any size the app ever displays (including the full-screen
// lightbox), while cutting typical phone-camera file size by roughly 10x so
// uploading many photos in parallel actually succeeds instead of timing out.
export async function resizeImageForUpload(file, maxDimension = 2000, quality = 0.85) {
  const source = await decodeWithOrientation(file);
  let width = source.width;
  let height = source.height;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height / width) * maxDimension);
      width = maxDimension;
    } else {
      width = Math.round((width / height) * maxDimension);
      height = maxDimension;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(source, 0, 0, width, height);
  if (typeof source.close === 'function') source.close(); // release ImageBitmap memory
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not process image'))),
      'image/jpeg',
      quality
    );
  });
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}

// Resizes and uploads every photo in photoList (each { file: File }).
// Throws with a specific message if any upload fails, rather than silently
// returning a partial list -- callers should let that error surface to the
// user instead of saving a listing with fewer photos than they chose.
export async function uploadPhotos(photoList) {
  const results = await Promise.all(
    photoList.map(async (p) => {
      try {
        const resized = await resizeImageForUpload(p.file);
        const result = await api.integrations.Core.UploadFile({ file: resized });
        return { url: result.file_url };
      } catch (err) {
        return { error: err?.message || 'Upload failed' };
      }
    })
  );
  const failedCount = results.filter((r) => r.error).length;
  if (failedCount > 0) {
    throw new Error(
      failedCount === photoList.length
        ? 'All photos failed to upload. Please check your connection and try again.'
        : `${failedCount} of ${photoList.length} photos failed to upload. Please try again.`
    );
  }
  return results.map((r) => r.url);
}
