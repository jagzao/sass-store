"use client";

import React, { useEffect, useRef, useState } from "react";

interface CircuitSpotlightProps {
  children?: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export const CircuitSpotlight: React.FC<CircuitSpotlightProps> = ({
  children,
  className = "",
  spotlightColor = "rgba(255, 128, 0, 0.15)", // Orange-ish spotlight default
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const div = containerRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full overflow-hidden bg-[#0D0D0D] ${className}`}
    >
      {/* Circuit Pattern Layer (Visible only via Spotlight) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: opacity,
          background: `
            radial-gradient(
              600px circle at ${position.x}px ${position.y}px,
              ${spotlightColor},
              transparent 40%
            ),
            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L20 10 L20 20 L30 20 M50 50 L50 60 L60 60' stroke='%23333' stroke-width='1' fill='none'/%3E%3Ccircle cx='20' cy='20' r='2' fill='%23333'/%3E%3C/svg%3E")
          `,
          backgroundBlendMode: "screen", // Blend the gradient with the pattern
        }}
      />

      {/* Alternative implementation: A fixed pattern layer with a mask image */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23333333' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          maskImage: `radial-gradient(600px circle at ${position.x}px ${position.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(600px circle at ${position.x}px ${position.y}px, black, transparent)`,
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
