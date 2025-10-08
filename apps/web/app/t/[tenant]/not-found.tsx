import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="flex items-center justify-center mb-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Tenant Not Found
            </h1>

            <p className="text-gray-600 mb-6">
              The tenant you&rsquo;re looking for doesn&rsquo;t exist or has
              been deactivated.
            </p>

            <div className="space-y-4">
              <Link
                href="/t/zo-system"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go to Default Store
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
            <p className="text-sm text-gray-500">
              Available tenants: wondernails, vigistudio, centro-tenistico,
              vainilla-vargas, delirios, nom-nom, zo-system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
