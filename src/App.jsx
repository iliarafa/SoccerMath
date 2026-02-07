import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import MathSoccer from './MathSoccer';

export default function App() {
  useEffect(() => {
    const initNative = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#0f172a' });
        } catch (e) {}

        try {
          await Keyboard.setAccessoryBarVisible({ isVisible: false });
        } catch (e) {}
      }
    };
    initNative();
  }, []);

  return <MathSoccer />;
}
