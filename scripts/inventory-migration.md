# Inventory System Migration Script

This migration enhances the existing inventory system with additional features and optimizations for better performance and security.

## Prerequisites

- PostgreSQL 12+
- Existing inventory tables (product_inventory, service_products, inventory_transactions, inventory_alerts, product_alert_config)

## Migration Steps

### 1. Enhancements to Product Inventory Table

**Add fields for tracking inventory value and expiry dates:**

- `inventory_value` - Total value of inventory (quantity \* unit_cost)
- `expiry_date` - Expiry date for perishable products
- `last_counted_at` - Last physical count date
- `batch_number` - Batch/lot number for tracking
- `supplier_id` - Supplier reference (optional)

**Add comments to columns:**

- `inventory_value` - Total value of inventory (quantity \* unit_cost)
- `expiry_date` - Expiry date for perishable products
- `last_counted_at` - Last physical count date
- `batch_number` - Batch/lot number for tracking
- `supplier_id` - Supplier reference (optional)

### 2. Create Suppliers Table

**New table structure:**

- `id` - UUID primary key
- `tenant_id` - Reference to tenants table
- `name` - Supplier name
- `contact_person` - Contact person
- `email` - Email address
- `phone` - Phone number
- `address` - Address
- `metadata` - Additional metadata
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

**Indexes:**

- `suppliers_tenant_idx` - On tenant_id
- `suppliers_tenant_name_idx` - On tenant_id, name (unique)

### 3. Enhancements to Inventory Transactions Table

**Add fields for better tracking:**

- `transaction_number` - Sequential transaction number
- `performed_by` - Reference to users table
- `approved_by` - Reference to users table
- `approved_at` - When transaction was approved
- `cost_impact` - Financial impact of transaction
- `related_document_id` - Reference to related documents

**Add comments:**

- `transaction_number` - Sequential transaction number
- `performed_by` - User who performed transaction
- `approved_by` - User who approved transaction (if applicable)
- `approved_at` - When transaction was approved
- `cost_impact` - Financial impact of transaction

**Indexes:**

- `inventory_transactions_tenant_number_idx` - On tenant_id, transaction_number
- `inventory_transactions_date_idx` - On created_at
- `inventory_transactions_type_idx` - On type

### 4. Enhancements to Inventory Alerts Table

**Add fields for better alert management:**

- `auto_resolved` - Automatically resolved when condition is met
- `auto_resolved_at` - When auto-resolved
- `resolution_notes` - Notes about alert resolution
- `alert_count` - Number of times this alert has been triggered
- `last_triggered_at` - Last time this alert was triggered

**Add comments:**

- `auto_resolved` - Automatically resolved when condition is met
- `auto_resolved_at` - When auto-resolved
- `resolution_notes` - Notes about alert resolution
- `alert_count` - Number of times this alert has been triggered
- `last_triggered_at` - Last time this alert was triggered

**Indexes:**

- `inventory_alerts_tenant_status_auto_idx` - On tenant_id, status, auto_resolved
- `inventory_alerts_severity_status_idx` - On severity, status

### 5. Enhancements to Product Alert Config Table

**Add fields for enhanced alert configuration:**

- `alert_cooldown_minutes` - Minimum time between alert triggers
- `escalation_rules` - JSON for escalation rules
- `custom_message_template` - Custom message template for alerts

**Add comments:**

- `alert_cooldown_minutes` - Minimum time between alert triggers
- `escalation_rules` - Rules for escalating alerts (severity increase)
- `custom_message_template` - Custom message template for alerts

### 6. Create Inventory Movements Table (NEW)

**Purpose:** Track all inventory movements for better reporting

**Table structure:**

- `id` - UUID primary key
- `tenant_id` - Reference to tenants table
- `movement_type` - Type of movement (purchase, sale, transfer, adjustment, consumption)
- `product_id` - Reference to products table
- `quantity` - Positive for additions, negative for deductions
- `unit_cost` - Cost per unit
- `total_cost` - Total cost (quantity \* unit_cost)
- `reference_type` - Type of reference (purchase_order, sale_order, transfer_order, adjustment, service_id, visit_id)
- `reference_id` - ID of related record
- `notes` - Additional notes
- `performed_by` - Reference to users table
- `location` - Location where movement occurred
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

**Indexes:**

- `inventory_movements_tenant_type_idx` - On tenant_id, movement_type
- `inventory_movements_product_idx` - On product_id
- `inventory_movements_date_idx` - On created_at

### 7. Create Inventory Transfers Table (NEW)

**Purpose:** Track inventory transfers between locations

**Table structure:**

- `id` - UUID primary key
- `tenant_id` - Reference to tenants table
- `transfer_number` - Transfer number
- `from_location_id` - Reference to inventory_locations table
- `to_location_id` - Reference to inventory_locations table
- `product_id` - Reference to products table
- `quantity` - Quantity transferred
- `status` - Status (pending, in_transit, completed, cancelled)
- `requested_by` - Reference to users table
- `approved_by` - Reference to users table
- `received_by` - Reference to users table
- `requested_at` - Request timestamp
- `approved_at` - Approval timestamp
- `shipped_at` - Shipment timestamp
- `received_at` - Receipt timestamp
- `notes` - Additional notes
- `metadata` - Additional metadata
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

**Indexes:**

- `inventory_transfers_tenant_status_idx` - On tenant_id, status
- `inventory_transfers_transfer_number_idx` - On transfer_number

### 8. Create Inventory Locations Table (NEW)

**Purpose:** Define physical locations for inventory

**Table structure:**

- `id` - UUID primary key
- `tenant_id` - Reference to tenants table
- `name` - Location name
- `location_type` - Type (storage, retail, warehouse, shelf)
- `address` - Physical address
- `is_active` - Active status
- `metadata` - Additional metadata
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

**Indexes:**

- `inventory_locations_tenant_idx` - On tenant_id
- `inventory_locations_type_active_idx` - On location_type, is_active

### 9. Row Level Security (RLS) Policies

**Enable RLS on inventory tables:**

- `product_inventory`
- `inventory_transactions`
- `inventory_alerts`
- `inventory_movements`
- `inventory_transfers`
- `inventory_locations`
- `suppliers`

**Policy structure:**

- Isolation per tenant
- Read/write access for authenticated users
- Automatic tenant_id filtering

**Grant permissions on inventory tables:**

- All permissions to authenticated users for inventory tables

### 10. Triggers for Automatic Alert Generation

**Function: `generate_inventory_alerts()`**

- Checks low stock conditions and generates alerts
- Checks out of stock conditions and generates alerts
- Checks overstock conditions and generates alerts
- Prevents duplicate alerts

**Trigger: `trigger_generate_inventory_alerts`**

- Fires after INSERT or UPDATE on product_inventory
- Executes generate_inventory_alerts function

### 11. Audit Function

**Function: `log_inventory_audit()`**

- Logs all inventory changes to audit_logs table
- Tracks old_quantity, new_quantity, change_type

**Trigger: `trigger_log_inventory_audit`**

- Fires after INSERT or UPDATE on product_inventory
- Executes log_inventory_audit function

### 12. Helper Functions

**Function: `current_user_id()`**

- Returns current authenticated user ID

**Function: `is_authenticated()`**

- Checks if user is authenticated

### 13. Views for Inventory Reporting

**View: `view_low_stock_products`**

- Lists products with low stock
- Joins with alert configurations

**View: `view_inventory_summary`**

- Provides inventory summary by product
- Shows total quantity and total value

### 14. Performance Optimization Indexes

**Composite indexes for common queries:**

- `product_inventory_tenant_low_stock_idx` - For low stock queries (tenant + quantity)
- `product_inventory_expiry_idx` - For expiry date tracking
- `inventory_transactions_tenant_number_idx` - For transaction history
- `inventory_alerts_tenant_status_auto_idx` - For alert management
- `product_inventory_product_expiry_idx` - For product + expiry date

### 15. Initial Data Seeding

**Default alert configurations for existing products:**

- Insert default alert configurations for all existing products
- Low stock threshold: 10
- Enable low stock alerts
- Enable out of stock alerts
- Disable overstock alerts by default
- Enable email notifications

### 16. Migration Logging

**Log migration completion to audit_logs:**

- Record all changes made during migration
- Track version and tables modified

## Rollback Strategy

If migration fails, the following actions can be performed:

1. Drop new tables: `inventory_movements`, `inventory_transfers`, `inventory_locations`, `suppliers`
2. Drop new columns from existing tables
3. Drop new triggers
4. Drop new functions
5. Drop new views

## Execution Order

1. Enable UUID extension
2. Add columns to existing tables
3. Create suppliers table
4. Add indexes to existing tables
5. Create new tables (movements, transfers, locations)
6. Create RLS policies
7. Grant permissions
8. Create helper functions
9. Create triggers
10. Create views
11. Seed default configurations
12. Log migration completion

## Validation

After migration, verify:

1. All tables created successfully
2. All indexes created
3. All RLS policies applied
4. All functions created
5. All triggers created
6. Default configurations seeded

## Notes

- This migration is backwards compatible with existing inventory system
- All new features are optional and don't break existing functionality
- RLS policies ensure multi-tenant isolation
- Indexes optimize performance for common queries
- Triggers automate alert generation and audit logging
