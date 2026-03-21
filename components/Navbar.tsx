"use client";

import { LayoutGrid, LogOut, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useEffect, useState } from "react";
import { useToast } from "./Toast";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/contexts/ThemeContext";

export function Navbar() {
  const router = useRouter();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setEmail(data.session.user.email || '');
    });
  }, []);

  const handleSignout = async () => {
    try {
      await db.signOut();
      router.push('/login');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const initial = email ? email.substring(0, 1).toUpperCase() : '?';

  return (
    <nav className="h-12 w-full bg-white dark:bg-[#1d2125] text-[#44546f] dark:text-[#9fadbc] flex items-center justify-between px-3 border-b border-[#091e4224] dark:border-[#A6C5E2]/[0.16] shrink-0 text-sm font-medium z-50 shadow-sm dark:shadow-none transition-colors">
      <div className="flex items-center gap-2 h-full">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] px-3 py-1.5 rounded transition-colors"
          onClick={() => router.push('/dashboard')}
        >
          <LayoutGrid size={18} className="text-[#0c66e4] dark:text-white" />
          <span className="font-semibold text-[16px] text-[#172b4d] dark:text-white tracking-tight hidden sm:block">CopyFlow</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] p-2 rounded transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-[#9fadbc] hover:text-white transition-colors" />
          ) : (
            <Moon size={18} className="text-[#44546f] hover:text-[#172b4d] transition-colors" />
          )}
        </button>
        <button
          onClick={handleSignout}
          className="hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] px-3 py-1.5 rounded transition-colors group flex items-center gap-2"
          title="Sign Out"
        >
          <LogOut size={16} className="text-[#44546f] dark:text-[#9fadbc] group-hover:text-[#c9372c] dark:group-hover:text-[#EB5A46] transition-colors" />
          <span className="text-[#44546f] dark:text-[#9fadbc] group-hover:text-[#c9372c] dark:group-hover:text-[#EB5A46] hidden md:inline font-medium">Sign Out</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0c66e4] to-[#0055cc] shadow-sm flex items-center justify-center font-semibold text-[12px] text-white cursor-pointer hover:shadow-md transition-all">
          {initial}
        </div>
      </div>
    </nav>
  );
}
