import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  tenants,
  products,
  services,
  staff,
  bookings,
  mediaAssets,
  tenantQuotas,
  auditLogs,
  productReviews
} from './schema';

// Select types (for data coming from DB)
export type Tenant = InferSelectModel<typeof tenants>;
export type Product = InferSelectModel<typeof products>;
export type Service = InferSelectModel<typeof services>;
export type Staff = InferSelectModel<typeof staff>;
export type Booking = InferSelectModel<typeof bookings>;
export type MediaAsset = InferSelectModel<typeof mediaAssets>;
export type TenantQuota = InferSelectModel<typeof tenantQuotas>;
export type AuditLog = InferSelectModel<typeof auditLogs>;

// Insert types (for data going to DB)
export type TenantInsert = InferInsertModel<typeof tenants>;
export type ProductInsert = InferInsertModel<typeof products>;
export type ServiceInsert = InferInsertModel<typeof services>;
export type StaffInsert = InferInsertModel<typeof staff>;
export type BookingInsert = InferInsertModel<typeof bookings>;
export type MediaAssetInsert = InferInsertModel<typeof mediaAssets>;
export type TenantQuotaInsert = InferInsertModel<typeof tenantQuotas>;
export type AuditLogInsert = InferInsertModel<typeof auditLogs>;

export type ProductReview = InferSelectModel<typeof productReviews>;
export type ProductReviewInsert = InferInsertModel<typeof productReviews>;

// Utility types
export type TenantMode = 'catalog' | 'booking';
export type TenantStatus = 'active' | 'inactive' | 'suspended';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type MediaAssetType = 'product' | 'staff' | 'service' | 'branding' | 'gallery';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';