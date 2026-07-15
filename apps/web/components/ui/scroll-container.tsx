"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

interface ScrollContainerProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "vertical" | "horizontal" | "both";
  variant?: "default" | "dark";
  /** Hide scrollbar but keep scroll functionality. */
  hideScrollbar?: boolean;
}

/**
 * ScrollContainer — scrollable wrapper with consistent thin, rounded scrollbar.
 * ponytail: relies on global .custom-scrollbar / .custom-scrollbar-dark utilities.
 */
const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(
  (
    {
      direction = "vertical",
      variant = "default",
      hideScrollbar = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          hideScrollbar
            ? "scrollbar-hide"
            : variant === "dark"
              ? "custom-scrollbar-dark"
              : "custom-scrollbar",
          direction === "vertical" && "overflow-y-auto overflow-x-hidden",
          direction === "horizontal" && "overflow-x-auto overflow-y-hidden",
          direction === "both" && "overflow-auto",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollContainer.displayName = "ScrollContainer";

export { ScrollContainer };
export type { ScrollContainerProps };
