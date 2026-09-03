import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Canonical (iOS) bundle id -- a clean reverse-DNS id we own, replacing the
  // Base44-generated 'com.base69ceb6b4f41f5a2cee0c7016.app'. Android deliberately
  // keeps that old id: it's already live on Google Play (applicationId is pinned
  // in android/app/build.gradle) and changing it there would mean a new listing.
  appId: 'ie.automax.app',
  appName: 'AutoMax',
  webDir: 'dist',
  // Without this, the native WebView's origin is capacitor://localhost (iOS)
  // or https://localhost (Android), which the API Gateway's CORS policy
  // rejects -- it only allows https://automax.ie / https://www.automax.ie.
  // Presenting the app's own origin as automax.ie avoids needing to loosen
  // CORS to accept arbitrary native-app origins.
  server: {
    hostname: 'automax.ie',
    iosScheme: 'https',
    androidScheme: 'https'
  }
};

export default config;
