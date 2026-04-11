"use client";

import React from "react";
import { motion } from "framer-motion";

interface PoketChakSpeechBubbleProps {
  children: React.ReactNode;
  className?: string;
  variant?: "top" | "bottom" | "left" | "right";
}

export const PoketChakSpeechBubble: React.FC<PoketChakSpeechBubbleProps> = ({ 
  children, 
  className = "",
  variant = "bottom" 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`relative inline-flex items-center justify-center p-6 ${className}`}
    >
      {/* Hand-drawn SVG Background */}
      <svg
        className="absolute inset-0 w-full h-full -z-10"
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="drop-shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
          d="
            M 8,6 
            C 40,4 80,8 120,5 
            C 160,3 192,7 194,10 
            C 197,30 193,50 196,70 
            C 180,74 140,71 115,72 
            L 110,78 
            L 100,72 
            C 60,74 20,71 6,68 
            C 3,50 7,30 4,10 
            C 5,7 6,6 8,6 
            Z
          "
          fill="white"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Content */}
      <div className="font-pixel text-[13px] text-black leading-tight whitespace-nowrap px-2">
        {children}
      </div>
    </motion.div>
  );
};
