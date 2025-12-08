import { relations } from "drizzle-orm/relations";
import { tenants, services } from "./schema";

export const servicesRelations = relations(services, ({one}) => ({
	tenant: one(tenants, {
		fields: [services.tenant_id],
		references: [tenants.id]
	}),
}));

export const tenantsRelations = relations(tenants, ({many}) => ({
	services: many(services),
}));