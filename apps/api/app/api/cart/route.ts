import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { CartService } from "../../../lib/services/CartService";
import {
  authenticateRequest,
  AuthenticatedRequest,
} from "@sass-store/core/src/middleware/auth-middleware";
import { Err } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

// Schemas for validation
const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive().min(1),
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().positive().min(1),
});

const cartService = new CartService({} as any); // Mock database for demo

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  return withResultHandler(async (req: NextRequest) => {
    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return authResult;
    }

    const authenticatedRequest = authResult.success
      ? authResult.data
      : (req as AuthenticatedRequest);
    if (!authenticatedRequest.user) {
      return Err(
        ErrorFactories.authentication(
          "missing_token",
          "User authentication required",
        ),
      );
    }

    const { searchParams } = new URL(req.url);
    const cartId = searchParams.get("cartId");

    if (cartId) {
      // Get specific cart
      const uuidValidation = CommonSchemas.uuid.parse(cartId);
      if (!uuidValidation.success) {
        return uuidValidation;
      }

      // For demo purposes, return mock cart data
      return {
        id: cartId,
        tenantId: authenticatedRequest.user.userId,
        userId: authenticatedRequest.user.userId,
        items: [],
        subtotal: "0.00",
        total: "0.00",
        currency: "USD",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Get user's active cart
      // For demo purposes, return mock cart data
      return {
        id: `cart_${authenticatedRequest.user.userId}`,
        tenantId: authenticatedRequest.user.userId,
        userId: authenticatedRequest.user.userId,
        items: [],
        subtotal: "0.00",
        total: "0.00",
        currency: "USD",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  })(request);
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  return withResultHandler(async (req: NextRequest) => {
    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return authResult;
    }

    const authenticatedRequest = authResult.success
      ? authResult.data
      : (req as AuthenticatedRequest);
    if (!authenticatedRequest.user) {
      return Err(
        ErrorFactories.authentication(
          "missing_token",
          "User authentication required",
        ),
      );
    }

    const body = await req.json();
    const validation = validateWithZod(AddToCartSchema, body);
    if (!validation.success) {
      return validation;
    }

    const { productId, quantity } = validation.data;

    // Add item to cart
    const addResult = await cartService.addToCart({
      cartId: `cart_${authenticatedRequest.user.userId}`,
      itemId: `item_${Date.now()}`,
      userId: authenticatedRequest.user.userId,
      tenantId: authenticatedRequest.user.userId,
      productId,
      quantity,
    });

    return addResult;
  })(request);
}

// PUT /api/cart - Update cart item
export async function PUT(request: NextRequest) {
  return withResultHandler(async (req: NextRequest) => {
    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return authResult;
    }

    const authenticatedRequest = authResult.success
      ? authResult.data
      : (req as AuthenticatedRequest);
    if (!authenticatedRequest.user) {
      return Err(
        ErrorFactories.authentication(
          "missing_token",
          "User authentication required",
        ),
      );
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return Err(
        ErrorFactories.validation(
          "missing_item_id",
          "Item ID is required for updates",
        ),
      );
    }

    const uuidValidation = CommonSchemas.uuid.parse(itemId);
    if (!uuidValidation.success) {
      return uuidValidation;
    }

    const body = await req.json();
    const validation = validateWithZod(UpdateCartItemSchema, body);
    if (!validation.success) {
      return validation;
    }

    const { quantity } = validation.data;

    // Update cart item
    const updateResult = await cartService.updateCartItem({
      cartId: `cart_${authenticatedRequest.user.userId}`,
      itemId,
      userId: authenticatedRequest.user.userId,
      tenantId: authenticatedRequest.user.userId,
      quantity,
    });

    return updateResult;
  })(request);
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request: NextRequest) {
  return withResultHandler(async (req: NextRequest) => {
    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return authResult;
    }

    const authenticatedRequest = authResult.success
      ? authResult.data
      : (req as AuthenticatedRequest);
    if (!authenticatedRequest.user) {
      return Err(
        ErrorFactories.authentication(
          "missing_token",
          "User authentication required",
        ),
      );
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return Err(
        ErrorFactories.validation(
          "missing_item_id",
          "Item ID is required for removal",
        ),
      );
    }

    const uuidValidation = CommonSchemas.uuid.parse(itemId);
    if (!uuidValidation.success) {
      return uuidValidation;
    }

    // Remove item from cart
    const removeResult = await cartService.removeFromCart({
      cartId: `cart_${authenticatedRequest.user.userId}`,
      itemId,
      userId: authenticatedRequest.user.userId,
      tenantId: authenticatedRequest.user.userId,
    });

    return removeResult;
  })(request);
}
