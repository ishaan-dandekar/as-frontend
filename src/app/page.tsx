"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hero } from '@/components/sections/Hero';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <main className="min-h-screen">
      <Hero />
    </main>
  );
}
