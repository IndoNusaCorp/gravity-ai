"use client";

import { motion } from "framer-motion";
import { Settings, Type, List, AlignLeft, AlignCenter, AlignRight, AlignJustify, Moon, Sun, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function SidebarLeft() {
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState(400);
  const [textAlign, setTextAlign] = useState("left");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [fontColor, setFontColor] = useState("#000000");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Inject typography CSS variables to be consumed by the paper
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--editor-font-family', fontFamily === "Times New Roman" ? "serif" : fontFamily);
    document.documentElement.style.setProperty('--editor-font-weight', fontWeight.toString());
    document.documentElement.style.setProperty('--editor-text-align', textAlign);
  }, [fontSize, fontFamily, fontWeight, textAlign]);

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

  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-color', fontColor);
  }, [fontColor]);

  const handleFontColorChange = (color: string) => {
    setFontColor(color);
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed left-0 top-0 h-full w-72 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800 p-6 z-40 hidden md:block pt-20"
    >
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Type className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-锌-100">Text Features</h2>
      </div>

      <div className="space-y-8">
        {/* Font Family Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Typography</label>
          <div className="grid grid-cols-1 gap-2">
            {["Inter", "Times New Roman", "Geist", "Georgia"].map((font) => (
              <button
                key={font}
                onClick={() => setFontFamily(font)}
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
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Size</label>
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
                  onClick={() => setFontColor(color)}
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
                onChange={(e) => setFontColor(e.target.value)}
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

        {/* Theme Toggle */}
        <div className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Appearance</label>
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 py-1.5 rounded-md flex justify-center items-center gap-2 transition-all ${mounted && theme === "light"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/50"
                }`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-xs font-medium">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 py-1.5 rounded-md flex justify-center items-center gap-2 transition-all ${mounted && theme === "dark"
                ? "bg-zinc-700 text-white shadow-sm dark:bg-zinc-700"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/50"
                }`}
            >
              <Moon className="w-4 h-4" />
              <span className="text-xs font-medium">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
