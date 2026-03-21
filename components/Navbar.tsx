"use client";

import { LayoutGrid, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useEffect, useState } from "react";
import { useToast } from "./Toast";
import { supabase } from "@/lib/supabase";

export function Navbar() {
  const router = useRouter();
  const toast = useToast();
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
    <nav className="h-12 w-full bg-white text-[#44546f] flex items-center justify-between px-3 border-b border-[#091e4224] shrink-0 text-sm font-medium z-50 shadow-sm">
      <div className="flex items-center gap-2 h-full">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-[#091e4214] px-3 py-1.5 rounded transition-colors"
          onClick={() => router.push('/dashboard')}
        >
          <LayoutGrid size={18} className="text-[#0c66e4]" />
          <span className="font-semibold text-[16px] text-[#172b4d] tracking-tight hidden sm:block">CopyFlow</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSignout}
          className="hover:bg-[#091e4214] px-3 py-1.5 rounded transition-colors group flex items-center gap-2"
          title="Sign Out"
        >
          <LogOut size={16} className="text-[#44546f] group-hover:text-[#c9372c]" />
          <span className="text-[#44546f] group-hover:text-[#c9372c] hidden md:inline font-medium">Sign Out</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0c66e4] to-[#0055cc] shadow-sm flex items-center justify-center font-semibold text-[12px] text-white cursor-pointer hover:shadow-md transition-all">
          {initial}
        </div>
      </div>
    </nav>
  );
}
