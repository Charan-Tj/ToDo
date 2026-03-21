"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from './Navbar';
import { ToastProvider } from './Toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [init, setInit] = useState(false);
  const showNavbar = pathname !== '/login';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const isAuth = !!data.session;
      if (!isAuth && pathname !== '/login') router.push('/login');
      else if (isAuth && pathname === '/login') router.push('/dashboard');
      else setInit(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isAuth = !!session;
      if (!isAuth && pathname !== '/login') router.push('/login');
      else if (isAuth && pathname === '/login') router.push('/dashboard');
      else setInit(true);
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (!init) return <div className="bg-[#0F1923] h-full w-full flex-1"></div>;

  return (
    <ToastProvider>
      {showNavbar && <Navbar />}
      <main className="flex-1 overflow-hidden flex flex-col w-full h-full relative z-0">{children}</main>
    </ToastProvider>
  );
}
