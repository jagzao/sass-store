"use client";

/**
 * NavGridItem Component
 *
 * Individual navigation item with emoji icon and gold hover effect.
 * Glassmorphism card styling.
 */

export interface NavGridItemProps {
  /** Emoji icon */
  emoji: string;
  /** Label text */
  label: string;
  /** Navigation href */
  href: string;
  /** Whether this item requires authorization */
  authProtected?: boolean;
  /** Optional description */
  description?: string;
  /** Whether this is an external link */
  external?: boolean;
}

/**
 * Individual navigation grid item with gold hover effect
 */
export default function NavGridItem({
  emoji,
  label,
  href,
  authProtected = false,
  description,
  external = false,
}: NavGridItemProps) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <a
      href={href}
      {...linkProps}
      className={`flex flex-col h-full p-4 rounded-xl border transition-all duration-300 group overflow-hidden
        ${
          authProtected
            ? "bg-[#E6E6FA]/10 border-[#C5A059]/10 hover:border-[#C5A059]/30"
            : "bg-white border-[#C5A059]/20 hover:border-[#C5A059]"
        }
        hover:shadow-lg hover:shadow-[#C5A059]/5
        ${authProtected ? "opacity-80 hover:opacity-100" : ""}
      `}
    >
      {/* Emoji Icon */}
      <span
        className="text-3xl mb-2 block transition-transform duration-200 
                    group-hover:scale-110 flex-shrink-0"
      >
        {emoji}
      </span>

      {/* Label */}
      <span
        className="font-medium text-gray-800 group-hover:text-[#C5A059] 
                    transition-colors block flex-shrink-0"
      >
        {label}
      </span>

      {/* Description */}
      {description && (
        <span className="text-xs text-gray-400 mt-1 block flex-1">{description}</span>
      )}

      {/* Auth Protected Badge */}
      {authProtected && (
        <span
          className="text-xs text-gray-400 mt-2 flex items-center gap-1
                      group-hover:text-[#C5A059] transition-colors"
        >
          <span>🔒</span>
          <span>Requiere autorización</span>
        </span>
      )}

      {/* External Link Indicator */}
      {external && (
        <span
          className="text-xs text-gray-400 mt-2 flex items-center gap-1
                      group-hover:text-[#C5A059] transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <span>Enlace externo</span>
        </span>
      )}
    </a>
  );
}
