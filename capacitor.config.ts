import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mathsoccer.app',
  appName: 'Math Soccer',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'Math Soccer',
    backgroundColor: '#001e00',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#001e00',
    },
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;
