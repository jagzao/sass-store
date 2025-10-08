"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Card } from "./card";
import { Input } from "./input";
import { Button } from "./button";

interface ReviewFormProps {
  productId: string;
  onSubmit: (review: ReviewFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface ReviewFormData {
  productId: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment?: string;
}

export function ReviewForm({ productId, onSubmit, isLoading }: ReviewFormProps) {
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [formData, setFormData] = React.useState<Partial<ReviewFormData>>({
    productId,
    rating: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    if (!formData.customerName) {
      alert("Please enter your name");
      return;
    }

    await onSubmit({
      ...formData,
      productId,
      rating,
    } as ReviewFormData);

    // Reset form
    setRating(0);
    setFormData({ productId, rating: 0 });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Rating *
          </label>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    i < (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name *
          </label>
          <Input
            id="name"
            value={formData.customerName || ""}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            required
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email (optional)
          </label>
          <Input
            id="email"
            type="email"
            value={formData.customerEmail || ""}
            onChange={(e) =>
              setFormData({ ...formData, customerEmail: e.target.value })
            }
            maxLength={255}
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Review Title (optional)
          </label>
          <Input
            id="title"
            value={formData.title || ""}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            maxLength={200}
            placeholder="Sum up your review in one line"
          />
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Review (optional)
          </label>
          <textarea
            id="comment"
            value={formData.comment || ""}
            onChange={(e) =>
              setFormData({ ...formData, comment: e.target.value })
            }
            className="w-full min-h-[100px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us more about your experience"
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Card>
  );
}
