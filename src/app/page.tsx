"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SidebarLeft } from "@/components/SidebarLeft";
import { SidebarRight } from "@/components/SidebarRight";
import { Search, Sparkles, Send, X } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [isFocused, setIsFocused] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  const handleStart = () => {
    if (inputValue.trim()) {
      setChatMessage(inputValue);
      setIsChatActive(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleStart();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setChatMessage(suggestion);
    setIsChatActive(true);
  };

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-white font-sans overflow-hidden py-12">
      {/* Sidebars */}
      <SidebarLeft />
      <SidebarRight />

      {/* Main Content Area (Paper Layer) */}
      <main className="relative z-10 h-full min-h-[85vh] w-full flex flex-col items-center justify-center sm:p-8 overflow-hidden">

        {/* Background Paper Container */}
        <AnimatePresence>
          {isChatActive && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
              className="absolute inset-0 m-auto w-[calc(100%-2rem)] sm:w-full max-w-3xl h-[85vh] bg-white shadow-2xl rounded-3xl border border-zinc-200/50 z-0 transition-all duration-500 ease-in-out"
              style={{
                boxShadow: isFocused
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
                  : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
            >
              {/* Subtle paper details (optional, for aesthetics) */}
              <div className="absolute top-8 left-8 w-12 h-1 bg-zinc-200 rounded-full" />
              <div className="absolute top-12 left-8 w-8 h-1 bg-zinc-200 rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Foreground Content Area */}
        <motion.div
          layout
          className={`relative z-20 w-full max-w-xl mx-auto flex flex-col h-[85vh] px-6 sm:px-12 ${isChatActive ? "justify-end pb-8 pt-8" : "justify-center"
            }`}
        >

          {/* Chat Messages (Visible when isChatActive) */}
          <AnimatePresence>
            {isChatActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex-1 w-full overflow-y-auto mb-6 flex flex-col gap-6 scrollbar-hide relative z-10 pt-2"
              >
                <div className="flex justify-end w-full -mt-2 mb-2">
                  <button
                    onClick={() => {
                      setIsChatActive(false);
                      setInputValue("");
                      setChatMessage("");
                    }}
                    className="p-2 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    title="Tutup Obrolan"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-end">
                  <div className="bg-zinc-100 px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                    <p className="text-zinc-900 font-medium leading-relaxed">{chatMessage}</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-zinc-900 px-5 py-3.5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md">
                    <p className="text-white font-medium leading-relaxed">
                      Menarik sekali! Mari kita explore lebih dalam tentang <strong>{chatMessage}</strong>. Apakah ada aspek spesifik yang ingin kamu fokuskan dulu?
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Input Container */}
          <motion.div layout className={`w-full relative group shrink-0 z-30 ${!isChatActive ? "mt-auto" : ""}`}>
            <div className={`absolute inset-0 bg-zinc-900/5 rounded-2xl blur-xl transition-all duration-300 ${isFocused ? "opacity-100 scale-105" : "opacity-0 scale-100"}`} />

            <div className={`relative flex items-center bg-white border-2 rounded-2xl p-2 transition-colors duration-300 ${isFocused ? "border-zinc-900" : "border-zinc-200"}`}>
              <div className="pl-4 pr-3">
                <Search className={`w-5 h-5 transition-colors duration-300 ${isFocused ? "text-zinc-900" : "text-zinc-400"}`} />
              </div>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya LibraAI..."
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-transparent border-none outline-none py-3 pr-4 text-zinc-900 placeholder:text-zinc-400 text-lg font-medium"
              />

              <button
                onClick={handleStart}
                className="hidden sm:flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white w-12 h-12 rounded-xl font-medium transition-all shadow-sm active:scale-95 group-hover:shadow-md">
                <Send className="w-5 h-5 ml-1" />
              </button>
            </div>
          </motion.div>

          {/* Suggestions */}
          {/* Suggestions (Hidden per user request) */}
          <AnimatePresence mode="popLayout">
            {/* Sembunyikan suggestions dengan false agar kotak search bar saja yang terlihat  */}
            {false && !isChatActive && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="mt-8 flex overflow-x-auto scrollbar-hide gap-2 w-full px-1"
              >
                {["Artificial Intelligence", "Quantum Computing", "Space Exploration"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestion(suggestion)}
                    className="whitespace-nowrap shrink-0 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

      </main>
    </div>
  );
}
