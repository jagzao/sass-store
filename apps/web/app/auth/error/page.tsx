"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: { [key: string]: string } = {
    TenantMismatch: "You are trying to access a different tenant. Please log in to the correct tenant.",
    Default: "An authentication error occurred. Please try again.",
  };

  const message = error && errorMessages[error] ? errorMessages[error] : errorMessages.Default;

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700 mb-4">{message}</p>
        <Link
          href="/"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}