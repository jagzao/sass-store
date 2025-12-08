import { pgTable, unique, uuid, varchar, text, jsonb, timestamp, foreignKey, numeric, integer, boolean } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"



export const tenants = pgTable("tenants", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	slug: varchar("slug", { length: 50 }).notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	mode: varchar("mode", { length: 20 }).default('catalog'::character varying).notNull(),
	status: varchar("status", { length: 20 }).default('active'::character varying).notNull(),
	timezone: varchar("timezone", { length: 50 }).default('America/Mexico_City'::character varying).notNull(),
	branding: jsonb("branding").default({}).notNull(),
	contact: jsonb("contact").default({}).notNull(),
	location: jsonb("location").default({}).notNull(),
	quotas: jsonb("quotas").default({}).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		tenants_slug_key: unique("tenants_slug_key").on(table.slug),
	}
});

export const services = pgTable("services", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	tenant_id: uuid("tenant_id").notNull().references(() => tenants.id),
	name: varchar("name", { length: 200 }).notNull(),
	description: text("description"),
	price: numeric("price", { precision: 10, scale:  2 }).notNull(),
	duration: integer("duration").notNull(),
	before_image: text("before_image"),
	after_image: text("after_image"),
	featured: boolean("featured").default(false),
	active: boolean("active").default(true),
	metadata: jsonb("metadata").default({}),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});