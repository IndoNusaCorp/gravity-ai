"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SidebarLeft } from "@/components/SidebarLeft";
import { SidebarRight } from "@/components/SidebarRight";
import { Search, Send, X, Plus, Minus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Markdown from "markdown-to-jsx";

export default function Home() {
  // State untuk melacak apakah input sedang fokus (diklik)
  const [isFocused, setIsFocused] = useState(false);
  // State untuk melacak apakah obrolan dengan AI sedang aktif/terbuka
  const [isChatActive, setIsChatActive] = useState(false);
  // State untuk menyimpan teks yang diketik pengguna di kolom pencarian/input
  const [inputValue, setInputValue] = useState("");
  // State untuk menyimpan riwayat obrolan (chat history)
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "friend", content: string }[]>([]);
  // State loading AI
  const [isLoading, setIsLoading] = useState(false);

  // State untuk melacak jumlah halaman paper
  const [pageNumber, setPageNumber] = useState(1);

  const handleAddPaper = () => {
    setPageNumber((prev) => prev + 1);
  };

  const handleDeletePaper = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  // Ref untuk autoscroll chat
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading, isChatActive]);

  // State untuk menyimpan gambar yang diupload ke atas kertas
  const [uploadedImages, setUploadedImages] = useState<{ id: string; src: string; x: number; y: number }[]>([]);

  // Fungsi yang dipanggil saat ada gambar yang diupload dari SidebarRight
  const handleImageUpload = (src: string) => {
    setUploadedImages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        src: src,
        x: 100, // Mulai dari posisi X: 100
        y: 100, // Mulai dari posisi Y: 100
      },
    ]);
  };

  // Fungsi utama untuk mengirim pesan ke AI
  const sendToAI = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const newUserMessage = { role: "user" as const, content: messageText };
    setChatHistory(prev => [...prev, newUserMessage]);

    setInputValue("");
    setIsChatActive(true);
    setIsLoading(true);

    try {
      // Create a prompt from the latest message (Wait until backend supports full history parsing)
      const response = await fetch("/api/LibraAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: messageText }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from API");
      }

      const data = await response.json();
      // Mengambil balasan dari AI
      const reply = data.data?.message || data.reply || data.text || data.response || (typeof data === 'string' ? data : "Pesan berhasil diterima.");

      setChatHistory(prev => [...prev, { role: "friend", content: reply }]);
    } catch (error) {
      console.error("Error fetching from API:", error);
      setChatHistory(prev => [...prev, { role: "friend", content: "Maaf, saya sedang kesulitan terhubung dengan LibraAI saat ini." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendToAI(inputValue);

  const handleStart = () => {
    if (inputValue.trim()) {
      handleSend();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    sendToAI(suggestion);
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans overflow-x-hidden py-12 transition-colors duration-300">
      {/* Sidebars */}
      <SidebarLeft />
      <SidebarRight onImageUpload={handleImageUpload} />

      {/* Main Content Area */}
      <main className="relative z-10 w-full flex flex-col items-center justify-start sm:p-4 transition-all duration-500 min-h-[85vh]">

        {/* Paper Editor Container (Wadah Kertas Utama) */}
        {/* Container for scrolling multiple pages */}
        <div className="w-[calc(100%-2rem)] sm:w-full max-w-[var(--paper-max-width,794px)] flex flex-col gap-8 pb-32">

          {/* Loop per halaman paper berdasarkan pageNumber state */}
          {Array.from({ length: pageNumber }).map((_, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col bg-white dark:bg-zinc-900 shadow-2xl rounded-sm border border-zinc-200/80 dark:border-zinc-800 z-10 transition-all duration-500 ease-in-out w-full min-h-[85vh]"
              style={{
                backgroundColor: "var(--paper-color, #ffffff)",
              }}
            >

              {/* Only show paper controls on the FIRST page to manage global page count */}
              {index === 0 && (
                <div className="absolute top-16 right-2 sm:right-auto sm:left-[100%] sm:ml-4 flex flex-col items-center p-1.5 gap-2 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 rounded-2xl z-40">
                  <button
                    onClick={handleAddPaper}
                    className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl transition-all"
                    title="Tambah Halaman"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {pageNumber}
                  </span>
                  <button
                    onClick={handleDeletePaper}
                    disabled={pageNumber <= 1}
                    className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                    title="Hapus Halaman"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              )}


              {/* Typable Document Area (Area Tempat Mengetik Naskah) */}
              <style>{`
                #main-editor-${index}:empty:before {
                  content: attr(data-placeholder);
                  color: #d4d4d8; /* text-zinc-300 */
                  pointer-events: none;
                }
                .dark #main-editor-${index}:empty:before {
                  color: rgba(63, 63, 70, 0.5); /* dark:text-zinc-700/50 */
                }
              `}</style>
              <div
                id={`main-editor-${index}`}
                contentEditable
                suppressContentEditableWarning
                className="absolute inset-0 w-full h-full outline-none py-16 pr-12 pl-24 text-zinc-900 dark:text-zinc-100 scrollbar-hide overflow-y-auto whitespace-pre-wrap focus:outline-none z-10"
                data-placeholder={index === 0 ? "Mulai menulis naskah atau klik area ini..." : ""}
                style={{
                  fontFamily: "var(--editor-font-family, 'Inter')",
                  fontSize: "var(--editor-font-size, 16px)",
                  fontWeight: "var(--editor-font-weight, 400)",
                  textAlign: "var(--editor-text-align, start)" as any,
                  color: "var(--editor-font-color, #000000)",
                }}
              />

              {/* Draggable Images (hanya render di kertas pertama untuk sekarang, atau atur by page nanti) */}
              {index === 0 && uploadedImages.map((img) => (
                <motion.div
                  key={img.id}
                  drag
                  dragMomentum={false}
                  initial={{ x: img.x, y: img.y }}
                  className="absolute z-50 cursor-move group"
                  style={{ touchAction: "none" }}
                >
                  <div className="relative">
                    <img
                      src={img.src}
                      alt="Uploaded content"
                      className="max-w-[300px] max-h-[300px] object-contain rounded-lg shadow-sm border border-transparent group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors pointer-events-auto"
                      draggable={false} // Mencegah perilaku drag bawaan browser pada gambar
                    />
                    {/* Delete button (only visible on hover) */}
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter(i => i.id !== img.id))}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 pointer-events-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Overlay Content Area (Chat & Search) */}
        <div className="fixed bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-none p-6 sm:p-12 justify-end">
          {/* Chat Messages */}
          <AnimatePresence>
            {isChatActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex flex-col gap-4 w-full max-w-xl mx-auto mb-6 pointer-events-auto max-h-[50vh] overflow-y-auto scrollbar-hide p-4 bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-white/50 dark:border-zinc-800/50 shadow-xl"
                ref={chatContainerRef}
              >
                <div className="flex justify-between items-center w-full mb-2 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2 sticky top-0 bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md z-10 px-2 rounded-t-xl -mt-2 pt-2">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest pl-2">LibraAI</span>
                  <button
                    onClick={() => setIsChatActive(false)}
                    className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    title="Sembunyikan Obrolan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-6 px-1 pb-2">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}>
                      <div className={`${msg.role === 'user' ? 'bg-zinc-100 dark:bg-zinc-800 rounded-tr-sm max-w-[85%]' : 'bg-zinc-900 dark:bg-zinc-100 rounded-tl-sm w-fit max-w-[95%] text-white dark:text-zinc-900'} px-5 py-4 rounded-2xl shadow-sm overflow-x-auto`}>
                        <div className={`font-medium leading-relaxed text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'text-zinc-900 dark:text-white' : ''}`}>
                          {msg.role === 'user' ? msg.content : <Markdown>{msg.content}</Markdown>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start w-full">
                      <div className="bg-zinc-900 dark:bg-zinc-100 px-5 py-4 rounded-2xl rounded-tl-sm w-fit shadow-md">
                        <div className="flex gap-1.5 items-center justify-center h-4 px-2">
                          <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
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
                placeholder="Tanya LibraAI tentang Research, Skripsi, atau Artikel Ilmiah"
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
      </main>
    </div>
  );
}
