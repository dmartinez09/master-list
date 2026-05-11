import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Tooltip({ content, children, maxWidth = 280 }: TooltipProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none fade-in"
          style={{ width: maxWidth, minWidth: 160 }}
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
