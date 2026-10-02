import { Capacitor } from '@capacitor/core';

// Whether to show a dedicated "Take Photo" button next to "Add Photos".
// - iPhone app: the multi-select photo picker doesn't offer the camera, so we add our own.
// - Phone/tablet browsers (coarse pointer): `capture` opens the camera directly.
// - Not the Android app: its system picker already offers the camera, and a capture
//   input there would need the CAMERA permission declared for no gain.
// - Not desktop: `capture` is ignored, so the button would just be a second file dialog.
export const canTakePhoto =
  typeof window !== 'undefined' &&
  (Capacitor.getPlatform() === 'ios' ||
    (!Capacitor.isNativePlatform() && !!window.matchMedia?.('(pointer: coarse)').matches));
