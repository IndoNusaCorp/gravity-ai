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
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed left-1/2 -translate-x-1/2 top-2 md:top-4 w-[95%] md:w-[90%] max-w-6xl h-14 md:h-16 bg-white/40 dark:bg-[#0D0606]/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl px-2 md:px-4 z-40 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
    >
      <div className="flex items-center gap-6 overflow-x-auto w-full scrollbar-hide h-full py-2">
        {/* Font Family Selection */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-[#0D0606] dark:text-[#D9E4D1] mr-1">FONT</label>
          <div className="flex items-center gap-1 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 p-1 rounded-lg">
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
                className={`px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${fontFamily === font
                  ? "bg-[#0D0606] text-[#D9E4D1] dark:bg-[#D9E4D1] dark:text-[#0D0606] font-bold shadow-sm"
                  : "text-[#0D0606] dark:text-[#D9E4D1] hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10"
                  }`}
                style={{ fontFamily: font === "Times New Roman" ? "serif" : "inherit" }}
              >
                {font}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 shrink-0"></div>

        {/* Font Size Slider */}
        <div className="flex items-center gap-3 shrink-0 w-36">
          <label className="text-xs font-bold text-[#0D0606] dark:text-[#D9E4D1] w-14">SIZE: {fontSize}</label>
          <input
            type="range"
            min="12"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full h-1.5 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 rounded-lg appearance-none cursor-pointer accent-[#0D0606] dark:accent-[#D9E4D1]"
          />
        </div>

        <div className="w-px h-8 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 shrink-0"></div>

        {/* Font Thickness */}
        <div className="flex items-center gap-3 shrink-0 w-36">
          <label className="text-xs font-bold text-[#0D0606] dark:text-[#D9E4D1] flex items-center gap-1 w-14">
            <Type className="w-3.5 h-3.5" /> {fontWeight}
          </label>
          <input
            type="range"
            min="100"
            max="900"
            step="100"
            value={fontWeight}
            onChange={(e) => setFontWeight(Number(e.target.value))}
            className="w-full h-1.5 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 rounded-lg appearance-none cursor-pointer accent-[#0D0606] dark:accent-[#D9E4D1]"
          />
        </div>

        <div className="w-px h-8 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 shrink-0"></div>

        {/* Font color*/}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-[#0D0606] dark:text-[#D9E4D1] flex items-center gap-1">
            <Palette className="w-3.5 h-3.5" />
          </label>
          <div className="flex items-center gap-1.5">
            {["#000000", "#52525b", "#ef4444", "#3b82f6", "#10b981"].map((color) => (
              <button
                key={color}
                onMouseDown={(e) => {
                  e.preventDefault();
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
                className={`w-6 h-6 rounded-full border-2 transition-transform duration-200 ${fontColor === color
                  ? "border-[#0D0606] dark:border-[#D9E4D1] scale-110 shadow-sm"
                  : "border-transparent hover:scale-105"
                  }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="w-px h-5 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 mx-1"></div>
            <div
              className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-transparent focus-within:border-[#0D0606] dark:focus-within:border-[#D9E4D1] transition-transform hover:scale-105"
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

        <div className="w-px h-8 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 shrink-0"></div>


        {/* Alignment */}
        <div className="flex items-center gap-1 shrink-0 p-1 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 rounded-lg">
          {[
            { id: "start", icon: AlignLeft },
            { id: "center", icon: AlignCenter },
            { id: "end", icon: AlignRight },
            { id: "justify", icon: AlignJustify }
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTextAlign(id)}
              className={`p-2 rounded-md flex justify-center transition-colors ${textAlign === id
                ? "bg-[#0D0606] text-[#D9E4D1] dark:bg-[#D9E4D1] dark:text-[#0D0606] shadow-sm"
                : "text-[#0D0606] dark:text-[#D9E4D1] hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10"
                }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 shrink-0"></div>

        {/* Advanced */}
        <div className="flex items-center gap-1 shrink-0 p-1 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 rounded-lg">
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
              className={`p-2 rounded-md flex justify-center transition-colors ${isActive
                ? "bg-[#0D0606] text-[#D9E4D1] dark:bg-[#D9E4D1] dark:text-[#0D0606] shadow-sm"
                : "text-[#0D0606] dark:text-[#D9E4D1] hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10"
                }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
