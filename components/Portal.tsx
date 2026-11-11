import type { ReactNode } from 'react';

export function Portal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function WebOverlay({ children }: { children: ReactNode; onClose: () => void }) {
  return <>{children}</>;
}
