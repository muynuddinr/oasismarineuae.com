'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function SessionProvider({ children }: Props) {
  // Authentication removed - just pass through children
  return <>{children}</>;
}
