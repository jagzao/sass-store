"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  image?: string;
  category?: string;
  primaryColor: string;
  tenantSlug: string;
  metadata?: any;
  onBook?: (serviceId: string) => void;
}

export default function ServiceCard({
  id,
  name,
  description,
  price,
  duration,
  image,
  category,
  primaryColor,
  tenantSlug,
  metadata,
  onBook
}: ServiceCardProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleReservarAhora = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBook) {
      onBook(id);
    }
    router.push(`/t/${tenantSlug}/booking/new?service=${id}`);
  };

  const handleImageClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl border border-gray-100 transition-shadow">
        {/* Image - clickable for details */}
        <div
          className="p-6 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleImageClick}
        >
          <div className="text-5xl mb-4 text-center" role="img" aria-label={`Imagen de ${name}`}>
            {image || metadata?.image || '⭐'}
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900">{name}</h3>
          <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>

          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                ${price}
              </span>
              <span className="text-sm text-gray-500 ml-2">MXN</span>
            </div>
            {duration && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {duration} min
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          <button
            onClick={handleReservarAhora}
            className="w-full py-3 px-6 rounded-lg text-white font-semibold hover:opacity-90 shadow-md transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Reservar Ahora
          </button>
        </div>
      </div>

      {/* Service Detail Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="float-right text-gray-600 hover:text-gray-600 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>

              <div className="text-7xl mb-6 text-center" role="img" aria-label={`Imagen de ${name}`}>
                {image || metadata?.image || '⭐'}
              </div>

              <h2 className="text-3xl font-bold mb-4">{name}</h2>

              <div className="mb-6 flex items-center gap-4">
                <div>
                  <span className="text-4xl font-bold" style={{ color: primaryColor }}>
                    ${price}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">MXN</span>
                </div>
                {duration && (
                  <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full">
                    {duration} minutos
                  </span>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </div>

              {metadata && Object.keys(metadata).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Detalles del Servicio</h3>
                  <dl className="grid grid-cols-2 gap-3">
                    {Object.entries(metadata).map(([key, value]) => (
                      key !== 'image' && (
                        <div key={key}>
                          <dt className="text-sm font-medium text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </dt>
                          <dd className="text-sm text-gray-900">{String(value)}</dd>
                        </div>
                      )
                    ))}
                  </dl>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleReservarAhora}
                className="w-full py-4 px-6 rounded-lg text-white font-bold hover:opacity-90 transition-opacity shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
