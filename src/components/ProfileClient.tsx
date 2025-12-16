'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

export default function ProfileClient() {
  const router = useRouter();
  React.useEffect(() => router.push('/'), [router]);
  return (<div className='min-h-screen flex items-center justify-center'><AiOutlineLoading3Quarters className='text-4xl animate-spin' /></div>);
}