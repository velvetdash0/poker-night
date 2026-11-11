import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return <>{children}</>;
  return createPortal(children, document.body);
}

/** Real DOM overlay so the sheet stays pinned to the viewport on web. */
export function WebOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  if (typeof document === 'undefined') return <>{children}</>;
    return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div
        onClick={onClose}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20, 22, 26, 0.38)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
