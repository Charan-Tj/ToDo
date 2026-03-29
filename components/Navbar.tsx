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
    <nav className="h-14 w-full glass-navbar border-x-0 border-t-0 rounded-none text-[var(--text-muted)] flex items-center justify-between px-4 shrink-0 text-sm font-medium z-50">
      <div className="flex items-center gap-2 h-full">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-muted)] px-3 py-2 rounded-[10px] transition-colors"
          onClick={() => router.push('/dashboard')}
        >
          <LayoutGrid size={18} className="text-[var(--primary)]" />
          <span className="font-semibold text-[16px] text-[var(--text)] tracking-tight hidden sm:block">CopyFlow</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="btn btn-ghost p-2"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors" />
          ) : (
            <Moon size={18} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors" />
          )}
        </button>
        <button
          onClick={handleSignout}
          className="btn btn-ghost px-3 py-2 group flex items-center gap-2"
          title="Sign Out"
        >
          <LogOut size={16} className="text-[var(--text-muted)] group-hover:text-[var(--danger)] transition-colors" />
          <span className="text-[var(--text-muted)] group-hover:text-[var(--danger)] hidden md:inline font-medium">Sign Out</span>
        </button>
        <div className="w-9 h-9 rounded-full bg-[linear-gradient(140deg,var(--primary),#2a8076)] shadow-sm flex items-center justify-center font-semibold text-[12px] text-white cursor-pointer">
          {initial}
        </div>
      </div>
    </nav>
  );
}
