"use client";

import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
};

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="flex items-center justify-center mb-6">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Error
            </h1>

            <p className="text-gray-600 mb-6">{message}</p>

            <div className="space-y-4">
              <Link
                href="/t/zo-system/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </Link>

              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go Home
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <details className="text-sm text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                Error Details
              </summary>
              <div className="mt-2 text-left bg-gray-50 p-3 rounded border">
                <p>
                  <strong>Error:</strong> {error}
                </p>
                <p>
                  <strong>URL:</strong> {window.location.href}
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
