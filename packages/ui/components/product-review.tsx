import * as React from "react";
import { Star } from "lucide-react";
import { Card } from "./card";
import { Badge } from "./badge";

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  verified: boolean;
  helpful: number;
  createdAt: Date | string;
}

interface ProductReviewProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
}

export function ProductReview({
  review,
  onHelpful,
  onReport,
}: ProductReviewProps) {
  const createdDate = new Date(review.createdAt);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{review.customerName}</span>
            {review.verified && (
              <Badge variant="secondary" className="text-xs">
                Verified Purchase
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-sm text-gray-500 ml-2">
              {createdDate.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {review.title && (
        <h4 className="font-semibold mb-2">{review.title}</h4>
      )}

      {review.comment && (
        <p className="text-gray-700 mb-3">{review.comment}</p>
      )}

      <div className="flex items-center gap-4 text-sm">
        {onHelpful && (
          <button
            onClick={() => onHelpful(review.id)}
            className="text-gray-600 hover:text-gray-900"
          >
            Helpful ({review.helpful})
          </button>
        )}
        {onReport && (
          <button
            onClick={() => onReport(review.id)}
            className="text-gray-600 hover:text-red-600"
          >
            Report
          </button>
        )}
      </div>
    </Card>
  );
}
