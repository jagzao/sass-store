"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tenant page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="flex items-center justify-center mb-6">
            <div className="text-6xl text-red-500">⚠️</div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>

            <p className="text-gray-600 mb-6">
              There was an error loading this tenant page. This could be due to:
            </p>

            <ul className="text-left text-sm text-gray-500 mb-6 space-y-2">
              <li>• Invalid tenant configuration</li>
              <li>• Database connectivity issues</li>
              <li>• Missing tenant data</li>
            </ul>

            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span className="mr-2">🔄</span>
                Try Again
              </button>

              <a
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go Home
              </a>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 text-center">
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 text-left bg-gray-50 p-3 rounded border">
                  <p>
                    <strong>Message:</strong> {error.message}
                  </p>
                  {error.digest && (
                    <p>
                      <strong>Digest:</strong> {error.digest}
                    </p>
                  )}
                  <pre className="mt-2 whitespace-pre-wrap text-xs">
                    {error.stack}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
