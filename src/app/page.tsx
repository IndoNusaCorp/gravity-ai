"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SidebarLeft } from "@/components/SidebarLeft";
import { SidebarRight } from "@/components/SidebarRight";
import { Search, Send, X } from "lucide-react";
import { useState } from "react";

export default function Home() {
  // State untuk melacak apakah input sedang fokus (diklik)
  const [isFocused, setIsFocused] = useState(false);
  // State untuk melacak apakah obrolan dengan AI sedang aktif/terbuka
  const [isChatActive, setIsChatActive] = useState(false);
  // State untuk menyimpan teks yang diketik pengguna di kolom pencarian/input
  const [inputValue, setInputValue] = useState("");
  // State untuk menyimpan pesan terakhir yang dikirim pengguna ke AI
  const [chatMessage, setChatMessage] = useState("");

  // Fungsi yang dipanggil saat pengguna mengirim pesan ke AI
  const handleStart = () => {
    // Memastikan input tidak kosong
    if (inputValue.trim()) {
      setChatMessage(inputValue); // Menyimpan pesan untuk ditampilkan di chat
      setIsChatActive(true); // Menampilkan kotak obrolan AI
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
    <div className="relative flex flex-col items-center min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans overflow-x-hidden py-12 transition-colors duration-300">
      {/* Sidebars */}
      <SidebarLeft />
      <SidebarRight />

      {/* Main Content Area */}
      <main className="relative z-10 w-full flex flex-col items-center justify-start sm:p-4 transition-all duration-500 min-h-[85vh]">

        {/* Paper Editor Container (Wadah Kertas Utama) */}
        {/* motion.div digunakan agar kertas muncul dengan animasi yang mulus */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col bg-white dark:bg-zinc-900 shadow-2xl rounded-sm border border-zinc-200/80 dark:border-zinc-800 z-10 transition-all duration-500 ease-in-out w-[calc(100%-2rem)] sm:w-full min-h-[85vh]"
          style={{
            // Mengambil warna dan lebar kertas dari pengaturan di SidebarRight (menggunakan CSS Variables)
            backgroundColor: "var(--paper-color, #ffffff)",
            maxWidth: "var(--paper-max-width, 794px)", // 794px is A4 width
            width: "100%"
          }}
        >

          {/* Typable Document Area (Area Tempat Mengetik Naskah) */}
          <div className="absolute inset-0 w-full h-full bg-transparent overflow-hidden z-10">
            <style>{`
              #main-editor:empty:before {
                content: attr(data-placeholder);
                color: #d4d4d8; /* text-zinc-300 */
                pointer-events: none;
              }
              .dark #main-editor:empty:before {
                color: rgba(63, 63, 70, 0.5); /* dark:text-zinc-700/50 */
              }
            `}</style>
            <div
              id="main-editor"
              contentEditable
              suppressContentEditableWarning
              className="w-full h-full outline-none py-16 pr-12 pl-24 text-zinc-900 dark:text-zinc-100 scrollbar-hide overflow-y-auto whitespace-pre-wrap focus:outline-none"
              data-placeholder="Mulai menulis naskah atau klik area ini..."
              style={{
                fontFamily: "var(--editor-font-family, 'Inter')",
                fontSize: "var(--editor-font-size, 16px)",
                fontWeight: "var(--editor-font-weight, 400)",
                textAlign: "var(--editor-text-align, start)" as any,
                color: "var(--editor-font-color, #000000)",
              }}
            />




          </div>

          {/* Overlay Content Area (Chat & Search) */}
          <div className="absolute inset-0 z-20 flex flex-col pointer-events-none p-6 sm:p-12 justify-end">
            {/* Chat Messages */}
            <AnimatePresence>
              {isChatActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="flex flex-col gap-6 w-full max-w-xl mx-auto mb-6 pointer-events-auto max-h-[50vh] overflow-y-auto scrollbar-hide p-4 bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-white/50 dark:border-zinc-800/50 shadow-xl"
                >
                  <div className="flex justify-between items-center w-full mb-2 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest pl-2">LibraAI Assistant</span>
                    <button
                      onClick={() => {
                        setIsChatActive(false);
                      }}
                      className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      title="Sembunyikan Obrolan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-zinc-100 dark:bg-zinc-800 px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                      <p className="text-zinc-900 dark:text-white font-medium leading-relaxed text-sm">{chatMessage}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 dark:bg-zinc-100 px-5 py-3.5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md">
                      <p className="text-white dark:text-zinc-900 font-medium leading-relaxed text-sm">
                        Bagus sekali! Mari kita explore lebih dalam tentang <strong>{chatMessage}</strong>. Saya bisa membantu Anda menyusun kerangka untuk tulisan di kertas ini.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Input Container */}
            <motion.div
              layout
              className={`w-full max-w-xl mx-auto relative z-50 group shrink-0 pointer-events-auto transition-all duration-700 ease-[0.16,1,0.3,1] ${!isChatActive ? "translate-y-[12vh]" : ""}`}
            >
              <div className={`absolute inset-0 bg-zinc-900/5 dark:bg-white/5 rounded-2xl blur-xl transition-all duration-300 ${isFocused ? "opacity-100 scale-105" : "opacity-0 scale-100"}`} />

              <div className={`relative flex items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-2 rounded-2xl p-2 transition-colors duration-300 shadow-xl shadow-zinc-200/20 dark:shadow-black/40 ${isFocused ? "border-zinc-900 dark:border-white" : "border-zinc-200/80 dark:border-zinc-800/80"}`}>
                <div className="pl-4 pr-3">
                  <Search className={`w-5 h-5 transition-colors duration-300 ${isFocused ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`} />
                </div>

                {/* Input Teks untuk ngobrol dengan AI */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown} // Menjalankan fungsi saat tombol (seperti Enter) ditekan
                  placeholder="Tanya LibraAI atau minta bantuan menulis..."
                  onFocus={() => setIsFocused(true)} // Mengubah state fokus saat input diklik
                  onBlur={() => setIsFocused(false)} // Mengubah state saat input ditinggalkan
                  className="w-full bg-transparent border-none outline-none py-3 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-sm font-medium"
                />

                <button
                  onClick={handleStart}
                  className="hidden sm:flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 w-12 h-12 rounded-xl font-medium transition-all shadow-sm active:scale-95 group-hover:shadow-md border border-transparent dark:border-zinc-200">
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
