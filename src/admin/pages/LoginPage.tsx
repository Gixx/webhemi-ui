import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FloatingModal } from '../bricks/FloatingModal';
import { MessageDialog } from '../bricks/MessageDialog';
import { LoginForm } from '../components/LoginForm/LoginForm';
import { flashOwnedModalAttention } from '../lib/flashOwnedModalAttention';
import { playAdminSound } from '../lib/playAdminSound';

export type LoginPageProps = {
  action: string;
  csrfToken?: string;
  csrfFieldName?: string;
  emailDefault?: string;
  error?: string | null;
  /** Digested Admin banner URL from Twig `asset(...)`. */
  bannerUrl?: string;
  /** Digested chord sound URL from Twig `asset('admin/sounds/chord.mp3')`. */
  errorSoundUrl?: string;
  /** Digested ding sound URL — blocked login host attention. */
  dingSoundUrl?: string;
};

function normalizeError(error: unknown): string | null {
  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  return null;
}

/**
 * Login desktop: form host + optional error MessageDialog on the same `.dashboard`
 * (no portal — avoids DesktopModal discovery races on this page).
 */
export function LoginPage({
  action,
  csrfToken,
  csrfFieldName,
  emailDefault,
  error,
  bannerUrl,
  errorSoundUrl,
  dingSoundUrl,
}: LoginPageProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const modalRootRef = useRef<HTMLDivElement | null>(null);
  const soundedFor = useRef<string | null>(null);
  const message = normalizeError(error);
  const [dismissed, setDismissed] = useState(false);
  const [boundsEl, setBoundsEl] = useState<HTMLElement | null>(null);
  const showAlert = Boolean(message && !dismissed);

  useLayoutEffect(() => {
    setBoundsEl(dashboardRef.current);
  }, []);

  useEffect(() => {
    setDismissed(false);
  }, [message]);

  useEffect(() => {
    if (!message || dismissed) {
      if (!message) {
        soundedFor.current = null;
      }
      return;
    }
    if (soundedFor.current === message) {
      return;
    }
    soundedFor.current = message;
    playAdminSound('chord', errorSoundUrl);
  }, [message, dismissed, errorSoundUrl]);

  return (
    <div ref={dashboardRef} className="dashboard login-desktop">
      <div className="login-host">
        <LoginForm
          action={action}
          csrfToken={csrfToken}
          csrfFieldName={csrfFieldName}
          emailDefault={emailDefault || ''}
          bannerUrl={bannerUrl}
        />
        {showAlert ? (
          <div
            className="modal-blocker"
            aria-hidden
            onPointerDown={(event) => {
              if (event.button !== 0) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              flashOwnedModalAttention(modalRootRef.current, { dingSoundUrl });
            }}
          />
        ) : null}
      </div>
      {showAlert ? (
        <div className="desktop-modal-layer is-alert">
          <FloatingModal boundsEl={boundsEl} rootRef={modalRootRef}>
            <MessageDialog
              type="error"
              title="Error"
              message={message!}
              onClose={() => setDismissed(true)}
            />
          </FloatingModal>
        </div>
      ) : null}
    </div>
  );
}
