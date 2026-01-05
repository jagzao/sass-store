"use client";

import { useState, useEffect } from "react";
import MenuEditor from "./MenuEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Assuming UI components exist or using raw divs if not
// Using raw overlay for consistency with the existing AdminServicesPage modal style if needed,
// or standard Shadcn/Radix if available. Since checking the codebase earlier showed raw manual modals, I'll stick to a similar pattern or a clean portal.

interface MenuDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
}

export default function MenuDesignerModal({
  isOpen,
  onClose,
  tenantSlug,
}: MenuDesignerModalProps) {
  const [designs, setDesigns] = useState<any[]>([]);
  const [currentDesign, setCurrentDesign] = useState<any>(null); // If null, showing list. If set, showing editor.
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load designs list
  useEffect(() => {
    if (isOpen && !currentDesign) {
      loadDesigns();
    }
  }, [isOpen, currentDesign]);

  const loadDesigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/menu-designs`);
      if (res.ok) {
        const data = await res.json();
        setDesigns(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newDesign = {
      name: `Nuevo Menú ${new Date().toLocaleDateString()}`,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1, textAlign: "center" },
            content: [{ type: "text", text: "Menú Especial" }],
          },
        ],
      },
      isNew: true,
    };
    setCurrentDesign(newDesign);
  };

  const handleSave = async (content: any) => {
    setIsSaving(true);
    try {
      const url = currentDesign.id
        ? `/api/tenants/${tenantSlug}/menu-designs/${currentDesign.id}`
        : `/api/tenants/${tenantSlug}/menu-designs`;

      const method = currentDesign.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentDesign.name,
          content,
          templateId: "chalkboard",
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setCurrentDesign(saved); // Update with ID if it was new
        alert("Diseño guardado correctamente");
      }
    } catch (e) {
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    window.print(); // Simple version for MVP, or use html2pdf logic here
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4">
            {currentDesign && (
              <button
                onClick={() => setCurrentDesign(null)}
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
              >
                ← Volver
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentDesign ? currentDesign.name : "Mis Diseños de Menú"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-black p-4">
          {!currentDesign ? (
            // LIST MODE
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Create New Card */}
              <button
                onClick={handleCreateNew}
                className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group bg-white"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">+</span>
                </div>
                <span className="font-medium text-gray-600 group-hover:text-blue-600">
                  Crear Nuevo Diseño
                </span>
              </button>

              {/* Designs List */}
              {loading ? (
                <div className="col-span-full text-center py-10">
                  Cargando diseños...
                </div>
              ) : (
                designs.map((design) => (
                  <div
                    key={design.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-64 border border-gray-200 cursor-pointer"
                    onClick={() => setCurrentDesign(design)}
                  >
                    <div className="flex-1 bg-gray-800 relative flex items-center justify-center">
                      <span className="text-white text-xs opacity-50">
                        Vista previa
                      </span>
                      {/* Thumbnail logic would go here */}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {design.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Modificado:{" "}
                        {new Date(design.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // EDITOR MODE
            <div className="h-full flex gap-4">
              <div className="flex-1 h-full shadow-lg">
                <MenuEditor
                  initialContent={currentDesign.content}
                  onChange={(content) => {
                    // Can debounce save here or just store in ref for Save button usage
                    currentDesign.content = content;
                  }}
                />
              </div>

              {/* Sidebar Controls */}
              <div className="w-64 bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-800 h-full overflow-y-auto">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nombre del Diseño
                  </label>
                  <input
                    value={currentDesign.name}
                    onChange={(e) =>
                      setCurrentDesign({
                        ...currentDesign,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium mb-3 text-sm">Productos</h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Arrastra productos al menú (Próximamente)
                  </p>
                  {/* List services here to drag and drop */}
                </div>

                <div className="pt-4 border-t border-gray-200 mt-auto">
                  <button
                    onClick={() => handleSave(currentDesign.content)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg mb-3 hover:bg-blue-700 transition font-medium"
                    disabled={isSaving}
                  >
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <span>📥</span> Descargar PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
