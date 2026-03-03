"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, X, Sparkles, Rocket } from "lucide-react";

export type AuthType = "login" | "register";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialType: AuthType;
}

export function AuthModal({ isOpen, onClose, initialType }: AuthModalProps) {
    const [type, setType] = useState<AuthType>(initialType);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Reset state every time modal opens
    useEffect(() => {
        if (isOpen) {
            setType(initialType);
            setError("");
            setUsername("");
            setEmail("");
            setPassword("");
        }
    }, [isOpen, initialType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (type === "login") {
                const res = await fetch("/Authentication", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();
                if (!res.ok || data.error) {
                    throw new Error(data.error || "Failed to login. Please check your credentials.");
                }
            } else {
                const params = new URLSearchParams({ username, email, password });
                const res = await fetch(`/Authentication?${params.toString()}`, {
                    method: "GET",
                });
                const data = await res.json();
                if (!res.ok || data.error) {
                    throw new Error(data.error || "Failed to register. Please try again.");
                }
            }

            // Success => Reload page to update the user session in components
            window.location.reload();
        } catch (err: any) {
            setError(err.message || "Network error. Please try again.");
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
                                    <Sparkles className="w-7 h-7 text-white" />
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
                            {type === "register" && (
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
                            )}

                            <div className="space-y-1.5">
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
                            </div>

                            <div className="space-y-1.5">
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
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-white text-zinc-950 hover:bg-zinc-200 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {type === "login" ? "Sign In" : "Create Account"}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="relative z-10 mt-6 text-center text-xs text-zinc-400">
                            {type === "login" ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => setType(type === "login" ? "register" : "login")}
                                className={`font-medium hover:underline transition-colors ${type === 'login' ? 'text-indigo-400 hover:text-indigo-300' : 'text-teal-400 hover:text-teal-300'
                                    }`}
                            >
                                {type === "login" ? "Sign up now" : "Sign in"}
                            </button>
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
