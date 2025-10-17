'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
export default function ProfileClient() {
  const router = useRouter();
  useEffect(() => { router.push('/'); }, [router]);
  return <div>Redirecting...</div>;
}
