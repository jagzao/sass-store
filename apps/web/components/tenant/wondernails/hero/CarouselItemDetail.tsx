/**
 * Carousel Item Detail View Component
 *
 * Displays detailed product/service information with:
 * - Title and description
 * - Specifications grid
 * - Action buttons (Buy/Reserve based on type)
 */

import React, { memo } from "react";
import type { WnSlide } from "./HeroWondernailsFinal";
import styles from "./HeroWondernailsGSAP.module.css";

export interface CarouselItemDetailProps {
  slide: WnSlide;
  onAddToCart: () => void;
  onCheckout: () => void;
  onClose: () => void;
}

export const CarouselItemDetail = memo<CarouselItemDetailProps>(
  function CarouselItemDetail({ slide, onAddToCart, onCheckout, onClose }) {
    return (
      <div className={styles.detail} data-testid="detail-view">
        <div className={styles.detailTitle}>
          {slide.detailTitle || slide.title}
        </div>

        {slide.detail && <div className={styles.detailDes}>{slide.detail}</div>}

        {!!slide.specs?.length && (
          <div
            className={styles.specifications}
            data-testid="detail-specifications"
          >
            {slide.specs.map((sp, i) => (
              <div key={i} className={styles.spec}>
                <p className={styles.specLabel}>{sp.label}</p>
                <p className={styles.specValue}>{sp.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className={styles.detailButtons}>
          {slide.type === "product" ? (
            <button
              className={styles.addToCart}
              onClick={onAddToCart}
              aria-label={`Comprar ${slide.topic || "producto"}`}
            >
              COMPRAR
            </button>
          ) : (
            <button
              className={styles.checkout}
              onClick={onCheckout}
              aria-label={`Reservar ${slide.topic || "servicio"}`}
            >
              RESERVAR
            </button>
          )}
          <button
            className={styles.closeDetail}
            onClick={onClose}
            data-testid="back-button"
            aria-label="Volver a la vista del carrusel"
          >
            VER TODOS
          </button>
        </div>
      </div>
    );
  },
);
