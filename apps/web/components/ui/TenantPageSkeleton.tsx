'use client';

export default function TenantPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <div className="w-24 h-6 bg-gray-300 rounded"></div>
            </div>
            <div className="flex space-x-6">
              <div className="w-16 h-6 bg-gray-300 rounded"></div>
              <div className="w-16 h-6 bg-gray-300 rounded"></div>
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Skeleton */}
      <div className="pt-16">
        <div className="w-full h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Text content skeleton */}
              <div className="space-y-6">
                <div className="w-32 h-8 bg-gray-700 rounded"></div>
                <div className="space-y-4">
                  <div className="w-full h-16 bg-gray-700 rounded"></div>
                  <div className="w-3/4 h-12 bg-gray-700 rounded"></div>
                  <div className="w-1/2 h-8 bg-gray-700 rounded"></div>
                </div>
                <div className="flex gap-4">
                  <div className="w-32 h-12 bg-gray-600 rounded-full"></div>
                  <div className="w-32 h-12 bg-gray-600 rounded-full"></div>
                </div>
              </div>

              {/* Image area skeleton */}
              <div className="relative">
                <div className="w-full aspect-square bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-12">
        {/* Title skeleton */}
        <div className="w-64 h-12 bg-gray-300 rounded mx-auto mb-8"></div>

        {/* Products/Services grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4">
              <div className="w-full aspect-square bg-gray-300 rounded mb-4"></div>
              <div className="w-3/4 h-6 bg-gray-300 rounded mb-2"></div>
              <div className="w-1/2 h-4 bg-gray-300 rounded mb-2"></div>
              <div className="w-20 h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>

        {/* Contact section skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-12">
          <div className="w-48 h-8 bg-gray-300 rounded mx-auto mb-8"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="w-32 h-6 bg-gray-300 rounded"></div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-300 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
                <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-32 h-6 bg-gray-300 rounded"></div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-300 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}