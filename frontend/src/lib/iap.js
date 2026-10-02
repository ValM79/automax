import { Capacitor, registerPlugin } from '@capacitor/core';

// Apple Guideline 3.1.1: paid ad packages go through In-App Purchase on iOS,
// not Stripe. IAPPlugin is a local native plugin (frontend/ios/App/App/IAPPlugin.swift)
// wrapping StoreKit 2 -- see verifyAppleTransaction in the backend for the
// actual trust boundary (the purchase itself happens on-device; the backend
// is what decides whether it's real before activating the ad).
export const IAPPlugin = registerPlugin('IAPPlugin');
export const isIOSApp = Capacitor.getPlatform() === 'ios';
