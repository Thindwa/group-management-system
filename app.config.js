export default {
  expo: {
    name: 'Group Management System',
    slug: 'group-management-system',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yourcompany.groupmanagement',
      buildNumber: '1'
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#ffffff'
      },
      package: 'com.yourcompany.groupmanagement',
      versionCode: 1
    },
    web: {},
    plugins: [],
    extra: {
      eas: {
        projectId: '1658294f-ea83-4532-8a0e-552e5f83d3c0'
      }
    }
  }
};
