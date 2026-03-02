"use client";

import { motion } from "framer-motion";
import { Settings, Type, List, AlignLeft, AlignCenter, AlignRight, AlignJustify, Moon, Sun, Palette, Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function SidebarLeft() {
  // Kumpulan State untuk menyimpan pengaturan gaya tulisan dan warna saat ini
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState(400);
  const [textAlign, setTextAlign] = useState("left");
  const { theme, setTheme } = useTheme(); // Hook untuk mengubah mode Terang/Gelap
  const [mounted, setMounted] = useState(false);
  const [fontColor, setFontColor] = useState("#000000");

  //Kumpulan state untuk advanced
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Otomatis sinkronkan opsi format saat kursor/seleksi berubah di editor
    const handleSelectionChange = () => {
      // Hanya berjalan jika kursor ada di editor naskah
      const editor = document.getElementById("main-editor");
      if (!editor || document.activeElement !== editor) return;

      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
      setIsStrikethrough(document.queryCommandState("strikeThrough"));

      // Sinkronkan Warna (ubah dari format rgb ke hex)
      const foreColor = document.queryCommandValue("foreColor");
      if (foreColor) {
        // queryCommandValue("foreColor") terkadang me-return "rgb(R, G, B)" atau angka integer, 
        // kita butuh helper untuk convert ke "#RRGGBB" jika formatnya rgb
        const rgbToHex = (str: string) => {
          const match = str.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
          if (!match) return str; // Jika bukan format rgb, return as is (bisa hex atau color name yg tersimpan)
          const hex = (x: string) => ("0" + parseInt(x).toString(16)).slice(-2);
          return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
        };
        setFontColor(rgbToHex(foreColor));
      }

      // Sinkronkan Font Family
      const fontQuery = document.queryCommandValue("fontName");
      if (fontQuery) {
        // Membersihkan tanda kutip bawaan dari fontName seperti '"Times New Roman"'
        const cleanedFont = fontQuery.replace(/['"]/g, "").split(",")[0].trim();
        // Fallback untuk mencocokkan standar di UI
        if (cleanedFont === "serif") setFontFamily("Times New Roman");
        else setFontFamily(cleanedFont);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Effect ini berjalan untuk mengatur global style awal editor
  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--editor-font-weight', fontWeight.toString());
    document.documentElement.style.setProperty('--editor-text-align', textAlign);
  }, [fontSize, fontWeight, textAlign]);

  useEffect(() => {
    // Set fallback awal
    document.documentElement.style.setProperty('--editor-font-family', 'Inter');
    document.documentElement.style.setProperty('--editor-font-color', '#000000');
  }, []);

  // Effect untuk mengganti tema (Terang / Gelap) dari situs secara langsung.
  useEffect(() => {
    // Force dark mode implementation to really work
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.setProperty('color-scheme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.setProperty('color-scheme', 'light');
    }
  }, [theme]);

  // Effect khusus untuk warna tulisan. Jika fontColor berubah, otomatis CSS variable diupdate.
  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-color', fontColor);
  }, [fontColor]);

  const handleFontColorChange = (color: string) => {
    setFontColor(color);
  };

  // Function untuk format teks advanced (dipanggil di tombol sidebar)
  const setAdvanced = (command: string) => {
    // Fokuskan ke editor jika belum fokus (agar bisa ngetik setelah klik sidebar)
    const editor = document.getElementById("main-editor");
    if (editor && document.activeElement !== editor) editor.focus();

    // Tembakkan command format teksnya
    document.execCommand(command, false);

    // Update state tombol supaya UI-nya nyala/mati berdasarkan kondisi riil di browser
    if (command === "bold") setIsBold(document.queryCommandState("bold"));
    if (command === "italic") setIsItalic(document.queryCommandState("italic"));
    if (command === "underline") setIsUnderline(document.queryCommandState("underline"));
    if (command === "strikeThrough") setIsStrikethrough(document.queryCommandState("strikeThrough"));
  };



  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed left-0 top-0 h-full w-72 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800 p-6 z-40 hidden md:block pt-20"
    >
      <div className="space-y-8">
        {/* Font Family Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Typography</label>
          <div className="grid grid-cols-1 gap-2">
            {["Inter", "Times New Roman", "Geist", "Georgia", "Arial", "Courier New"].map((font) => (
              <button
                key={font}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setFontFamily(font);
                  const editor = document.getElementById("main-editor");
                  if (editor && document.activeElement !== editor) editor.focus();
                  document.execCommand("fontName", false, font === "Times New Roman" ? "Times New Roman, serif" : font);
                }}
                className={`py-2 px-3 rounded-lg text-left text-sm transition-all duration-200 ${fontFamily === font
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                style={{ fontFamily: font === "Times New Roman" ? "serif" : "inherit" }}
              >
                {font}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Font Size</label>
            <span className="text-xs text-zinc-400">{fontSize}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-zinc-900 dark:accent-white"
          />
        </div>

        {/* Font Thickness moved from Right Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Type className="w-3.5 h-3.5" /> Weight
            </label>
            <span className="text-xs text-zinc-400">{fontWeight}</span>
          </div>
          <input
            type="range"
            min="100"
            max="900"
            step="100"
            value={fontWeight}
            onChange={(e) => setFontWeight(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-zinc-900 dark:accent-white"
          />
          <div className="flex justify-between px-1">
            <span className="text-[10px] text-zinc-400">Thin</span>
            <span className="text-[10px] text-zinc-400 font-bold">Bold</span>
          </div>
        </div>

        {/* Font color*/}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" /> Color
            </label>
            <span className="text-xs text-zinc-400 uppercase font-mono">{fontColor}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-5 gap-2 flex-1">
              {["#000000", "#52525b", "#ef4444", "#3b82f6", "#10b981"].map((color) => (
                <button
                  key={color}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // Simpan rentang kursor (selection) sebelum kehilangan fokus ke tombol
                    const selection = window.getSelection();
                    if (!selection || selection.rangeCount === 0) return;

                    const editor = document.getElementById("main-editor");
                    if (editor && !editor.contains(selection.anchorNode)) {
                      editor.focus();
                    }
                  }}
                  onClick={() => {
                    setFontColor(color);
                    document.execCommand("foreColor", false, color);
                  }}
                  className={`w-full aspect-square rounded-full border-2 transition-transform duration-200 ${fontColor === color
                    ? "border-zinc-400 dark:border-zinc-500 scale-110 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-700 hover:scale-105"
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <div
              className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 shadow-sm border border-zinc-200 dark:border-zinc-700 transition-transform hover:scale-105 ring-2 ring-transparent focus-within:ring-zinc-400"
              style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
            >
              <input
                type="color"
                value={fontColor}
                onMouseDown={(e) => {
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return;
                  const editor = document.getElementById("main-editor");
                  if (editor && !editor.contains(selection.anchorNode)) editor.focus();
                }}
                onChange={(e) => {
                  setFontColor(e.target.value);
                  const editor = document.getElementById("main-editor");
                  if (editor && document.activeElement !== editor) editor.focus();
                  document.execCommand("foreColor", false, e.target.value);
                }}
                className="absolute inset-[-10px] w-[300%] h-[300%] cursor-pointer opacity-0"
                title="Choose custom color"
              />
            </div>
          </div>
        </div>


        {/* Alignment */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Alignment</label>
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
            {[
              { id: "start", icon: AlignLeft },
              { id: "center", icon: AlignCenter },
              { id: "end", icon: AlignRight },
              { id: "justify", icon: AlignJustify }
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTextAlign(id)}
                className={`flex-1 py-1.5 rounded-md flex justify-center transition-colors ${textAlign === id
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50 dark:hover:bg-zinc-700/50 dark:hover:text-white"
                  }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Advanced */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Advanced</label>
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
            {[
              { id: "bold", icon: Bold, isActive: isBold },
              { id: "italic", icon: Italic, isActive: isItalic },
              { id: "underline", icon: Underline, isActive: isUnderline },
              { id: "strikeThrough", icon: Strikethrough, isActive: isStrikethrough }
            ].map(({ id, icon: Icon, isActive }) => (
              <button
                key={id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setAdvanced(id)}
                className={`flex-1 py-1.5 rounded-md flex justify-center transition-colors ${isActive
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50 dark:hover:bg-zinc-700/50 dark:hover:text-white"
                  }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
