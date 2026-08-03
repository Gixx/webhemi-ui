import { adminAsset } from './assetPaths';

export type AdminSoundName = 'chord' | 'ding';

const SOUND_PATHS: Record<AdminSoundName, string> = {
  /** Critical Stop — error / MessageDialog open. */
  chord: 'sounds/chord.mp3',
  /** Default Beep — click blocked owner while a modal is open (MessageBeep/MB_OK). */
  ding: 'sounds/ding.mp3',
};

/**
 * Play an Admin Theme sound once. Pass a digested Twig `asset()` URL in PHP;
 * Storybook falls back to {@link adminAsset}.
 */
export function playAdminSound(
  name: AdminSoundName,
  soundUrl?: string | null,
): void {
  if (typeof Audio === 'undefined') {
    return;
  }
  const src = soundUrl || adminAsset(SOUND_PATHS[name]);
  try {
    const audio = new Audio(src);
    void audio.play().catch(() => {
      // Autoplay / missing asset — ignore.
    });
  } catch {
    // Ignore construct errors in non-browser test hosts.
  }
}
