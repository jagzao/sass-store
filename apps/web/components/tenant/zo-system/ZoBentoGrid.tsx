"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types/tenant";
import { motion } from "framer-motion";

interface ZoBentoGridProps {
  products: Product[];
}

export const ZoBentoGrid = ({ products }: ZoBentoGridProps) => {
  if (!products || products.length === 0) return null;

  // Find SaaS Starter Kit to highlight (mock logic or real if name matches)
  const starterKitIndex = products.findIndex((p) =>
    p.name.toLowerCase().includes("starter kit"),
  );

  // Reorder to put starter kit first if found
  const displayProducts = [...products];
  if (starterKitIndex > -1) {
    const [starterKit] = displayProducts.splice(starterKitIndex, 1);
    displayProducts.unshift(starterKit);
  }

  return (
    <section className="container mx-auto px-4 py-20">
      <h2 className="text-4xl font-bold text-white mb-12 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider pl-4 border-l-4 border-[#FF8000]">
        Productos Destacados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]">
        {displayProducts.map((product, index) => {
          // First item (Starter Kit) spans 2 cols and 2 rows
          const isFeatured = index === 0;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`group relative rounded-2xl bg-[#111111] border border-white/5 hover:border-[#FF8000]/50 transition-colors duration-300 overflow-hidden flex flex-col ${
                isFeatured
                  ? "md:col-span-2 md:row-span-2 bg-[#161616]"
                  : "col-span-1"
              }`}
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-[#FF8000]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Content */}
              <div className="p-6 md:p-8 flex flex-col h-full z-10">
                <div className="flex justify-between items-start mb-4">
                  {/* Tech Badges (Mock based on description) */}
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400 border border-white/5">
                      .NET
                    </span>
                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400 border border-white/5">
                      REACT
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-full p-2">
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-auto">
                  <h3
                    className={`font-bold text-white mb-2 font-[family-name:var(--font-rajdhani)] ${isFeatured ? "text-4xl" : "text-xl"}`}
                  >
                    {product.name}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold text-[#FF8000] ${isFeatured ? "text-2xl" : "text-lg"}`}
                    >
                      ${product.price}
                    </span>
                    {isFeatured && (
                      <Link
                        href={`/t/zo-system/products/${product.id}`}
                        className="px-6 py-2 bg-[#FF8000] text-white text-sm font-bold rounded-full hover:bg-[#FF6600] transition-colors"
                      >
                        Live Demo
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Background (Subtle) */}
              {product.imageUrl && (
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                  {/* Next.js Image would be better but simple img for now to fit fluid layout */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover grayscale"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
