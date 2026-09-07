import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Canonical (iOS) bundle id -- a clean reverse-DNS id we own, replacing the
  // Base44-generated 'com.base69ceb6b4f41f5a2cee0c7016.app'. Android deliberately
  // keeps that old id: it's already live on Google Play (applicationId is pinned
  // in android/app/build.gradle) and changing it there would mean a new listing.
  appId: 'ie.automax.app',
  appName: 'AutoMax',
  webDir: 'dist',
  // Pin the WebView's origin to a known host so the API Gateway CORS allowlist
  // can name it explicitly instead of accepting arbitrary native-app origins.
  //   Android: `androidScheme: 'https'` works -> origin is https://automax.ie,
  //            already covered by the web allowlist entry.
  //   iOS:     `iosScheme: 'https'` is SILENTLY IGNORED by Capacitor -- WebKit
  //            reserves the https scheme, so Capacitor falls back to its default
  //            and the real origin is `capacitor://automax.ie`. That exact
  //            string must be in the API's allowOrigins (see
  //            backend/cdk/lib/automax-stack.ts corsPreflight) or every fetch
  //            from the iOS app fails preflight. Keep it here as documentation
  //            of intent even though iOS overrides it.
  server: {
    hostname: 'automax.ie',
    iosScheme: 'https',
    androidScheme: 'https'
  }
};

export default config;
