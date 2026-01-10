"use client";

import React, { useState, memo } from "react";
import { useRouter } from "next/navigation";
import CreateQuoteButton from "../quotes/CreateQuoteButton";

export interface ServiceMetadata {
  image?: string;
  category?: string;
  [key: string]: any;
}

export interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  duration?: number;
  image?: string;
  beforeImage?: string;
  afterImage?: string;
  category?: string;
  primaryColor: string;
  tenantSlug: string;
  metadata?: ServiceMetadata;
  onBook?: (serviceId: string) => void;
  variant?: "default" | "luxury" | "tech";
  isAdmin?: boolean;
}

const ServiceCard = memo(
  ({
    id,
    name,
    description,
    shortDescription,
    longDescription,
    price,
    duration,
    image,
    beforeImage,
    afterImage,
    category,
    primaryColor,
    tenantSlug,
    metadata,
    onBook,
    variant = "default",
    isAdmin = false,
  }: ServiceCardProps) => {
    // ... existing hook logic

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

    const isLuxury = variant === "luxury";
    const isTech = variant === "tech";

    // Validate if image is a valid URL (not an emoji or other text)
    const isValidImageUrl = (url?: string) => {
      if (!url) return false;
      return (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/")
      );
    };

    const validImage = isValidImageUrl(image) ? image : undefined;
    const validMetadataImage = isValidImageUrl(metadata?.image as string)
      ? (metadata?.image as string)
      : undefined;
    const imageUrl = validImage || validMetadataImage;

    return (
      <>
        <div
          data-testid="service-card"
          className={`rounded-xl overflow-hidden transition-all duration-300 ${
            isLuxury
              ? "bg-white/70 backdrop-blur-md border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)]"
              : isTech
                ? "bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#FF8000]/50 hover:shadow-[0_0_15px_rgba(255,128,0,0.15)]"
                : "bg-white shadow-lg hover:shadow-xl border border-gray-100"
          }`}
        >
          {/* Image - clickable for details */}
          <div
            className="p-6 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleImageClick}
          >
            {/* Before/After Images */}
            {(beforeImage || afterImage) && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {beforeImage && (
                  <div className="relative">
                    <div className="text-xs text-gray-500 mb-1">Antes</div>
                    <img
                      src={beforeImage}
                      alt={`${name} - Antes`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                  </div>
                )}
                {afterImage && (
                  <div className="relative">
                    <div className="text-xs text-gray-500 mb-1">Después</div>
                    <img
                      src={afterImage}
                      alt={`${name} - Después`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            )}

            <div
              className="mb-4 text-center"
              role="img"
              aria-label={`${name} - Servicio de ${category || "belleza"} por $${price} MXN. ${description}`}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-48 object-cover rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-5xl">{isLuxury ? "" : "⭐"}</div>
              )}
            </div>
            <h3
              className={`text-xl font-bold mb-3 ${isLuxury ? "text-[#D4AF37] font-serif tracking-wide" : isTech ? "text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase" : "text-gray-900"}`}
            >
              {name}
            </h3>
            <p
              className={`mb-4 line-clamp-2 ${isLuxury ? "text-gray-600 font-normal" : isTech ? "text-gray-400" : "text-gray-600"}`}
            >
              {shortDescription || description}
            </p>

            <div className="flex items-center justify-between mb-6">
              <div>
                <span
                  className={`text-3xl font-bold ${isLuxury ? "text-[#333333]" : isTech ? "text-[#FF8000]" : ""}`}
                  style={
                    !isLuxury && !isTech ? { color: primaryColor } : undefined
                  }
                >
                  ${price}
                </span>
                <span className="text-sm text-gray-500 ml-2">MXN</span>
              </div>
              {duration && (
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    isLuxury
                      ? "text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20"
                      : isTech
                        ? "text-[#EAFF00] bg-white/5 border border-white/10"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {duration} min
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleReservarAhora}
              className={`w-full py-3 px-6 rounded-lg font-semibold hover:opacity-90 shadow-md transition-opacity ${
                isLuxury
                  ? "text-[#121212]"
                  : isTech
                    ? "bg-gradient-to-r from-[#FF8000] to-[#FF5500] text-black hover:shadow-[0_0_20px_rgba(255,128,0,0.4)] rounded-full border-none"
                    : "text-white"
              }`}
              style={{
                backgroundColor: isLuxury
                  ? "#D4AF37"
                  : isTech
                    ? undefined
                    : primaryColor,
              }}
              data-testid="reservar-ahora-button"
            >
              Reservar Ahora
            </button>

            {isAdmin && (
              <CreateQuoteButton
                serviceId={id}
                serviceName={name}
                tenantSlug={tenantSlug}
                className="mt-3 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              />
            )}
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
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="float-right text-gray-600 hover:text-gray-600 text-2xl font-bold m-4"
                aria-label="Close"
              >
                ×
              </button>

              <div className="p-8 pt-4">
                {/* Before/After Images in Modal */}
                {(beforeImage || afterImage) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      Resultados
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {beforeImage && (
                        <div>
                          <div className="text-sm text-gray-500 mb-2">
                            Antes
                          </div>
                          <img
                            src={beforeImage}
                            alt={`${name} - Antes`}
                            className="w-full h-48 object-cover rounded-md"
                          />
                        </div>
                      )}
                      {afterImage && (
                        <div>
                          <div className="text-sm text-gray-500 mb-2">
                            Después
                          </div>
                          <img
                            src={afterImage}
                            alt={`${name} - Después`}
                            className="w-full h-48 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div
                  className="mb-6 text-center"
                  role="img"
                  aria-label={`${name} - Vista detallada del servicio. ${description}. Precio: $${price} MXN`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-7xl">{isLuxury ? "" : "⭐"}</div>
                  )}
                </div>

                <h2 className="text-3xl font-bold mb-4">{name}</h2>

                <div className="mb-6 flex items-center gap-4">
                  <div>
                    <span
                      className={`text-4xl font-bold ${isLuxury ? "text-[#121212]" : ""}`}
                      style={!isLuxury ? { color: primaryColor } : undefined}
                    >
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
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    Descripción
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {longDescription || description}
                  </p>
                </div>

                {metadata && Object.keys(metadata).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">
                      Detalles del Servicio
                    </h3>
                    <dl className="grid grid-cols-2 gap-3">
                      {Object.entries(metadata).map(
                        ([key, value]) =>
                          key !== "image" && (
                            <div key={key}>
                              <dt className="text-sm font-medium text-gray-500 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {String(value)}
                              </dd>
                            </div>
                          ),
                      )}
                    </dl>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handleReservarAhora}
                  className={`w-full py-4 px-6 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-lg ${
                    isLuxury ? "text-[#121212]" : "text-white"
                  }`}
                  style={{
                    backgroundColor: isLuxury ? "#D4AF37" : primaryColor,
                  }}
                  data-testid="reservar-ahora-button"
                >
                  Reservar Ahora
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

ServiceCard.displayName = "ServiceCard";

export default ServiceCard;
