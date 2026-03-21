"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast(error.message, "error");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(15,108,189,0.2),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(30,138,90,0.14),transparent_35%)]" />
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.08)_45%,transparent_100%)]" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, opacity: 1, y: 0, x: 0 }}
        transition={{ duration: shake ? 0.4 : 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 app-panel"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[linear-gradient(135deg,var(--primary),#2f7f76)] flex items-center justify-center shadow-md">
              <LayoutGrid size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">CopyFlow</h1>
          <p className="text-[var(--text-muted)] text-sm">Sign in to your team workspace</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Email address</label>
            <input
              type="email"
              required
              className="input-base"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Password</label>
            <input
              type="password"
              required
              className="input-base"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="btn btn-primary w-full mt-3 py-3 flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin text-white" /> : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Demo: admin@copy-flow.app / admin123
          </p>
        </div>
      </motion.div>
    </div>
  );
}