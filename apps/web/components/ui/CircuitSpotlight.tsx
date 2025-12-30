"use client";

import React, { useEffect, useState } from "react";

export const CircuitSpotlight = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#0D0D0D]">
      {/* Circuit Pattern Background Layer */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h10v10h-10zM30 10h50v10h-50zM10 30h10v50h-10zM30 30h50v10h-50zM30 50h50v10h-50zM30 70h50v10h-50z' fill='%23FF8000' fill-opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
        }}
      />

      {/* SVG Circuit Lines - More detailed visual overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern
          id="circuit-pattern"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20 20 L80 20 L80 80 L20 80 Z"
            fill="none"
            stroke="#FF8000"
            strokeWidth="0.5"
          />
          <circle cx="20" cy="20" r="2" fill="#FF8000" />
          <circle cx="80" cy="20" r="2" fill="#FF8000" />
          <circle cx="80" cy="80" r="2" fill="#FF8000" />
          <circle cx="20" cy="80" r="2" fill="#FF8000" />
          <path
            d="M50 0 V100 M0 50 H100"
            stroke="#FF8000"
            strokeWidth="0.2"
            opacity="0.5"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>

      {/* Spotlight Mask Layer - The "Darkness" that hides the circuits except where mouse is */}
      <div
        className="absolute inset-0 bg-[#0D0D0D]"
        style={{
          maskImage: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, black 80%)`,
          WebkitMaskImage: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, black 80%)`,
        }}
      />

      {/* Optional: Subtle global glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,128,0,0.05),transparent_70%)]" />
    </div>
  );
};
