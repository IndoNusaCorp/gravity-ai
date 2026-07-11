"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, X, Sparkles, Rocket } from "lucide-react";
import { SignInAndRegisterWithGoogleSystem } from "@/firebase/firebase.authentication";


export type AuthType = "login" | "register";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialType: AuthType;
}

export function AuthModal({ isOpen, onClose, initialType }: AuthModalProps) {
    const [type, setType] = useState<AuthType>(initialType);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [Register, setRegister] = useState(true);
    const [Login, setLogin] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset state error sebelum mulai
        setError("");
        
        // Pesan untuk menunggu alias loading 
        setLoading(true);
        console.log("Loading...");

        try {
            // Menunggu hasil dari SignInWithGoogleSystem
            const result = await SignInAndRegisterWithGoogleSystem();
            
            // Jika proses login/register berhasil, tutup otomatis modal popup ini
            if (result) {
                onClose();
            }
        } catch (err: any) {
            console.error("Error during authentication:", err);
            // Tampilkan pesan error ke pengguna
            setError(err.message || "Gagal masuk dengan Google. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-md p-8 md:p-10 rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Beautiful Ambient Background */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                            {type === "login" ? (
                                <>
                                    <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[80px]" />
                                    <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[80px]" />
                                </>
                            ) : (
                                <>
                                    <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-emerald-600/20 blur-[80px]" />
                                    <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-teal-600/20 blur-[80px]" />
                                </>
                            )}
                        </div>

                        <div className="relative z-10 flex justify-center mb-6">
                            <motion.div
                                initial={{ rotate: -10, scale: 0.9 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br ${type === 'login' ? 'from-indigo-500 to-purple-600' : 'from-emerald-500 to-teal-600'
                                    }`}
                            >
                                {type === "login" ? (
                                    <img src="/GravityAI.png" alt="GravityAI Logo" className="w-7 h-7 object-contain" />
                                ) : (
                                    <Rocket className="w-7 h-7 text-white/90 ml-0.5 mb-0.5" />
                                )}
                            </motion.div>
                        </div>

                        <div className="relative z-10 text-center mb-8">
                            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                {type === "login" ? "Welcome Back" : "Create Account"}
                            </h1>
                            <p className="text-zinc-400 text-sm">
                                {type === "login" ? "Sign in to continue to GravityAI" : "Join GravityAI in just a few clicks"}
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="relative z-10 mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                            {/* {type === "register" && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-300 ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 transition-colors group-focus-within:text-teal-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:ring-teal-500/50"
                                            placeholder="johndoe"
                                        />
                                    </div>
                                </div>
                            )} */}

                            {/* <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-300 ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 transition-colors ${type === 'login' ? 'group-focus-within:text-indigo-400' : 'group-focus-within:text-teal-400'}`}>
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className={`w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${type === 'login' ? 'focus:ring-indigo-500/50' : 'focus:ring-teal-500/50'}`}
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div> */}

                            {/* <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-medium text-zinc-300">Password</label>
                                    {type === "login" && (
                                        <a href="#" className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">Forgot password?</a>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 transition-colors ${type === 'login' ? 'group-focus-within:text-indigo-400' : 'group-focus-within:text-teal-400'}`}>
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className={`w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${type === 'login' ? 'focus:ring-indigo-500/50' : 'focus:ring-teal-500/50'}`}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div> */}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-white text-zinc-950 hover:bg-zinc-200 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        {type === "login" ? "Sign in with google account" : "Create with google account"}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* <p className="relative z-10 mt-6 text-center text-xs text-zinc-400">
                            {type === "login" ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => setType(type === "login" ? "register" : "login")}
                                className={`font-medium hover:underline transition-colors ${type === 'login' ? 'text-indigo-400 hover:text-indigo-300' : 'text-teal-400 hover:text-teal-300'
                                    }`}
                            >
                                {type === "login" ? "Sign up now" : "Sign in"}
                            </button>
                        </p> */}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
