import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { analytics } from './analytics';
import { logger } from './logger';

interface SystemPreferences {
  reducedMotion: boolean;
  prefersColorScheme: 'light' | 'dark' | 'system';
  prefersReducedData: boolean;
  browserCapabilities: {
    webp: boolean;
    avif: boolean;
    javascript: boolean;
    serviceWorker: boolean;
  };
  connection: {
    type: string | null;
    downlinkMax: number | null;
    effectiveType: string | null;
    saveData: boolean;
  };
}

interface NetworkConnection extends NetworkInformation {
  type: string;
  downlinkMax: number;
  effectiveType: string;
  saveData: boolean;
  addEventListener: (type: string, callback: () => void) => void;
  removeEventListener: (type: string, callback: () => void) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
}

interface PreferencesStore extends SystemPreferences {
  updatePreferences: (preferences: Partial<SystemPreferences>) => void;
  detectSystemPreferences: () => void;
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      // Default values
      reducedMotion: false,
      prefersColorScheme: 'system',
      prefersReducedData: false,
      browserCapabilities: {
        webp: false,
        avif: false,
        javascript: true,
        serviceWorker: false,
      },
      connection: {
        type: null,
        downlinkMax: null,
        effectiveType: null,
        saveData: false,
      },

      updatePreferences: (preferences: Partial<SystemPreferences>) => {
        const updatedPrefs: Partial<SystemPreferences> = { ...preferences };
        set((state) => ({ ...state, ...updatedPrefs }));
        analytics.track('preferences_updated', { preferences: updatedPrefs });
        logger.debug('Preferences updated:', updatedPrefs);
      },

      detectSystemPreferences: () => {
        const detectPreferences = async () => {
          try {
            // Check reduced motion preference
            const mediaQuery = window.matchMedia as (
              query: string,
            ) => MediaQueryList;
            const prefersReducedMotion = mediaQuery(
              '(prefers-reduced-motion: reduce)',
            ).matches;

            // Check color scheme preference
            const prefersDark = mediaQuery(
              '(prefers-color-scheme: dark)',
            ).matches;

            // Check browser capabilities
            const checkWebpSupport = async () => {
              const webp = new Image();
              return new Promise((resolve) => {
                webp.onload = webp.onerror = () => {
                  resolve(webp.height === 2);
                };
                webp.src =
                  'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
              });
            };

            const checkAvifSupport = async () => {
              const avif = new Image();
              return new Promise((resolve) => {
                avif.onload = avif.onerror = () => {
                  resolve(avif.height === 1);
                };
                avif.src =
                  'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
              });
            };

            const [webp, avif] = await Promise.all([
              checkWebpSupport(),
              checkAvifSupport(),
            ]);

            // Check connection capabilities
            const connection =
              'connection' in navigator
                ? (navigator as NavigatorWithConnection).connection
                : null;

            const newPreferences: SystemPreferences = {
              reducedMotion: prefersReducedMotion,
              prefersColorScheme: prefersDark ? 'dark' : 'light',
              prefersReducedData: connection?.saveData || false,
              browserCapabilities: {
                webp: webp as boolean,
                avif: avif as boolean,
                javascript: true,
                serviceWorker: 'serviceWorker' in navigator,
              },
              connection: {
                type: connection?.type || null,
                downlinkMax: connection?.downlinkMax || null,
                effectiveType: connection?.effectiveType || null,
                saveData: connection?.saveData || false,
              },
            };

            get().updatePreferences(newPreferences);

            // Set up listeners for preference changes
            mediaQuery('(prefers-reduced-motion: reduce)').addEventListener(
              'change',
              (e) => {
                get().updatePreferences({ reducedMotion: e.matches });
              },
            );

            mediaQuery('(prefers-color-scheme: dark)').addEventListener(
              'change',
              (e) => {
                get().updatePreferences({
                  prefersColorScheme: e.matches ? 'dark' : 'light',
                });
              },
            );

            if ('connection' in navigator && navigator.connection) {
              const conn = (navigator as NavigatorWithConnection).connection;
              if (conn?.addEventListener) {
                conn.addEventListener('change', () => {
                  get().updatePreferences({
                    connection: {
                      type: conn.type,
                      downlinkMax: conn.downlinkMax,
                      effectiveType: conn.effectiveType,
                      saveData: conn.saveData,
                    },
                  });
                });
              }
            }
          } catch (error: unknown) {
            logger.error('Error detecting system preferences:', error);
            return false;
          }
        };

        detectPreferences();
      },
    }),
    {
      name: 'user-preferences',
      partialize: (state) => ({
        prefersColorScheme: state.prefersColorScheme,
        reducedMotion: state.reducedMotion,
        prefersReducedData: state.prefersReducedData,
      }),
    },
  ),
);
