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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0079bf] via-[#0c66e4] to-[#5243aa]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, opacity: 1, y: 0, x: 0 }}
        transition={{ duration: shake ? 0.4 : 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0c66e4] to-[#0079bf] flex items-center justify-center shadow-lg">
              <LayoutGrid size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#172b4d] mb-1">CopyFlow</h1>
          <p className="text-[#44546f] text-sm">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#44546f] mb-2">Email address</label>
            <input
              type="email"
              required
              className="w-full bg-[#f5f6f8] border-2 border-[#dfe1e6] rounded-lg px-4 py-3 text-[#172b4d] focus:outline-none focus:border-[#0c66e4] focus:bg-white transition-all"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44546f] mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#f5f6f8] border-2 border-[#dfe1e6] rounded-lg px-4 py-3 text-[#172b4d] focus:outline-none focus:border-[#0c66e4] focus:bg-white transition-all"
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
            className="w-full mt-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin text-white" /> : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#091e4214] text-center">
          <p className="text-xs text-[#44546f]">
            Demo: admin@copy-flow.app / admin123
          </p>
        </div>
      </motion.div>
    </div>
  );
}
