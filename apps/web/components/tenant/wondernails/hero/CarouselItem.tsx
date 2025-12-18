/**
 * Wondernails Carousel Item Component
 *
 * Individual carousel slide with:
 * - Introduction view (default)
 * - Image
 * - Detail view (expanded)
 */

import React, { memo, useCallback } from "react";
import Image from "next/image";
import type { WnSlide } from "./HeroWondernailsFinal";
import { CarouselItemIntro } from "./CarouselItemIntro";
import { CarouselItemDetail } from "./CarouselItemDetail";
import styles from "./HeroWondernailsGSAP.module.css";

export interface CarouselItemProps {
  slide: WnSlide;
  index: number;
  onSeeMore: () => void;
  onAddToCart: () => void;
  onCheckout: () => void;
  onCloseDetail: () => void;
}

export const CarouselItem = memo<CarouselItemProps>(
  ({ slide, index, onSeeMore, onAddToCart, onCheckout, onCloseDetail }) => {
    // Handle image click to add to cart
    const handleImageClick = useCallback(() => {
      if (slide.type === "product") {
        onAddToCart();
      } else {
        onCheckout();
      }
    }, [slide.type, onAddToCart, onCheckout]);

    return (
      <article
        key={slide.img}
        className={styles.item}
        data-testid="carousel-item"
        data-index={index}
        role="tabpanel"
        aria-label={`Slide ${index + 1}: ${slide.topic || "Service"}`}
      >
        <CarouselItemIntro slide={slide} onSeeMore={onSeeMore} />

        <div
          className={`${styles.imgWrap} ${styles.clickableImgWrap}`}
          onClick={handleImageClick}
          role="button"
          tabIndex={0}
          aria-label={`Agregar ${slide.topic || slide.detailTitle || "producto"} al carrito`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleImageClick();
            }
          }}
        >
          {slide.videoUrl || slide.img.match(/\.(mp4|webm|ogg|mov)$/i) ? (
            <video
              src={slide.videoUrl || slide.img}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <Image
              src={slide.img}
              alt={slide.topic || "Servicio Wonder Nails"}
              fill
              priority={index === 1}
              sizes="(max-width:768px) 40vw, (max-width:1200px) 50vw, 800px"
            />
          )}
          <div className={styles.imgOverlay}>
            <span className={styles.imgOverlayText}>
              {slide.type === "product" ? "COMPRAR" : "RESERVAR"}
            </span>
          </div>
        </div>

        <CarouselItemDetail
          slide={slide}
          onAddToCart={onAddToCart}
          onCheckout={onCheckout}
          onClose={onCloseDetail}
        />
      </article>
    );
  },
);
