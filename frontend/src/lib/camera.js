import { Capacitor } from '@capacitor/core';

// Whether to show a dedicated "Take Photo" button next to "Add Photos".
// - Native apps (iPhone and Android): the multi-select photo picker doesn't reliably
//   offer the camera, so we add our own. On Android, Capacitor honours `capture`
//   without the CAMERA permission being declared (it uses the system camera app).
// - Phone/tablet browsers (coarse pointer): `capture` opens the camera directly.
// - Not desktop: `capture` is ignored, so the button would just be a second file dialog.
export const canTakePhoto =
  typeof window !== 'undefined' &&
  (Capacitor.isNativePlatform() || !!window.matchMedia?.('(pointer: coarse)').matches);
