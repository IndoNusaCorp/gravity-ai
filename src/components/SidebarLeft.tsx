"use client";

import { motion } from "framer-motion";
import { Settings, Type, List, AlignLeft, AlignCenter, AlignRight, AlignJustify, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function SidebarLeft() {
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Inter");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        {/* Alignment */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Alignment</label>
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
            {[AlignLeft, AlignCenter, AlignRight, AlignJustify].map((Icon, i) => (
              <button key={i} className="flex-1 py-1.5 rounded-md flex justify-center hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors hover:shadow-sm">
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
