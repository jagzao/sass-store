"use client";

import { useEffect, useState } from "react";

const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Hook to get the CSRF token for making protected requests
 * The token is automatically included in the initial page load response headers
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    // Try to get the token from a meta tag (set by the server)
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      const token = metaTag.getAttribute("content");
      if (token) {
        setCsrfToken(token);
        return;
      }
    }

    // If not in meta tag, fetch it from the server
    fetch("/api/csrf-token")
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setCsrfToken(data.token);
        }
      })
      .catch((err) => {
        // SECURITY: Redacted sensitive log;
      });
  }, []);

  /**
   * Get headers object with CSRF token included
   */
  const getCsrfHeaders = () => {
    if (!csrfToken) {
      // SECURITY: Redacted sensitive log;
      return {};
    }

    return {
      [CSRF_HEADER_NAME]: csrfToken,
    };
  };

  /**
   * Make a fetch request with CSRF token automatically included
   */

  const csrfFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);

    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return {
    csrfToken,
    getCsrfHeaders,
    csrfFetch,
  };
}
