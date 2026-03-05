"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SidebarLeft } from "@/components/SidebarLeft";
import { SidebarRight } from "@/components/SidebarRight";
import { Search, Send, X, Plus, Minus, FileText, BookOpen, GraduationCap, Newspaper, Check, PenTool } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
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

  // State untuk toast notification
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  // State untuk quick action modal
  const [quickActionModal, setQuickActionModal] = useState<{ open: boolean; type: string; label: string }>({ open: false, type: "", label: "" });
  const [quickActionTopic, setQuickActionTopic] = useState("");

  // State to track which message index was recently inserted to paper (for icon feedback)
  const [insertedIndex, setInsertedIndex] = useState<number | null>(null);

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

  // Helper: Konversi Markdown sederhana ke HTML untuk disisipkan ke paper
  const convertMarkdownToHtml = useCallback((md: string): string => {
    let html = md;
    // Escape HTML entities first
    // (skip this since contentEditable can handle basic tags)

    // Headings (### → <h3>, ## → <h2>, # → <h1>)
    html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:1.1em;font-weight:700;margin:1em 0 0.5em;">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:1.25em;font-weight:700;margin:1.2em 0 0.5em;">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:1.5em;font-weight:700;margin:1.5em 0 0.5em;">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Unordered lists (- item)
    html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li style="margin-left:1.5em;">$1</li>');

    // Ordered lists (1. item)
    html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li style="margin-left:1.5em;list-style-type:decimal;">$1</li>');

    // Line breaks — convert double newlines to paragraphs, single to <br>
    html = html.replace(/\n\n/g, '</p><p style="margin:0.8em 0;">');
    html = html.replace(/\n/g, '<br/>');

    // Wrap in paragraph
    html = '<p style="margin:0.8em 0;">' + html + '</p>';

    return html;
  }, []);

  // Fungsi untuk menyisipkan konten AI ke paper editor
  const insertToPaper = useCallback((markdownContent: string, messageIndex?: number) => {
    const targetPage = pageNumber - 1; // selalu ke halaman terakhir
    const editor = document.getElementById(`main-editor-${targetPage}`);
    if (!editor) return;

    const htmlContent = convertMarkdownToHtml(markdownContent);

    // Tambahkan separator jika sudah ada konten
    const separator = editor.innerHTML.trim() ? '<hr style="border:none;border-top:1px solid #e4e4e7;margin:2em 0;"/>' : '';
    editor.innerHTML += separator + htmlContent;

    // Show success toast
    setToast({ message: "✅ Berhasil ditulis ke Paper!", visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);

    // Show checkmark feedback on the button
    if (messageIndex !== undefined) {
      setInsertedIndex(messageIndex);
      setTimeout(() => setInsertedIndex(null), 2500);
    }

    // Scroll paper into view
    editor.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [pageNumber, convertMarkdownToHtml]);

  // Fungsi utama untuk mengirim pesan ke AI
  const sendToAI = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const newUserMessage = { role: "user" as const, content: messageText };
    setChatHistory(prev => [...prev, newUserMessage]);

    setInputValue("");
    setIsChatActive(true);
    setIsLoading(true);

    try {
      // Extract recent history to send to backend for context memory
      // We send up to the last 6 messages (excluding the one we just added)
      const recentHistory = chatHistory.slice(-6).map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));

      // Create a prompt from the latest message and attach history context
      const response = await fetch("/api/LibraAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: messageText, history: recentHistory }),
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

  // Fungsi khusus untuk Quick Action: kirim ke AI dengan tipe paper, lalu insert ke paper
  const sendToAIForPaper = async (topic: string, docType: string) => {
    if (!topic.trim() || isLoading) return;

    const typeLabel = docType === 'paper_research' ? 'Research' : docType === 'paper_skripsi' ? 'Skripsi' : 'Artikel Ilmiah';
    const newUserMessage = { role: "user" as const, content: `📄 Buatkan ${typeLabel}: ${topic}` };
    setChatHistory(prev => [...prev, newUserMessage]);

    setIsChatActive(true);
    setIsLoading(true);
    setQuickActionModal({ open: false, type: "", label: "" });
    setQuickActionTopic("");

    try {
      const recentHistory = chatHistory.slice(-6).map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));

      const response = await fetch("/api/LibraAI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: topic, type: docType, history: recentHistory }),
      });

      if (!response.ok) throw new Error("Failed to fetch from API");

      const data = await response.json();
      const reply = data.data?.message || data.reply || data.text || data.response || (typeof data === 'string' ? data : "Pesan berhasil diterima.");

      setChatHistory(prev => [...prev, { role: "friend", content: reply }]);

      // Auto-insert ke paper setelah response diterima
      // Kita perlu delay sedikit agar state terupdate dulu
      setTimeout(() => {
        insertToPaper(reply);
      }, 100);

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
    <>
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
        </main>

        {/* Floating Chat & Search Overlay — ngambang di atas semua konten */}
        <div className="fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-4 sm:px-12">
          {/* Chat Messages */}
          <AnimatePresence>
            {isChatActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex flex-col gap-4 w-full max-w-xl mb-4 pointer-events-auto max-h-[50vh] overflow-y-auto scrollbar-hide p-4 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-zinc-700/60 shadow-2xl"
                ref={chatContainerRef}
              >
                <div className="flex justify-between items-center w-full mb-2 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2 sticky top-0 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl z-10 px-2 rounded-t-xl -mt-2 pt-2">
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
                        {/* Tombol "Tulis ke Paper" — hanya muncul di respons AI */}
                        {msg.role === 'friend' && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 dark:border-zinc-800/30">
                            <button
                              onClick={() => insertToPaper(msg.content, idx)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${insertedIndex === idx
                                  ? 'bg-green-500/20 text-green-300 dark:text-green-600'
                                  : 'bg-white/10 dark:bg-zinc-800/50 text-white/70 dark:text-zinc-500 hover:bg-white/20 dark:hover:bg-zinc-700/50 hover:text-white dark:hover:text-zinc-300'
                                }`}
                              title="Tulis ke Paper"
                            >
                              {insertedIndex === idx ? (
                                <><Check className="w-3.5 h-3.5" /> Berhasil!</>
                              ) : (
                                <><PenTool className="w-3.5 h-3.5" /> Tulis ke Paper</>
                              )}
                            </button>
                          </div>
                        )}
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

          {/* Search Input — selalu terlihat di bawah layar */}
          <motion.div
            layout
            className="w-full max-w-xl relative group shrink-0 pointer-events-auto"
          >
            {/* Quick Action Buttons — muncul saat chat belum aktif */}
            <AnimatePresence>
              {!isChatActive && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center gap-2 mb-3"
                >
                  <button
                    onClick={() => setQuickActionModal({ open: true, type: 'paper_research', label: 'Research' })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Buat Research
                  </button>
                  <button
                    onClick={() => setQuickActionModal({ open: true, type: 'paper_skripsi', label: 'Skripsi' })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Buat Skripsi
                  </button>
                  <button
                    onClick={() => setQuickActionModal({ open: true, type: 'paper_artikel', label: 'Artikel Ilmiah' })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                  >
                    <Newspaper className="w-3.5 h-3.5" />
                    Buat Artikel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`absolute inset-0 bg-zinc-900/5 dark:bg-white/5 rounded-2xl blur-xl transition-all duration-300 ${isFocused ? "opacity-100 scale-105" : "opacity-0 scale-100"}`} />

            <div className={`relative flex items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-2 rounded-2xl p-2 transition-colors duration-300 shadow-2xl shadow-zinc-300/30 dark:shadow-black/50 ${isFocused ? "border-zinc-900 dark:border-white" : "border-zinc-200/80 dark:border-zinc-800/80"}`}>
              <div className="pl-4 pr-3">
                <Search className={`w-5 h-5 transition-colors duration-300 ${isFocused ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`} />
              </div>

              {/* Input Teks untuk ngobrol dengan AI */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya LibraAI tentang Research, Skripsi, atau Artikel Ilmiah"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-6 right-6 z-[100] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold border border-zinc-700 dark:border-zinc-200"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Action Modal — Dialog untuk masukkan topik */}
      <AnimatePresence>
        {quickActionModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => { setQuickActionModal({ open: false, type: "", label: "" }); setQuickActionTopic(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  {quickActionModal.type === 'paper_research' && <BookOpen className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />}
                  {quickActionModal.type === 'paper_skripsi' && <GraduationCap className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />}
                  {quickActionModal.type === 'paper_artikel' && <Newspaper className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Buat {quickActionModal.label}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Masukkan topik, LibraAI akan langsung menulisnya ke paper</p>
                </div>
              </div>

              <input
                type="text"
                value={quickActionTopic}
                onChange={(e) => setQuickActionTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendToAIForPaper(quickActionTopic, quickActionModal.type); }}
                placeholder={`Contoh: Pengaruh AI terhadap pendidikan di Indonesia`}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-white rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none transition-colors"
                autoFocus
              />

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => { setQuickActionModal({ open: false, type: "", label: "" }); setQuickActionTopic(""); }}
                  className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => sendToAIForPaper(quickActionTopic, quickActionModal.type)}
                  disabled={!quickActionTopic.trim() || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <PenTool className="w-4 h-4" />
                  Generate & Tulis
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
