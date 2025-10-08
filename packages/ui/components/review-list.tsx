"use client";

import * as React from "react";
import { ProductReview, Review } from "./product-review";
import { Skeleton } from "./skeleton";

interface ReviewListProps {
  productId: string;
  reviews?: Review[];
  isLoading?: boolean;
  onHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
}

export function ReviewList({
  productId,
  reviews,
  isLoading,
  onHelpful,
  onReport,
}: ReviewListProps) {
  const [localReviews, setLocalReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (reviews) {
      setLocalReviews(reviews);
      return;
    }

    // Fetch reviews if not provided
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/v1/reviews?productId=${productId}&status=approved`
        );
        const data = await response.json();
        setLocalReviews(data.reviews || []);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId, reviews]);

  if (isLoading || loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (localReviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reviews yet. Be the first to review this product!
      </div>
    );
  }

  // Calculate average rating
  const avgRating = (
    localReviews.reduce((sum, r) => sum + r.rating, 0) / localReviews.length
  ).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">Customer Reviews</h3>
        <p className="text-gray-600 mt-1">
          {avgRating} out of 5 stars ({localReviews.length} reviews)
        </p>
      </div>

      {localReviews.map((review) => (
        <ProductReview
          key={review.id}
          review={review}
          onHelpful={onHelpful}
          onReport={onReport}
        />
      ))}
    </div>
  );
}
