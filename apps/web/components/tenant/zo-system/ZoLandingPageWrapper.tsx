"use client";

import { useEffect } from "react";

interface ZoLandingPageWrapperProps {
  children: React.ReactNode;
}

export function ZoLandingPageWrapper({ children }: ZoLandingPageWrapperProps) {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = `${e.clientX}px`;
      const y = `${e.clientY}px`;
      document.documentElement.style.setProperty("--mouse-x", x);
      document.documentElement.style.setProperty("--mouse-y", y);
      document.body.style.setProperty("--mouse-x", x);
      document.body.style.setProperty("--mouse-y", y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return <>{children}</>;
}
