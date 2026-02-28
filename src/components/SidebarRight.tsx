"use client";

import { motion } from "framer-motion";
import { Settings, Printer, Palette, Type, Layers } from "lucide-react";
import { useState } from "react";

export function SidebarRight() {
    const [fontWeight, setFontWeight] = useState(400);
    const [paperColor, setPaperColor] = useState("#ffffff");

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            className="fixed right-0 top-0 h-full w-72 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-l border-zinc-200 dark:border-zinc-800 p-6 z-40 hidden md:block pt-20"
        >
            <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-锌-100">Paper Settings</h2>
            </div>

            <div className="space-y-8">
                {/* Font Thickness */}
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

                {/* Color Settings */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5" /> Paper Color
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                        {["#ffffff", "#f8f9fa", "#fdf6e3", "#fcfcfc", "#f0f4f8"].map((color) => (
                            <button
                                key={color}
                                onClick={() => setPaperColor(color)}
                                className={`w-full aspect-square rounded-full border-2 transition-transform duration-200 ${paperColor === color
                                        ? "border-zinc-900 dark:border-white scale-110 shadow-sm"
                                        : "border-transparent border-zinc-200 dark:border-zinc-700 hover:scale-105"
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Paper Texture/Style (Placeholder) */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" /> Texture
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            Plain
                        </button>
                        <button className="py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
                            Grid
                        </button>
                    </div>
                </div>

                {/* Print Action */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-all font-medium text-sm shadow-md hover:shadow-lg active:scale-95">
                        <Printer className="w-4 h-4" />
                        Print Paper
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
