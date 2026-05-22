const APP_VARIANT = process.env.APP_VARIANT || 'production';

const variants = {
  production: {
    name: 'HabiCard',
    slug: 'habicard',
    scheme: 'habicard',
    iosBundleIdentifier: 'com.suryasingh.habicard',
    androidPackage: 'com.suryasingh.habicard',
  },
  preview: {
    name: 'HabiCard Preview',
    slug: 'habicard-preview',
    scheme: 'habicard-preview',
    iosBundleIdentifier: 'com.suryasingh.habicard.preview',
    androidPackage: 'com.suryasingh.habicard.preview',
  },
  development: {
    name: 'HabiCard Dev',
    slug: 'habicard-dev',
    scheme: 'habicard-dev',
    iosBundleIdentifier: 'com.suryasingh.habicard.dev',
    androidPackage: 'com.suryasingh.habicard.dev',
  },
};

const selectedVariant = variants[APP_VARIANT] || variants.production;

module.exports = {
  expo: {
    name: selectedVariant.name,
    slug: selectedVariant.slug,
    version: '1.0.0',
    scheme: selectedVariant.scheme,
    description: 'HabiCard is a calming, card-based habit tracker with daily logs, notes, and analytics.',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: ['expo-notifications'],
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: selectedVariant.iosBundleIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: selectedVariant.androidPackage,
      versionCode: 1,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: "2e618b26-7e60-4b26-9b11-b6449163c4fb"
      }
    }
  },
};
