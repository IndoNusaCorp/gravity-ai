"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SidebarLeft } from "@/components/SidebarLeft";
import { SidebarRight } from "@/components/SidebarRight";
import { Search, Send, X, Plus, Minus, FileText, BookOpen, GraduationCap, Newspaper, Check, PenTool, Link as LinkIcon, Upload, Edit3, Calculator, AlignLeft, MessageSquare, Table, Network, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Markdown from "markdown-to-jsx";
import { Analytics } from "@vercel/analytics/next"

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

  // State untuk Fitur AI Tambahan (Citation, Paraphrase, Math, Advisor, Table, Outline)
  const [featureModal, setFeatureModal] = useState<{ open: boolean; type: 'citation' | 'paraphrase' | 'math' | 'advisor' | 'table' | 'outline' | '' }>({ open: false, type: '' });
  const [featureInput, setFeatureInput] = useState("");
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);

  // State to track which message index was recently inserted to paper (for icon feedback)
  const [insertedIndex, setInsertedIndex] = useState<number | null>(null);

  // State untuk melacak jumlah halaman paper
  const [pageNumber, setPageNumber] = useState(1);
  // State untuk halaman yang sedang dipilih (untuk delete)
  const [selectedPage, setSelectedPage] = useState(0);

  //efek tombol add paper
  const handleAddPaper = () => {
    setPageNumber((prev) => prev + 1);
  };

  //efek tombol delete paper
  const handleDeletePaper = () => {
    if (pageNumber <= 1) return;

    const deleteIdx = selectedPage;

    // Geser konten dari halaman setelah yang dihapus ke halaman sebelumnya
    for (let i = deleteIdx; i < pageNumber - 1; i++) {
      const currentEditor = document.getElementById(`main-editor-${i}`);
      const nextEditor = document.getElementById(`main-editor-${i + 1}`);
      if (currentEditor && nextEditor) {
        currentEditor.innerHTML = nextEditor.innerHTML;
      }
    }

    // Hapus konten halaman terakhir (karena sudah digeser)
    const lastEditor = document.getElementById(`main-editor-${pageNumber - 1}`);
    if (lastEditor) {
      lastEditor.innerHTML = '';
    }

    setPageNumber((prev) => Math.max(1, prev - 1));

    // Reset selectedPage jika perlu
    if (selectedPage >= pageNumber - 1) {
      setSelectedPage(Math.max(0, pageNumber - 2));
    }
  };

  // Ref untuk autoscroll chat
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading, isChatActive]);

  // Ref untuk pageNumber (agar bisa diakses di event handler tanpa stale closure)
  const pageNumberRef = useRef(pageNumber);
  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  // Overflow detection: auto-add page ketika konten melebihi tinggi paper
  const overflowCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkOverflow = useCallback((editorIndex: number) => {
    const editor = document.getElementById(`main-editor-${editorIndex}`);
    if (!editor) return;

    // Cek apakah konten melebihi tinggi container
    if (editor.scrollHeight > editor.clientHeight + 5) { // +5px toleransi
      // Kumpulkan child nodes yang overflow
      const children = Array.from(editor.childNodes);
      if (children.length <= 1) return; // minimal harus punya >1 child

      // Temukan child node pertama yang posisinya melampaui batas bawah editor
      const editorRect = editor.getBoundingClientRect();
      const overflowNodes: Node[] = [];
      let foundOverflow = false;

      for (let i = children.length - 1; i >= 1; i--) {
        const child = children[i];
        if (child instanceof HTMLElement) {
          const childRect = child.getBoundingClientRect();
          if (childRect.bottom > editorRect.bottom || childRect.top >= editorRect.bottom) {
            overflowNodes.unshift(child);
            foundOverflow = true;
          } else {
            break; // Sudah di area visible, stop
          }
        } else if (foundOverflow || (children[i - 1] instanceof HTMLElement)) {
          // Untuk text nodes di akhir, pindahkan juga jika sudah ada overflow
          if (foundOverflow) {
            overflowNodes.unshift(child);
          }
        }
      }

      if (overflowNodes.length === 0) return;

      // Ekstrak HTML dari overflow nodes
      const overflowHtml = overflowNodes.map(node => {
        if (node instanceof HTMLElement) return node.outerHTML;
        return node.textContent || '';
      }).join('');

      // Hapus overflow nodes dari editor saat ini
      overflowNodes.forEach(node => {
        if (node.parentNode === editor) {
          editor.removeChild(node);
        }
      });

      // Cek apakah halaman berikutnya sudah ada
      const nextPageIndex = editorIndex + 1;
      const nextEditor = document.getElementById(`main-editor-${nextPageIndex}`);

      if (nextEditor) {
        // Halaman berikutnya sudah ada, prepend konten
        nextEditor.innerHTML = overflowHtml + nextEditor.innerHTML;
        // Cek overflow cascading di halaman berikutnya
        setTimeout(() => checkOverflow(nextPageIndex), 200);
      } else {
        // Buat halaman baru
        setPageNumber(prev => prev + 1);
        // Tunggu DOM render, lalu insert konten
        setTimeout(() => {
          const newEditor = document.getElementById(`main-editor-${nextPageIndex}`);
          if (newEditor) {
            newEditor.innerHTML = overflowHtml;
            // Cek overflow cascading
            setTimeout(() => checkOverflow(nextPageIndex), 200);
          }
        }, 300);
      }
    }
  }, []);

  // Effect: pasang event listener di setiap editor untuk deteksi overflow
  useEffect(() => {
    const handlers: { editor: HTMLElement; handler: () => void }[] = [];

    for (let i = 0; i < pageNumber; i++) {
      const editor = document.getElementById(`main-editor-${i}`);
      if (!editor) continue;

      const handler = () => {
        // Debounce: tunggu sebentar sebelum cek overflow
        if (overflowCheckTimerRef.current) {
          clearTimeout(overflowCheckTimerRef.current);
        }
        overflowCheckTimerRef.current = setTimeout(() => {
          checkOverflow(i);
        }, 300);
      };

      editor.addEventListener('input', handler);

      // MutationObserver untuk menangkap perubahan programatik (dari insertToPaper)
      const observer = new MutationObserver(handler);
      observer.observe(editor, { childList: true, subtree: true, characterData: true });

      handlers.push({ editor, handler });

      // Juga cek overflow saat pertama kali mount (untuk konten yang sudah ada)
      setTimeout(() => checkOverflow(i), 500);
    }

    return () => {
      handlers.forEach(({ editor, handler }) => {
        editor.removeEventListener('input', handler);
      });
    };
  }, [pageNumber, checkOverflow]);

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

  // Helper: Render cover page block menjadi HTML halaman sampul akademis
  const renderCoverPageHtml = useCallback((coverBlock: string): string => {
    const fields: Record<string, string> = {};
    const lines = coverBlock.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^(TITLE|DOCTYPE|DESCRIPTION|AUTHOR|NIM|DEPARTMENT|FACULTY|UNIVERSITY|YEAR):\s*(.+)$/i);
      if (match) {
        fields[match[1].toUpperCase()] = match[2].trim();
      }
    }

    const title = fields['TITLE'] || '[Judul Dokumen]';
    const docType = fields['DOCTYPE'] || '';
    const description = fields['DESCRIPTION'] || '';
    const author = fields['AUTHOR'] || '[Nama Penulis]';
    const nim = fields['NIM'] || '[NIM]';
    const department = fields['DEPARTMENT'] || '[Program Studi]';
    const faculty = fields['FACULTY'] || '[Fakultas]';
    const university = fields['UNIVERSITY'] || '[Nama Universitas]';
    const year = fields['YEAR'] || '[Tahun]';

    return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-height:85vh;text-align:center;padding:2em 2em;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:0.5em;margin-top:2em;">
        <h1 style="font-size:1.4em;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;line-height:1.5;color:#18181b;margin:0;padding:0;border:none;max-width:85%;">${title}</h1>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:1.2em;">
        ${docType ? `<h2 style="font-size:1.25em;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#18181b;margin:0;">${docType}</h2>` : ''}
        ${description ? `<p style="font-size:0.95em;font-style:italic;color:#3f3f46;line-height:1.6;max-width:80%;margin:0;">${description}</p>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:0.3em;">
        <p style="font-size:1.05em;font-weight:700;color:#18181b;margin:0;">${author}</p>
        <p style="font-size:1em;font-weight:400;color:#3f3f46;margin:0;">${nim}</p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:0.3em;margin-bottom:2em;">
        <p style="font-size:1em;font-weight:700;text-transform:uppercase;color:#18181b;margin:0;">${department}</p>
        <p style="font-size:1em;font-weight:700;text-transform:uppercase;color:#18181b;margin:0;">${faculty}</p>
        <p style="font-size:1em;font-weight:700;text-transform:uppercase;color:#18181b;margin:0;">${university}</p>
        <p style="font-size:1em;font-weight:700;color:#18181b;margin:0;">${year}</p>
      </div>
    </div>`;
  }, []);

  // Helper: Konversi Markdown ke HTML terstruktur dan rapi untuk paper akademis
  const convertMarkdownToHtml = useCallback((md: string): string => {
    // Deteksi cover page block
    const coverStartIdx = md.indexOf('---COVER_PAGE_START---');
    const coverEndIdx = md.indexOf('---COVER_PAGE_END---');

    if (coverStartIdx !== -1 && coverEndIdx !== -1 && coverEndIdx > coverStartIdx) {
      const coverBlock = md.substring(coverStartIdx + '---COVER_PAGE_START---'.length, coverEndIdx);
      const coverHtml = renderCoverPageHtml(coverBlock);
      // Hanya return cover page HTML (sisa konten dihandle oleh splitMarkdownIntoSections)
      const beforeCover = md.substring(0, coverStartIdx).trim();
      const afterCover = md.substring(coverEndIdx + '---COVER_PAGE_END---'.length).trim();

      // Jika ada konten setelah cover page, proses secara terpisah
      if (afterCover) {
        // Ini seharusnya tidak terjadi karena splitMarkdownIntoSections sudah memisahkan
        // Tapi sebagai fallback, gabungkan
        return coverHtml;
      }
      return coverHtml;
    }

    const lines = md.split('\n');
    const htmlParts: string[] = [];
    let inUl = false;
    let inOl = false;
    let paragraphBuffer: string[] = [];

    // Helper: konversi inline formatting (bold, italic, code)
    const inlineFormat = (text: string): string => {
      return text
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:#f0f0f3;padding:2px 7px;border-radius:4px;font-size:0.88em;font-family:\'SF Mono\',\'Fira Code\',\'Cascadia Code\',monospace;color:#18181b;">$1</code>');
    };

    // Helper: flush paragraph buffer
    const flushParagraph = () => {
      if (paragraphBuffer.length > 0) {
        const text = paragraphBuffer.join('<br/>');
        htmlParts.push(`<p style="margin:0.6em 0 0.8em;line-height:2;text-align:justify;text-indent:2em;color:#1a1a1a;">${inlineFormat(text)}</p>`);
        paragraphBuffer = [];
      }
    };

    // Helper: tutup list yang sedang terbuka
    const closeList = () => {
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip cover page markers jika masih ada
      if (trimmed === '---COVER_PAGE_START---' || trimmed === '---COVER_PAGE_END---') {
        continue;
      }

      // Baris kosong → flush paragraph & tutup list
      if (!trimmed) {
        flushParagraph();
        closeList();
        continue;
      }

      // Heading 1: # Title — Judul utama dokumen
      const h1Match = trimmed.match(/^#\s+(.+)$/);
      if (h1Match && !trimmed.startsWith('##')) {
        flushParagraph();
        closeList();
        htmlParts.push(`<h1 style="font-size:1.5em;font-weight:700;margin:1.6em 0 0.6em;padding-bottom:0.4em;border-bottom:2.5px solid #18181b;color:#18181b;letter-spacing:0.01em;text-transform:uppercase;">${inlineFormat(h1Match[1])}</h1>`);
        continue;
      }

      // Heading 2: ## BAB / Section — dengan garis atas halus sebagai pemisah
      const h2Match = trimmed.match(/^##\s+(.+)$/);
      if (h2Match && !trimmed.startsWith('###')) {
        flushParagraph();
        closeList();
        htmlParts.push(`<h2 style="font-size:1.25em;font-weight:700;margin:1.8em 0 0.5em;padding-top:0.8em;border-top:1px solid #d4d4d8;color:#18181b;letter-spacing:0.01em;">${inlineFormat(h2Match[1])}</h2>`);
        continue;
      }

      // Heading 3: ### Sub-bab
      const h3Match = trimmed.match(/^###\s+(.+)$/);
      if (h3Match) {
        flushParagraph();
        closeList();
        htmlParts.push(`<h3 style="font-size:1.1em;font-weight:600;margin:1.2em 0 0.4em;color:#27272a;padding-left:0.2em;">${inlineFormat(h3Match[1])}</h3>`);
        continue;
      }

      // Heading 4: #### Sub-sub-bab
      const h4Match = trimmed.match(/^####\s+(.+)$/);
      if (h4Match) {
        flushParagraph();
        closeList();
        htmlParts.push(`<h4 style="font-size:1.02em;font-weight:600;margin:1em 0 0.3em;color:#3f3f46;padding-left:0.4em;">${inlineFormat(h4Match[1])}</h4>`);
        continue;
      }

      // Horizontal rule: --- atau *** (tapi BUKAN cover page markers)
      if (/^[-*_]{3,}$/.test(trimmed) && !trimmed.includes('COVER_PAGE')) {
        flushParagraph();
        closeList();
        htmlParts.push('<hr style="border:none;border-top:1px solid #e4e4e7;margin:2em 1em;"/>');
        continue;
      }

      // Blockquote: > text
      const bqMatch = trimmed.match(/^>\s*(.*)$/);
      if (bqMatch) {
        flushParagraph();
        closeList();
        htmlParts.push(`<blockquote style="border-left:3.5px solid #3b82f6;padding:0.6em 1.2em;margin:1em 0;background:#f8fafc;border-radius:0 6px 6px 0;color:#374151;font-style:italic;line-height:1.8;">${inlineFormat(bqMatch[1])}</blockquote>`);
        continue;
      }

      // Unordered list: - item atau * item
      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        flushParagraph();
        if (inOl) { htmlParts.push('</ol>'); inOl = false; }
        if (!inUl) {
          htmlParts.push('<ul style="margin:0.6em 0;padding-left:2em;list-style-type:disc;">');
          inUl = true;
        }
        htmlParts.push(`<li style="margin:0.35em 0;line-height:1.9;color:#1a1a1a;">${inlineFormat(ulMatch[1])}</li>`);
        continue;
      }

      // Ordered list: 1. item
      const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        flushParagraph();
        if (inUl) { htmlParts.push('</ul>'); inUl = false; }
        if (!inOl) {
          htmlParts.push('<ol style="margin:0.6em 0;padding-left:2em;list-style-type:decimal;">');
          inOl = true;
        }
        htmlParts.push(`<li style="margin:0.35em 0;line-height:1.9;color:#1a1a1a;">${inlineFormat(olMatch[1])}</li>`);
        continue;
      }

      // Regular text → tambahkan ke paragraph buffer
      closeList();
      paragraphBuffer.push(trimmed);
    }

    // Flush sisa-sisa
    flushParagraph();
    closeList();

    return htmlParts.join('\n');
  }, [renderCoverPageHtml]);

  // Helper: Memecah markdown menjadi beberapa section berdasarkan heading utama
  const splitMarkdownIntoSections = useCallback((md: string): string[] => {
    const sections: string[] = [];
    let remainingMd = md;

    // 1. Deteksi cover page block terlebih dahulu → jadikan section pertama
    const coverStartIdx = md.indexOf('---COVER_PAGE_START---');
    const coverEndIdx = md.indexOf('---COVER_PAGE_END---');

    if (coverStartIdx !== -1 && coverEndIdx !== -1 && coverEndIdx > coverStartIdx) {
      // Cover page menjadi section pertama (satu halaman penuh)
      const coverSection = md.substring(coverStartIdx, coverEndIdx + '---COVER_PAGE_END---'.length);
      sections.push(coverSection.trim());

      // Sisa konten setelah cover page
      remainingMd = md.substring(coverEndIdx + '---COVER_PAGE_END---'.length).trim();
    }

    // 2. Split sisa konten berdasarkan heading level 1 atau 2 (# atau ##)
    if (remainingMd) {
      const lines = remainingMd.split('\n');
      let currentSection = '';

      for (const line of lines) {
        // Deteksi heading utama (# atau ##, tapi BUKAN ###)
        if (/^#{1,2}\s+/.test(line) && !/^###/.test(line)) {
          // Jika sudah ada konten, simpan section sebelumnya
          if (currentSection.trim()) {
            sections.push(currentSection.trim());
          }
          currentSection = line + '\n';
        } else {
          currentSection += line + '\n';
        }
      }
      // Jangan lupa section terakhir
      if (currentSection.trim()) {
        sections.push(currentSection.trim());
      }
    }

    // Jika hanya ada 1 section (tanpa cover) atau kosong, coba split berdasarkan jumlah baris
    const nonCoverSections = sections.filter(s => !s.includes('---COVER_PAGE_START---'));
    if (nonCoverSections.length <= 1 && remainingMd.length > 1500) {
      // Remove non-cover sections dan re-split
      const coverSections = sections.filter(s => s.includes('---COVER_PAGE_START---'));
      const allLines = remainingMd.split('\n');
      const linesPerPage = 40;
      const chunkedSections: string[] = [];
      for (let i = 0; i < allLines.length; i += linesPerPage) {
        chunkedSections.push(allLines.slice(i, i + linesPerPage).join('\n'));
      }
      return [...coverSections, ...chunkedSections];
    }

    return sections;
  }, []);

  // Fungsi untuk menyisipkan konten AI ke paper editor dengan AUTO-PAGINATION
  const insertToPaper = useCallback((markdownContent: string, messageIndex?: number) => {
    const sections = splitMarkdownIntoSections(markdownContent);

    if (sections.length <= 1) {
      // Konten pendek — masukkan ke halaman terakhir saja
      const targetPage = pageNumber - 1;
      const editor = document.getElementById(`main-editor-${targetPage}`);
      if (!editor) return;

      const htmlContent = convertMarkdownToHtml(markdownContent);
      const separator = editor.innerHTML.trim() ? '<hr style="border:none;border-top:1px solid #e4e4e7;margin:2em 0;"/>' : '';
      editor.innerHTML += separator + htmlContent;
    } else {
      // Konten panjang — distribusikan ke beberapa halaman
      // Halaman pertama: masukkan section pertama ke halaman terakhir yang ada
      const firstEditor = document.getElementById(`main-editor-${pageNumber - 1}`);
      if (firstEditor) {
        const separator = firstEditor.innerHTML.trim() ? '<hr style="border:none;border-top:1px solid #e4e4e7;margin:2em 0;"/>' : '';
        firstEditor.innerHTML += separator + convertMarkdownToHtml(sections[0]);
      }

      // Tambah halaman baru untuk section-section berikutnya
      const newPagesNeeded = sections.length - 1;
      const startPageIndex = pageNumber; // halaman baru dimulai dari index ini

      // Update jumlah halaman
      setPageNumber(prev => prev + newPagesNeeded);

      // Gunakan setTimeout bertingkat untuk menunggu DOM render halaman baru
      const insertRemainingSection = (sectionIdx: number) => {
        if (sectionIdx >= sections.length) return;

        const editorId = `main-editor-${startPageIndex + (sectionIdx - 1)}`;
        const editor = document.getElementById(editorId);

        if (editor) {
          editor.innerHTML = convertMarkdownToHtml(sections[sectionIdx]);
          // Insert section berikutnya
          if (sectionIdx + 1 < sections.length) {
            setTimeout(() => insertRemainingSection(sectionIdx + 1), 150);
          }
        } else {
          // DOM belum siap, coba lagi
          setTimeout(() => insertRemainingSection(sectionIdx), 200);
        }
      };

      // Mulai insert dari section ke-2 (index 1) setelah delay untuk render
      setTimeout(() => insertRemainingSection(1), 300);
    }

    // Show success toast
    const totalPages = sections.length > 1 ? sections.length : 1;
    setToast({
      message: totalPages > 1
        ? `✅ Berhasil ditulis ke ${totalPages} halaman Paper!`
        : '✅ Berhasil ditulis ke Paper!',
      visible: true
    });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);

    // Show checkmark feedback on the button
    if (messageIndex !== undefined) {
      setInsertedIndex(messageIndex);
      setTimeout(() => setInsertedIndex(null), 2500);
    }

    // Scroll to the first page where content was inserted
    const firstPage = document.getElementById(`main-editor-${pageNumber - 1}`);
    if (firstPage) {
      firstPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pageNumber, convertMarkdownToHtml, splitMarkdownIntoSections]);

  // Disini mencoba untuk koneksikan sistem ke backend
  const sendToAI = async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      const newUserMessage = { role: "user" as const, content: messageText };
      setChatHistory(prev => [...prev, newUserMessage]);
      setIsChatActive(true);
      setIsLoading(true);
      setInputValue("");

      try {
         //Menunggu respon dari backend
         const connectfrombackend = await fetch("/api/LibraAI", {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({message: messageText}),
         });

         //Menunggu Response dari backend
         const waitresponfrombackend = await connectfrombackend.json();

         //Mendapatkan Reply dari AI
         const reply = waitresponfrombackend.reply || "Pesan diterima.";
         
         //Menambahkan Reply ke chat history
         setChatHistory(prev => [...prev, { role: "friend", content: reply }]);
      } catch {
         //Pesan untuk kalau AI masih belum terkoneksi dari backend ke front end
         console.log("LibraAI belum terkoneksi");
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

      // Bersihkan teks pembuka/basa-basi sebelum heading markdown pertama
      // Contoh: "Tentu, ini draf artikel... \n\n# Judul" → "# Judul"
      let cleanedReply = reply;
      const headingIndex = reply.search(/^#\s+/m);
      if (headingIndex > 0) {
        cleanedReply = reply.substring(headingIndex);
      }

      // Auto-insert ke paper setelah response diterima
      // Kita perlu delay sedikit agar state terupdate dulu
      setTimeout(() => {
        insertToPaper(cleanedReply);
      }, 100);

    } catch (error) {
      console.error("Error fetching from API:", error);
      setChatHistory(prev => [...prev, { role: "friend", content: "Maaf, saya sedang kesulitan terhubung dengan LibraAI saat ini." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FITUR 1: Auto-Citation ---
  const handleAutoCitation = () => {
    if (!featureInput.trim()) return;
    const topic = `Buatkan daftar pustaka format APA atau IEEE secara akurat berdasarkan referensi (Judul/DOI/Link) berikut:\n${featureInput}`;
    setFeatureModal({ open: false, type: '' });
    setFeatureInput('');
    sendToAI(topic);
  };

  // --- FITUR 2: Chat with Papers (Upload PDF / Jurnal) ---
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setToast({ message: `✅ Membaca dokumen ${file.name}...`, visible: true });
      setTimeout(() => setToast({ message: "", visible: false }), 3000);

      const topic = `[SISTEM: Pengguna mengunggah referensi "${file.name}"]\nTolong bantu saya menganalisis, mencari research gap, atau merangkum dokumen yang saya unggah ini. Apakah kamu siap?`;
      sendToAI(topic);
      // Reset input supaya bisa upload file yang sama lagi
      e.target.value = '';
    }
  };

  // --- FITUR 3: Academic Paraphraser ---
  const handleParaphrase = () => {
    if (!featureInput.trim()) return;
    const topic = `Tolong tulis ulang teks berikut agar menggunakan gaya bahasa akademis, baku, ilmiah, dan objektif:\n\n"${featureInput}"`;
    setFeatureModal({ open: false, type: '' });
    setFeatureInput('');
    sendToAI(topic);
  };

  // --- FITUR 4: Integrasi Math Equation ---
  const handleMathEquation = () => {
    if (!featureInput.trim()) return;
    const topic = `Buatkan rumus matematika menggunakan format LaTeX / text untuk deskripsi berikut:\n\n"${featureInput}"\n\nTampilkan hasilnya di dalam blok kode (code block) agar format stabil dan mudah disalin.`;
    setFeatureModal({ open: false, type: '' });
    setFeatureInput('');
    sendToAI(topic);
  };

  // --- FITUR 6: Virtual Advisor ---
  const handleVirtualAdvisor = () => {
    if (!featureInput.trim()) return;
    const topic = `Bertindaklah sebagai dosen pembimbing skripsi/penelitian yang kritis. Berikan evaluasi, kritik, dan saran perbaikan yang membangun untuk draf teks berikut:\n\n"${featureInput}"`;
    setFeatureModal({ open: false, type: '' });
    setFeatureInput('');
    sendToAI(topic);
  };

  // --- FITUR 7: Data & Table Formatter ---
  const handleTableFormatter = () => {
    if (!featureInput.trim()) return;
    const topic = `Tolong ubah data mentah berikut menjadi sebuah format tabel (Markdown Table) yang rapi, terstruktur, dan mudah dibaca:\n\n"${featureInput}"`;
    setFeatureModal({ open: false, type: '' });
    setFeatureInput('');
    sendToAI(topic);
  };

  // --- FITUR 8: Smart Outline Builder ---
  const handleOutlineBuilder = () => {
    if (!featureInput.trim()) return;
    const topic = `Buatkan struktur outline (kerangka tulisan/mind map) yang sistematis untuk topik penelitian berikut:\n\n"${featureInput}"\n\nTolong sertakan poin-poin penting yang wajib dibahas pada setiap bab dan sub-babnya.`;
    setFeatureModal({ open: false, type: '' });
    setFeatureInput('');
    sendToAI(topic);
  };

  // --- FITUR 5: Auto-Generate Abstract ---
  const handleAutoAbstract = () => {
    let fullText = "";
    for (let i = 0; i < pageNumber; i++) {
      const editor = document.getElementById(`main-editor-${i}`);
      if (editor) {
        fullText += editor.innerText + "\\n\\n";
      }
    }

    if (fullText.trim().length < 50) {
      setToast({ message: "⚠️ Teks di paper terlalu pendek untuk dibuatkan abstrak.", visible: true });
      setTimeout(() => setToast({ message: "", visible: false }), 3000);
      return;
    }

    const topic = `Buatkan abstrak (sekitar 200-250 kata) berbahasa Indonesia berdasarkan keseluruhan isi naskah paper saya berikut ini:\n\n${fullText.substring(0, 3000)}...`;
    sendToAI(topic);
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
      <div className="relative flex flex-col items-center min-h-screen bg-[#D9E4D1]/50 dark:bg-[#0D0606]/50 font-sans overflow-x-hidden py-12 transition-colors duration-300">
        <Analytics />
        {/* Sidebars */}
        <SidebarLeft />
        <SidebarRight onImageUpload={handleImageUpload} />

        {/* Main Content Area */}
        <main className="relative z-10 w-full flex flex-col items-center justify-start sm:p-4 transition-all duration-500 min-h-[85vh] md:pl-[23rem] md:pr-72 pt-20">

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
                className={`relative flex flex-col bg-[#D9E4D1] dark:bg-[#0D0606] shadow-2xl rounded-sm border-2 z-10 transition-all duration-300 ease-in-out w-full min-h-[85vh] cursor-pointer ${selectedPage === index
                  ? 'border-blue-500 dark:border-blue-400 shadow-blue-200/30 dark:shadow-blue-900/20'
                  : 'border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                style={{
                  backgroundColor: "var(--paper-color, #ffffff)",
                }}
                onClick={() => setSelectedPage(index)}
              >

                {/* Page number badge — selalu tampil di kiri atas setiap halaman */}
                <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold z-20 transition-colors ${selectedPage === index
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 text-[#0D0606]/70 dark:text-[#D9E4D1]/70'
                  }`}>
                  {index + 1}
                </div>



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
                  className="absolute inset-0 w-full h-full outline-none py-16 pr-12 pl-24 text-[#0D0606] dark:text-[#D9E4D1] scrollbar-hide overflow-hidden whitespace-pre-wrap focus:outline-none z-10"
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

        {/* Floating Paper Controls — ngambang di sisi kanan layar */}
        <AnimatePresence>
          {selectedPage !== null && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-20 sm:top-30 right-2 sm:right-6 xl:right-[calc(49.3%-var(--paper-max-width,794px)/2-6rem)] flex flex-col items-center p-1.5 gap-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 rounded-3xl z-50"
            >
              <button
                onClick={() => handleAddPaper()}
                className="p-2.5 text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:text-zinc-900 dark:text-[#0D0606]/50 dark:text-[#D9E4D1]/50 dark:hover:text-white bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl transition-all"
                title="Tambah Halaman"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-[#0D0606] dark:text-[#D9E4D1]">
                {(selectedPage ?? 0) + 1}/{pageNumber}
              </span>
              <button
                onClick={() => handleDeletePaper()}
                disabled={pageNumber <= 1}
                className="p-2.5 text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:text-red-500 dark:text-[#0D0606]/50 dark:text-[#D9E4D1]/50 dark:hover:text-red-400 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                title={`Hapus Halaman ${(selectedPage ?? 0) + 1}`}
              >
                <Minus className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Chat & Search Overlay — ngambang di atas semua konten */}
        <div className="fixed top-24 left-2 right-2 sm:right-auto sm:left-6 bottom-20 md:bottom-24 sm:w-[22rem] z-40 flex flex-col pointer-events-auto bg-white/40 dark:bg-[#0D0606]/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          {/* Chat Messages */}
          <AnimatePresence>
            {isChatActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex flex-col gap-4 w-full flex-1 mb-4 overflow-y-auto scrollbar-hide p-3 bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-[#0D0606]/10 dark:border-[#D9E4D1]/10 shadow-inner"
                ref={chatContainerRef}
              >
                <div className="flex justify-between items-center w-full mb-2 border-b border-[#0D0606]/20 dark:border-[#D9E4D1]/20 pb-2 sticky top-0 bg-[#D9E4D1] dark:bg-[#0D0606] backdrop-blur-xl z-10 px-2 rounded-t-xl -mt-2 pt-2">
                  <span className="text-xs font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 uppercase tracking-widest pl-2">LibraAI</span>
                  <button
                    onClick={() => setIsChatActive(false)}
                    className="p-1.5 rounded-full text-[#0D0606]/50 dark:text-[#D9E4D1]/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 hover:text-[#0D0606] dark:hover:text-[#D9E4D1] transition-colors"
                    title="Sembunyikan Obrolan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-6 px-1 pb-2">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}>
                      <div className={`${msg.role === 'user' ? 'bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 rounded-tr-sm max-w-[85%]' : 'bg-[#0D0606] dark:bg-[#D9E4D1] rounded-tl-sm w-fit max-w-[95%] text-[#D9E4D1] dark:text-[#0D0606]'} px-5 py-4 rounded-2xl shadow-sm overflow-x-auto`}>
                        <div className={`font-medium leading-relaxed text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'text-[#0D0606] dark:text-[#D9E4D1]' : ''}`}>
                          {msg.role === 'user' ? msg.content : <Markdown>{msg.content}</Markdown>}
                        </div>
                        {/* Tombol "Tulis ke Paper" — hanya muncul di respons AI */}
                        {msg.role === 'friend' && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#0D0606]/10 dark:border-[#D9E4D1]/10">
                            <button
                              onClick={() => insertToPaper(msg.content, idx)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${insertedIndex === idx
                                ? 'bg-green-500/20 text-green-300 dark:text-green-600'
                                : 'bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 text-white/70 dark:text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:bg-white/20 dark:hover:bg-zinc-700/50 hover:text-white dark:hover:text-zinc-300'
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
                      <div className="bg-[#0D0606] dark:bg-[#D9E4D1] px-5 py-4 rounded-2xl rounded-tl-sm w-fit shadow-md">
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

          {/* Quick Action Buttons — muncul saat chat belum aktif */}
          <AnimatePresence>
            {!isChatActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-2 w-full mb-3"
              >
                <button
                  onClick={() => setQuickActionModal({ open: true, type: 'paper_research', label: 'Research' })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 border border-[#0D0606]/10 dark:border-[#D9E4D1]/10 rounded-xl text-xs w-full justify-center font-semibold text-[#0D0606] dark:text-[#D9E4D1] hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Buat Research
                </button>
                <button
                  onClick={() => setQuickActionModal({ open: true, type: 'paper_skripsi', label: 'Skripsi' })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 border border-[#0D0606]/10 dark:border-[#D9E4D1]/10 rounded-xl text-xs w-full justify-center font-semibold text-[#0D0606] dark:text-[#D9E4D1] hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Buat Skripsi
                </button>
                <button
                  onClick={() => setQuickActionModal({ open: true, type: 'paper_artikel', label: 'Artikel Ilmiah' })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 border border-[#0D0606]/10 dark:border-[#D9E4D1]/10 rounded-xl text-xs w-full justify-center font-semibold text-[#0D0606] dark:text-[#D9E4D1] hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  Buat Artikel
                </button>
                <div className="w-[1px] h-6 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 mx-1"></div>
                <button
                  onClick={() => setIsMoreFeaturesOpen(!isMoreFeaturesOpen)}
                  className={`flex items-center justify-center p-2 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 border ${isMoreFeaturesOpen
                    ? 'bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 border-zinc-300 dark:border-zinc-600 text-[#0D0606] dark:text-[#D9E4D1]'
                    : 'bg-white/90 dark:bg-zinc-800/90 border-[#0D0606]/20 dark:border-[#D9E4D1]/20 text-[#0D0606] dark:text-[#D9E4D1] hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  title="Fitur Lainnya"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Action Buttons — Row 2 (AI Features 1-8) */}
          <AnimatePresence>
            {!isChatActive && isMoreFeaturesOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-2 w-full mb-4 overflow-y-auto"
              >
                {/* 1. Auto-Citation */}
                <button onClick={() => setFeatureModal({ open: true, type: 'citation' })} className="w-full justify-center flex items-center gap-1.5 px-2 py-2 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-800/50 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm active:scale-95 backdrop-blur-md">
                  <LinkIcon className="w-3.5 h-3.5" /> Sitasi & Pustaka
                </button>

                {/* 2. Upload PDF (Chat with Papers) */}
                <div className="relative">
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Upload Jurnal PDF" />
                  <button className="w-full justify-center flex items-center gap-1.5 px-2 py-2 bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200/80 dark:border-purple-800/50 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all shadow-sm active:scale-95 backdrop-blur-md pointer-events-none">
                    <Upload className="w-3.5 h-3.5" /> Chat w/ Papers
                  </button>
                </div>

                {/* 3. Paraphraser */}
                <button onClick={() => setFeatureModal({ open: true, type: 'paraphrase' })} className="w-full justify-center flex items-center gap-1.5 px-2 py-2 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm active:scale-95 backdrop-blur-md">
                  <Edit3 className="w-3.5 h-3.5" /> Academic Tone
                </button>

                {/* 4. Math Equation LaTeX */}
                <button onClick={() => setFeatureModal({ open: true, type: 'math' })} className="w-full justify-center flex items-center gap-1.5 px-2 py-2 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/50 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all shadow-sm active:scale-95 backdrop-blur-md">
                  <Calculator className="w-3.5 h-3.5" /> Math Equation
                </button>

                {/* 5. Auto Abstract */}
                <button onClick={handleAutoAbstract} className="w-full justify-center flex items-center gap-1.5 px-2 py-2 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/80 dark:border-rose-800/50 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm active:scale-95 backdrop-blur-md">
                  <AlignLeft className="w-3.5 h-3.5" /> Auto Abstrak
                </button>

                {/* 6. Virtual Advisor */}
                <button onClick={() => setFeatureModal({ open: true, type: 'advisor' })} className="w-full justify-center flex items-center gap-1.5 px-2 py-2 bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-200/80 dark:border-indigo-800/50 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all shadow-sm active:scale-95 backdrop-blur-md">
                  <MessageSquare className="w-3.5 h-3.5" /> Virtual Advisor
                </button>

                {/* 7. Table Formatter */}
                <button onClick={() => setFeatureModal({ open: true, type: 'table' })} className="w-full justify-center flex items-center gap-1.5 px-2 py-2 bg-cyan-50/80 dark:bg-cyan-900/20 border border-cyan-200/80 dark:border-cyan-800/50 rounded-lg text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-all shadow-sm active:scale-95 backdrop-blur-md">
                  <Table className="w-3.5 h-3.5" /> Data ke Tabel
                </button>

                {/* 8. Smart Outline */}
                <button onClick={() => setFeatureModal({ open: true, type: 'outline' })} className="w-full justify-center flex items-center gap-1.5 px-2 py-2 bg-orange-50/80 dark:bg-orange-900/20 border border-orange-200/80 dark:border-orange-800/50 rounded-lg text-xs font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all shadow-sm active:scale-95 backdrop-blur-md">
                  <Network className="w-3.5 h-3.5" /> Smart Outline
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Input — selalu terlihat di bawah layar */}
          <motion.div
            layout
            className="w-full mt-auto relative group shrink-0"
          >
            <div className={`absolute inset-0 bg-zinc-900/5 dark:bg-white/5 rounded-2xl blur-xl transition-all duration-300 ${isFocused ? "opacity-100 scale-105" : "opacity-0 scale-100"}`} />

            <div className={`relative flex items-center bg-[#D9E4D1]/90 dark:bg-[#0D0606]/90 backdrop-blur-xl border-2 rounded-2xl p-2 transition-colors duration-300 shadow-2xl shadow-zinc-300/30 dark:shadow-black/50 ${isFocused ? "border-[#0D0606] dark:border-[#D9E4D1]" : "border-zinc-200/80 dark:border-zinc-800/80"}`}>
              <div className="pl-4 pr-3">
                <Search className={`w-5 h-5 transition-colors duration-300 ${isFocused ? "text-[#0D0606] dark:text-[#D9E4D1]" : "text-[#0D0606]/50 dark:text-[#D9E4D1]/50"}`} />
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
                className="w-full bg-transparent border-none outline-none py-3 pr-4 text-[#0D0606] dark:text-[#D9E4D1] placeholder:text-[#0D0606]/50 dark:text-[#D9E4D1]/50 text-sm font-medium"
              />
              <button
                onClick={handleStart}
                className="hidden sm:flex items-center justify-center gap-2 bg-[#0D0606] dark:bg-[#D9E4D1] hover:bg-zinc-800 dark:hover:bg-zinc-200 text-[#D9E4D1] dark:text-[#0D0606] w-12 h-12 rounded-xl font-medium transition-all shadow-sm active:scale-95 group-hover:shadow-md border border-transparent dark:border-zinc-200">
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
            className="fixed top-6 right-6 z-[100] bg-[#0D0606] dark:bg-[#D9E4D1] text-[#D9E4D1] dark:text-[#0D0606] px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold border border-zinc-700 dark:border-zinc-200"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Action Modal — Dialog untuk masukkan topik */}
      {/* Feature Input Modal */}
      <AnimatePresence>
        {featureModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#D9E4D1] dark:bg-[#0D0606] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#0D0606]/20 dark:border-[#D9E4D1]/20"
            >
              <div className="p-5 border-b border-[#0D0606]/10 dark:border-[#D9E4D1]/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 rounded-xl">
                    {featureModal.type === 'citation' && <LinkIcon className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                    {featureModal.type === 'paraphrase' && <Edit3 className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                    {featureModal.type === 'math' && <Calculator className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                    {featureModal.type === 'advisor' && <MessageSquare className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                    {featureModal.type === 'table' && <Table className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                    {featureModal.type === 'outline' && <Network className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                  </div>
                  <h3 className="text-lg font-bold text-[#0D0606] dark:text-[#D9E4D1]">
                    {featureModal.type === 'citation' && 'Buat Sitasi / Daftar Pustaka'}
                    {featureModal.type === 'paraphrase' && 'Academic Tone Paraphraser'}
                    {featureModal.type === 'math' && 'Buat Rumus Matematika'}
                    {featureModal.type === 'advisor' && 'Virtual Advisor (Kritikus AI)'}
                    {featureModal.type === 'table' && 'Data & Table Formatter'}
                    {featureModal.type === 'outline' && 'Smart Outline Builder'}
                  </h3>
                </div>
                <button
                  onClick={() => { setFeatureModal({ open: false, type: '' }); setFeatureInput(''); }}
                  className="p-2 text-[#0D0606]/50 dark:text-[#D9E4D1]/50 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                <label className="block text-sm font-medium text-[#0D0606] dark:text-[#D9E4D1] mb-2">
                  {featureModal.type === 'citation' && 'Masukkan Judul / Link Jurnal / DOI:'}
                  {featureModal.type === 'paraphrase' && 'Masukkan Teks yang Ingin Diubah:'}
                  {featureModal.type === 'math' && 'Jelaskan Rumus yang Ingin Dibuat:'}
                  {featureModal.type === 'advisor' && 'Masukkan Teks/Draf yang Ingin Dievaluasi:'}
                  {featureModal.type === 'table' && 'Masukkan Data Mentah (CSV/Teks):'}
                  {featureModal.type === 'outline' && 'Masukkan Topik/Judul Penelitian:'}
                </label>
                <textarea
                  autoFocus
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder={
                    featureModal.type === 'citation' ? 'Contoh: https://doi.org/10.1016/j.eswa.2023...' :
                      featureModal.type === 'paraphrase' ? 'Tulis teks santai/berantakan di sini...' :
                        featureModal.type === 'math' ? 'Contoh: Rumus regresi linear berganda dengan 2 variabel independen' :
                          featureModal.type === 'advisor' ? 'Contoh: Latar belakang ini membahas tentang...' :
                            featureModal.type === 'table' ? 'Contoh: Nama, Umur, Nilai\nAndi, 20, 85\nBudi, 21, 90' :
                              'Contoh: Pengaruh AI terhadap Produktivitas Mahasiswa'
                  }
                  rows={4}
                  className="w-full bg-[#D9E4D1] dark:bg-[#0D0606] border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 rounded-xl px-4 py-3 text-sm text-[#0D0606] dark:text-[#D9E4D1] outline-none focus:ring-2 focus:ring-[#0D0606] dark:focus:ring-[#D9E4D1] transition-all resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (featureModal.type === 'citation') handleAutoCitation();
                      else if (featureModal.type === 'paraphrase') handleParaphrase();
                      else if (featureModal.type === 'math') handleMathEquation();
                      else if (featureModal.type === 'advisor') handleVirtualAdvisor();
                      else if (featureModal.type === 'table') handleTableFormatter();
                      else if (featureModal.type === 'outline') handleOutlineBuilder();
                    }
                  }}
                />
              </div>

              <div className="p-4 bg-[#D9E4D1] dark:bg-[#0D0606]/50 border-t border-[#0D0606]/10 dark:border-[#D9E4D1]/10 flex justify-end gap-2">
                <button
                  onClick={() => { setFeatureModal({ open: false, type: '' }); setFeatureInput(''); }}
                  className="px-4 py-2 text-sm font-semibold text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:text-[#0D0606] dark:hover:text-[#D9E4D1] transition-colors"
                >
                  Batal
                </button>
                <button
                  disabled={!featureInput.trim()}
                  onClick={() => {
                    if (featureModal.type === 'citation') handleAutoCitation();
                    else if (featureModal.type === 'paraphrase') handleParaphrase();
                    else if (featureModal.type === 'math') handleMathEquation();
                    else if (featureModal.type === 'advisor') handleVirtualAdvisor();
                    else if (featureModal.type === 'table') handleTableFormatter();
                    else if (featureModal.type === 'outline') handleOutlineBuilder();
                  }}
                  className="px-5 py-2 text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                >
                  Minta AI
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-[#D9E4D1] dark:bg-[#0D0606] rounded-3xl p-8 w-full max-w-md shadow-2xl border border-[#0D0606]/20 dark:border-[#D9E4D1]/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 rounded-xl">
                  {quickActionModal.type === 'paper_research' && <BookOpen className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                  {quickActionModal.type === 'paper_skripsi' && <GraduationCap className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                  {quickActionModal.type === 'paper_artikel' && <Newspaper className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0D0606] dark:text-[#D9E4D1]">Buat {quickActionModal.label}</h3>
                  <p className="text-xs text-[#0D0606]/70 dark:text-[#D9E4D1]/70">Masukkan topik, LibraAI akan langsung menulisnya ke paper</p>
                </div>
              </div>

              <input
                type="text"
                value={quickActionTopic}
                onChange={(e) => setQuickActionTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendToAIForPaper(quickActionTopic, quickActionModal.type); }}
                placeholder={`Contoh: Pengaruh AI terhadap pendidikan di Indonesia`}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-[#0D0606]/20 dark:border-[#D9E4D1]/20 focus:border-zinc-900 dark:focus:border-white rounded-xl px-4 py-3 text-sm text-[#0D0606] dark:text-[#D9E4D1] placeholder:text-[#0D0606]/50 dark:text-[#D9E4D1]/50 outline-none transition-colors"
                autoFocus
              />

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => { setQuickActionModal({ open: false, type: "", label: "" }); setQuickActionTopic(""); }}
                  className="flex-1 px-4 py-3 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 text-[#0D0606] dark:text-[#D9E4D1] rounded-xl text-sm font-semibold hover:bg-[#0D0606]/20 dark:hover:bg-[#D9E4D1]/20 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => sendToAIForPaper(quickActionTopic, quickActionModal.type)}
                  disabled={!quickActionTopic.trim() || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0D0606] dark:bg-[#D9E4D1] text-[#D9E4D1] dark:text-[#0D0606] rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
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
