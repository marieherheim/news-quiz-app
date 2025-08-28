"use client";

import { useState } from "react";
import clsx from "clsx";

type HelpIconProps = {
  text: React.ReactNode;
  className?: string;
};

export default function HelpIcon({ text, className }: HelpIconProps) {
  const [hovered, setHovered] = useState(false);

   return (
    <div className={clsx("inline-block", className)}>
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-400 hover:border-gray-600 bg-white text-gray-800"
      >
        ?
      </button>

      {hovered && (
        <div className="absolute top-0 left-full ml-4 w-120 max-w-xs p-4 bg-white border border-gray-300 rounded-lg shadow-md text-sm text-gray-700">
          {text}
        </div>
      )}
    </div>
  );
}