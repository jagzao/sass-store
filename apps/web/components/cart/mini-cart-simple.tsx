'use client';

export function MiniCartSimple() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🛒</span>
          <span className="text-sm font-medium">Cart (0)</span>
        </div>
      </div>
    </div>
  );
}