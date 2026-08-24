import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.base69ceb6b4f41f5a2cee0c7016.app',
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
