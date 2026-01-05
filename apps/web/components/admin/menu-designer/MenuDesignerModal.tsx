"use client";

import { useState, useEffect } from "react";
import MenuEditor from "./MenuEditor";
import ProductPanel from "./ProductPanel";
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
    // Implementación mejorada para generar PDF
    const printContent = document.querySelector(".ProseMirror");
    if (!printContent) {
      alert("No se pudo generar el PDF. Intente nuevamente.");
      return;
    }

    // Crear una ventana temporal para imprimir
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Permita las ventanas emergentes para generar el PDF.");
      return;
    }

    // Obtener el contenido HTML del editor
    const content = printContent.innerHTML;

    // Crear el HTML completo para imprimir
    const printDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentDesign?.name || "Menú"}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          h1 {
            font-family: Georgia, serif;
            color: #C5A059;
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1.5rem;
            margin-top: 0;
            border-bottom: 2px solid #C5A059;
            padding-bottom: 0.5rem;
          }
          h2 {
            font-family: Arial, sans-serif;
            color: #333;
            font-size: 1.8rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
            padding-bottom: 0.3rem;
            border-bottom: 1px solid #ddd;
          }
          h3 {
            font-family: Arial, sans-serif;
            color: #555;
            font-size: 1.4rem;
            font-weight: 500;
            font-style: italic;
            margin-top: 1.5rem;
            margin-bottom: 0.8rem;
          }
          p {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin-bottom: 1rem;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
          }
          table td, table th {
            border: none;
            padding: 0.5rem;
            vertical-align: top;
          }
          hr {
            border: none;
            height: 1px;
            background-color: #C5A059;
            margin: 1.5rem 0;
          }
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1rem auto;
            border-radius: 4px;
          }
          .product-node {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 0.75rem 1rem;
            margin: 0.5rem 0;
            background-color: #f9f9f9;
            border-left: 3px solid #C5A059;
            border-radius: 4px;
            position: relative;
          }
          .product-node .product-name {
            font-weight: 600;
            font-size: 1.1rem;
            color: #333;
            flex: 1;
            margin-right: 1rem;
          }
          .product-node .product-price {
            font-weight: 700;
            color: #C5A059;
            font-size: 1.1rem;
            white-space: nowrap;
          }
          .product-node .product-description {
            font-size: 0.85rem;
            color: #666;
            font-style: italic;
            margin-top: 0.25rem;
            width: 100%;
          }
          .product-node.with-image {
            display: grid;
            grid-template-columns: 80px 1fr auto;
            gap: 1rem;
            align-items: center;
          }
          .product-node .product-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #eee;
          }
          @media print {
            body {
              margin: 0;
              padding: 15mm;
            }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printDocument);
    printWindow.document.close();
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
                  <h4 className="font-medium mb-3 text-sm">
                    Productos y Servicios
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Arrastra productos y servicios al menú
                  </p>
                  <div className="h-64 overflow-y-auto">
                    <ProductPanel tenantSlug={tenantSlug} />
                  </div>
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
