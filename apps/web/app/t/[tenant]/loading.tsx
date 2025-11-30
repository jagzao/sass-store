import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col justify-center items-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Cargando...</h2>
        <p className="text-gray-400">Preparando tu experiencia...</p>
      </div>
    </div>
  );
}
