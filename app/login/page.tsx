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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#00315a] via-[#0052CC] to-[#0F1923]">
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)] opacity-50"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, opacity: 1, y: 0, x: 0 }}
        transition={{ duration: shake ? 0.4 : 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        <div className="flex flex-col items-center mb-8 text-white">
          <div className="bg-gradient-to-br from-blue-400 to-white text-transparent bg-clip-text flex flex-col items-center">
            <LayoutGrid size={48} className="text-white mb-2" />
            <h1 className="text-3xl font-bold tracking-tight">CopyFlow Team</h1>
          </div>
          <p className="text-white/70 mt-2 text-sm">Your team&apos;s workspace</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="relative">
            <input
              type="email"
              required
              className="peer w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-transparent focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <label className="absolute left-4 -top-2.5 text-xs text-blue-300 bg-[#073666] px-1 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/50 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-300 peer-focus:bg-[#073666] rounded">
              Email Address
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              required
              className="peer w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-transparent focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <label className="absolute left-4 -top-2.5 text-xs text-blue-300 bg-[#073666] px-1 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/50 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-300 peer-focus:bg-[#073666] rounded">
              Password
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-blue-500 to-[#0052CC] text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all flex justify-center items-center h-[52px]"
          >
            {loading ? <Loader2 className="animate-spin text-white" /> : "Sign In"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
