"use client";

import { useServerInsertedHTML } from "next/navigation";
import {
  hexToHSLComponents,
  getContrastingForegroundHSL,
} from "@/lib/theme/theme-system";

interface TenantStylesProps {
  isWondernails: boolean;
  isZoSystem: boolean;
  primaryColor?: string;
}

export function TenantStyles({
  isWondernails,
  isZoSystem,
  primaryColor = "#059669",
}: TenantStylesProps) {
  // ponytail: centro-tenistico primary is too light for the dark body foreground (#1F2937).
  // Fall back to a darker terracotta so bg-primary/text-primary-foreground pass WCAG AA.
  const safePrimaryColor =
    primaryColor?.toLowerCase() === "#b85c38" ? "#8B3A1F" : primaryColor;
  const primaryHSL = hexToHSLComponents(safePrimaryColor);
  const primaryForegroundHSL = getContrastingForegroundHSL(safePrimaryColor);

  // Widget panel headings must always respect primary-foreground, never tenant heading overrides.
  const widgetHeadingOverride = `
    [data-testid="feedback-widget-panel"] h3 {
      color: hsl(var(--primary-foreground)) !important;
    }
  `;

  const css = isWondernails
    ? `
          /* 1. FIX THE MODAL */
          .modal-content, .modal-body, [role="dialog"], .dialog-container {
              background-color: #F8F9FA !important;
              background: #F8F9FA !important;
              color: #333333 !important; /* Force text to dark gray */
          }

          /* 2. NEUTRALIZE THE SLIDES (Kill Black & Cream) */
          /* Target: Every single slide in the Hero Carousel */
          .swiper-slide, .carousel-item, [class*="slide-"] {
              background-color: transparent !important;
              background: transparent !important;
          }

          /* Force the CARD inside the slide to be White Glass */
          .swiper-slide > div, .carousel-item > div, .hero-card {
              background: rgba(255, 255, 255, 0.75) !important;
              backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(197, 160, 89, 0.2) !important;
              box-shadow: 0 10px 40px rgba(160, 130, 180, 0.15) !important; /* Lilac Shadow */
          }

          /* 1. Ensure the body handles the base off-white color */
          body {
              background-color: #F8F9FA !important;
              position: relative; /* Needed for absolute positioning context if not fixed */
          }

          /* 2. Create the Spotlight Layer using ::before */
          body::before {
              content: "";
              position: fixed; /* Stays in place while scrolling */
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              z-index: -1; /* Puts it BEHIND everything */
              
              /* THE LILAC GLOW GRADIENT */
              /* Increased opacity slightly to ensure visibility against white */
              background: radial-gradient(
                  circle at 50% 30%,
                  rgba(200, 160, 255, 0.25) 0%, /* Visible Soft Lilac */
                  rgba(255, 255, 255, 0) 60%   /* Fade to transparent */
              );
              pointer-events: none; /* Let clicks pass through */
          }

          /* 3. CRITICAL: Force App Wrappers to be Transparent */
          /* This ensures the body::before layer can be seen through the app containers */
          #root, #app, .main-wrapper, [data-tenant-hero="wondernails"] {
              background-color: transparent !important;
              background: transparent !important;
          }

          /* 3. FIX TEXT CONTRAST (Invisible Text Fix) */
          /* Force Text Colors on the new White Backgrounds */
          [class*="card"] h1, [class*="card"] h2, [class*="card"] .title {
              color: #C5A059 !important; /* Bronze Gold */
          }
          [class*="card"] p, [class*="card"] span, [class*="card"] div {
              color: #333333 !important; /* Charcoal Gray */
          }
          
          /* Additional Helpers to ensure consistency */
          /* ponytail: valid HSL values; previous raw RGB broke Shadcn token rendering.
             Primary is computed from tenant color so bg-primary/text-primary-foreground stay accessible. */
          :root {
            --background: 0 0% 97%;
            --foreground: 0 0% 20%;
            --primary: ${primaryHSL};
            --primary-foreground: ${primaryForegroundHSL};
            --color-primary: ${safePrimaryColor};
          }

          h1, h2, h3, h4, h5, h6 {
            color: #C5A059 !important;
          }

          p, span, div, li {
             color: #333333;
          }

          ${widgetHeadingOverride}

          .btn-primary, button[type="submit"] {
            background-color: ${safePrimaryColor} !important;
            color: hsl(var(--primary-foreground)) !important;
            border: none !important;
          }
          
          /* Fix for modal background - ensure modals have bone white background */
          .modal, .modal-content, [role="dialog"], .dialog-panel, .ReactModal__Content {
            background-color: #F8F9FA !important;
            background: #F8F9FA !important;
          }
          
          /* Override bg-primary for modals specifically */
          .bg-primary.modal, .bg-primary.modal-content, .bg-primary[role="dialog"], .bg-primary.dialog-panel, .bg-primary.ReactModal__Content {
            background-color: #F8F9FA !important;
            background: #F8F9FA !important;
          }
        `
    : isZoSystem
      ? `
          /* Zo Systems — premium dark palette */
          /* ponytail: valid HSL values; previous raw numbers were invalid HSL. */
          :root {
            --background: 240 5% 3%;
            --foreground: 0 0% 96%;
            --primary: ${primaryHSL};
            --primary-foreground: ${primaryForegroundHSL};
            --font-sans: var(--font-montserrat), ui-sans-serif, system-ui, sans-serif;
          }

          body {
            background-color: #070708 !important;
            color: #f5f5f7 !important;
            overflow-x: hidden !important;
          }

          /* Keep headings neutral; components set their own typography */
          h1, h2, h3, h4, h5, h6 {
            color: inherit !important;
          }
        `
      : `
          /* Default tenant styles — uses tenant's actual primary color */
          body {
            background-color: #F9FAFB !important;
            color: #1F2937 !important;
          }

          [class*="card"] {
            background: white !important;
            border: 1px solid #E5E7EB !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          /* ponytail: valid HSL; previous raw RGB broke Shadcn tokens (#F9FAFB -> 180° cyan).
             primary is HSL-ified from the tenant hex so bg-primary/text-primary-foreground stay accessible. */
          :root {
            --background: 220 14% 96%;
            --foreground: 220 14% 20%;
            --primary: ${primaryHSL};
            --primary-foreground: ${primaryForegroundHSL};
            --color-primary: ${safePrimaryColor};
          }

          h1, h2, h3, h4, h5, h6 {
            color: #1F2937 !important;
          }

          p, span, div, li {
            color: #374151;
          }

          ${widgetHeadingOverride}

          .btn-primary, button[type="submit"], .bg-primary {
            background-color: ${safePrimaryColor} !important;
            color: hsl(var(--primary-foreground)) !important;
            border: none !important;
          }

          .text-primary {
            color: ${safePrimaryColor} !important;
          }

          /* Modals use neutral border, not wondernails gold */
          [role="dialog"],
          .modal,
          .modal-content,
          .ReactModal__Content,
          .dialog-panel {
            background-color: #FFFFFF !important;
            border: 1px solid #E5E7EB !important;
          }
        `;

  // Use useServerInsertedHTML to ensure styles are injected correctly in the head/stream
  // avoiding hydration mismatches due to body placement
  useServerInsertedHTML(() => {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html: css,
        }}
      />
    );
  });

  return null;
}
