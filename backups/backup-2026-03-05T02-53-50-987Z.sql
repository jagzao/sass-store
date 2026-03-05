-- Backup de Supabase - 2026-03-05T02-53-50-987Z
-- Proyecto: jedryjmljffuvegggjmw

-- Este archivo contiene un backup de la base de datos
-- Fecha de creación: 2026-03-05T02:53:50.987Z



-- Datos de la tabla: tenants
-- La tabla tenants no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: tenant_configs
-- La tabla tenant_configs no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: api_keys
-- La tabla api_keys no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: products
-- La tabla products no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: services
-- La tabla services no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: staff
-- La tabla staff no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: bookings
-- La tabla bookings no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: media_assets
-- La tabla media_assets no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: tenant_quotas
-- La tabla tenant_quotas no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: orders
-- La tabla orders no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: order_items
-- La tabla order_items no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: payments
-- La tabla payments no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: audit_logs
-- La tabla audit_logs no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: tenant_channels
-- La tabla tenant_channels no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: channel_accounts
-- La tabla channel_accounts no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: channel_credentials
-- La tabla channel_credentials no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: social_posts
-- La tabla social_posts no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: social_post_targets
-- La tabla social_post_targets no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: content_variants
-- La tabla content_variants no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: posting_rules
-- La tabla posting_rules no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: post_jobs
-- La tabla post_jobs no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: post_results
-- La tabla post_results no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: media_renditions
-- La tabla media_renditions no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: customers
-- La tabla customers no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: customer_visits
-- La tabla customer_visits no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: visit_photos
-- La tabla visit_photos no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: customer_visit_services
-- La tabla customer_visit_services no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: menu_designs
-- La tabla menu_designs no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: users
-- La tabla users no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: accounts
-- La tabla accounts no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: sessions
-- La tabla sessions no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: verification_tokens
-- La tabla verification_tokens no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: user_roles
-- La tabla user_roles no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: product_reviews
-- La tabla product_reviews no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: financial_kpis
-- La tabla financial_kpis no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: financial_movements
-- La tabla financial_movements no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: user_carts
-- La tabla user_carts no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: campaigns
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('82cbbfa2-077d-47a1-84b5-d9fe5376898a', '0aa4afad-e647-49c6-8b08-74d1b4bedea2', 'Belleza WonderNails', 'belleza', 'belleza-wondernails', 'assets/luts/zo-system/belleza_warm.cube', '2025-12-27T21:32:50.035094+00:00', '2025-12-27T21:32:50.035094+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('9c5464c0-9c86-4d15-8ba9-7aa2febf6534', '0aa4afad-e647-49c6-8b08-74d1b4bedea2', 'Navidad WonderNails', 'navidad', 'navidad-wondernails', 'assets/luts/zo-system/navidad_gold.cube', '2025-12-27T21:32:50.035094+00:00', '2025-12-27T21:32:50.035094+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('50fc8c88-759c-492d-ac73-27e10c7e76a3', '0aa4afad-e647-49c6-8b08-74d1b4bedea2', 'Promociones WonderNails', 'promocional', 'promocional-wondernails', 'assets/luts/HardBoost.cube', '2025-12-27T21:32:50.035094+00:00', '2025-12-27T21:32:50.035094+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('4956b8f9-3ad1-43f3-8928-8c051a91f48e', '0aa4afad-e647-49c6-8b08-74d1b4bedea2', 'Verano WonderNails', 'verano', 'verano-wondernails', 'assets/luts/BlueHour.cube', '2025-12-27T21:32:50.035094+00:00', '2025-12-27T21:32:50.035094+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('f8f47d57-8265-499d-a056-cf22a613b34f', '8b1b37d4-dd5c-42c8-bfe3-804d2c72aeaf', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-25T23:38:46.832596+00:00', '2026-02-25T23:38:46.832596+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('2b801783-48ad-4b2e-99bd-e53e06294236', '48e076ca-6801-4c50-a75f-7870a09b1442', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-25T23:41:06.11184+00:00', '2026-02-25T23:41:06.11184+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('5ec99ba7-8c5a-4c1e-bdc8-dcc0ee8438b2', '79a8d390-b311-425f-a3c5-5369569e8de2', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-25T23:42:56.228997+00:00', '2026-02-25T23:42:56.228997+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('1d1fd039-df24-4606-8c9a-f1c898c9e118', '541a34e2-2c96-403f-8f7b-77ea904d514d', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-25T23:47:47.826799+00:00', '2026-02-25T23:47:47.826799+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('6e8b95ea-84db-4eef-930d-32337d5dab38', 'abb49f30-fd08-4bee-aaa7-d4ed4926ff48', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-25T23:51:27.067756+00:00', '2026-02-25T23:51:27.067756+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('8ca4ef02-6009-4265-82f5-2eda6329be9b', '581f0237-35f1-4bc4-88bf-934411718ae9', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-25T23:53:15.388214+00:00', '2026-02-25T23:53:15.388214+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('1b85ed62-4667-417a-96ea-e4dde27a4936', '89e9f119-f5a0-4f27-aee0-c2a8fcfa344c', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-26T00:56:54.433892+00:00', '2026-02-26T00:56:54.433892+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('fb1c518f-65ce-4770-bf4f-ba0487b6528d', '2c3841aa-2859-46ae-a3ab-ee079c47eb00', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-26T00:58:56.980435+00:00', '2026-02-26T00:58:56.980435+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('0a0b6335-4375-4729-89b9-33ed67c44b94', 'c5e696b4-7c59-4004-a5c2-217fd0d98f2e', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-26T01:00:57.385531+00:00', '2026-02-26T01:00:57.385531+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('6e659f71-b971-4c57-9668-aaaaf0cc3726', 'abb3324d-f753-4799-8b6a-01221ad092b6', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-26T02:12:36.739371+00:00', '2026-02-26T02:12:36.739371+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('21d022ce-3625-4a03-bb79-f61dd3cf6f45', 'd8005ddd-0527-43ee-9858-f36524b95304', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-26T02:15:03.329357+00:00', '2026-02-26T02:15:03.329357+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('9418bed7-7f0a-4450-92c4-a2e27e0fa61b', '9e0508c6-4d7b-4587-bd5f-4bc90c52df7c', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-26T18:09:20.48761+00:00', '2026-02-26T18:09:20.48761+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('742d825f-bf8e-4e02-9138-08b022b87fd5', '1d45c39f-6916-4186-995e-f6cab0ec076f', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-26T23:58:10.686677+00:00', '2026-02-26T23:58:10.686677+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('af440c15-8f97-4a50-8f78-463e8af68fbf', '6cc2f509-2f42-40b7-b829-bf09a8a04af8', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-27T20:32:08.217464+00:00', '2026-02-27T20:32:08.217464+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('22b0dccf-4bac-4bbf-a60f-7742bb3bfbb3', 'a49fc443-6206-4170-b837-8dc5de2fc772', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-27T20:33:28.472084+00:00', '2026-02-27T20:33:28.472084+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('18769d2f-7745-4621-8310-dcc1fb59397f', '32e8db7f-2286-43da-81d4-f4f3306b8eab', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-27T20:34:04.236641+00:00', '2026-02-27T20:34:04.236641+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('a43aacc8-5e85-4e7a-b5bb-52211a0e0fec', 'a9baf06d-5c0e-49e4-9c4f-75d867ddd4d9', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-27T20:48:01.776995+00:00', '2026-02-27T20:48:01.776995+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('e840a879-3d5e-4c91-90c0-2617a5ec77b3', '5118e966-3523-42d9-a920-d09d29bf8f08', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-27T22:07:26.973523+00:00', '2026-02-27T22:07:26.973523+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('8d37c49c-1a98-4722-83ae-acd28606dee5', '9e212050-3aed-45cd-9d82-41fb9a2cd7f5', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-02-27T22:54:57.804383+00:00', '2026-02-27T22:54:57.804383+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('09b278a2-ba6e-42ba-958a-da6d62acecb9', '69bc8ebd-cfe0-49ff-9129-b2dcb318a71d', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-01T23:07:11.894101+00:00', '2026-03-01T23:07:11.894101+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('212e8dee-efcc-49c4-be9d-629b24f7ce7c', '8a5ec8fd-ce4e-4f94-a020-0a4da39159e2', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-01T23:50:05.658018+00:00', '2026-03-01T23:50:05.658018+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('8cbb1fcd-26ae-4d83-a9d6-6f3b6c3aae05', '4f2dfeec-b930-4172-98ab-cb78a890fd9e', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-01T23:54:33.682117+00:00', '2026-03-01T23:54:33.682117+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('9c646594-2f4b-4d8f-b2b7-ca33d5bc9905', '5842aae8-56ed-4cd4-83c2-6607a81cb0ae', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-01T23:55:22.239973+00:00', '2026-03-01T23:55:22.239973+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('a329b024-40fe-45b0-a600-d791a4aeed78', 'e6743797-3658-4fca-8c8f-e31ac44d1877', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T14:41:21.202182+00:00', '2026-03-02T14:41:21.202182+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('abc8be15-7c66-4e76-8dfb-07080b9bac3e', '35d1dda9-710a-4cec-95c8-0ed8314569c3', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T14:42:47.345459+00:00', '2026-03-02T14:42:47.345459+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('ae4b959c-ebf0-4701-b9aa-139d89d98e5e', 'c460d9b7-2e15-4e53-8d8c-12604ab53045', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T16:05:56.235406+00:00', '2026-03-02T16:05:56.235406+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('d2cd57c1-3966-489b-9de1-7aa388db807e', '6ea59a97-3fcc-4af6-8600-d8a39358cb17', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T16:23:28.723083+00:00', '2026-03-02T16:23:28.723083+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('0f51f59b-72ad-4990-838f-8415cbaab31b', '2270c034-427b-4a68-8ed2-08d00f1f33fc', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T16:52:30.990724+00:00', '2026-03-02T16:52:30.990724+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('c6be15ac-4455-436d-8c37-922aa110d3c4', 'e9005580-e696-4033-8d01-3970c4922ed6', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T16:54:55.08667+00:00', '2026-03-02T16:54:55.08667+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('108841e6-af09-4f26-8f1d-a8b9003f8230', '6e4ba919-5285-4c04-a474-52faba4f4d30', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T16:56:15.832766+00:00', '2026-03-02T16:56:15.832766+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('091824f9-2327-437a-a899-26c387c70fd7', 'a9a62f29-febc-41c6-a74f-289e39045727', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T17:05:17.186664+00:00', '2026-03-02T17:05:17.186664+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('a4478b3e-3a8b-4788-b294-d0b361a1631f', '3ef30ffc-38c9-41ac-8a3e-71a243c549ef', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T19:34:07.176185+00:00', '2026-03-02T19:34:07.176185+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('cbebf484-16ad-4b2e-a2ea-67f7d478ebb2', '2fb9cd80-e540-4f0b-adb7-0f4d281f86db', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-02T19:53:19.392439+00:00', '2026-03-02T19:53:19.392439+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('385810fc-da0d-4fb7-9daa-a99d88ac6566', '5c6f1db9-2d66-44bb-8d20-ee1a915fd168', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T02:16:05.466264+00:00', '2026-03-04T02:16:05.466264+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('22d5f5a8-7947-4a31-a54a-7fe267e56e0e', 'c408a818-101c-48cb-8e81-e7db75ddf471', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T15:52:45.588358+00:00', '2026-03-04T15:52:45.588358+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('686b5638-cc65-41c1-bcba-f76d3217ae6e', 'cb30214f-3517-471a-bac2-e9537eb3121b', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T15:53:25.091478+00:00', '2026-03-04T15:53:25.091478+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('4eca85de-cab0-491e-92b4-e4b0b829bffe', '09e9e1de-10c1-4d2a-9d00-c0748d93efa1', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T15:55:34.120598+00:00', '2026-03-04T15:55:34.120598+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('ef7b50af-2b27-4e79-a984-7795c2ae2e15', 'c6fd5471-46ee-43cd-80bd-e8935a53eea4', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T16:04:00.394743+00:00', '2026-03-04T16:04:00.394743+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('1007583b-47ba-43a9-bf3b-7a3cd49f6e0a', 'd627f99f-ac2f-4fc8-8284-72dd8c6193cc', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T16:05:48.313284+00:00', '2026-03-04T16:05:48.313284+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('fd0926c9-63aa-40b5-9b6b-c195974ae6ab', '80c96b4a-f30f-4be1-9634-e3830410cc8d', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T16:27:54.048898+00:00', '2026-03-04T16:27:54.048898+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('5c94e7b0-ee25-42e3-b1ab-15badb7eaf1c', '96ff2d26-f88c-4300-81e0-2621c5a2bedd', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T16:29:29.406512+00:00', '2026-03-04T16:29:29.406512+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('ca89eb18-f72b-4760-b733-ec0ea34084a1', '51077260-790f-4cdf-a1b3-9cb358544041', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T16:31:37.668345+00:00', '2026-03-04T16:31:37.668345+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('a353411d-03a8-4a1f-aadb-413bc6bbd956', 'a16cf80f-ed0f-4760-a36f-1d0960999903', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T16:33:11.897538+00:00', '2026-03-04T16:33:11.897538+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('b22bfd55-9d14-4881-9c42-5cc3953d3050', 'c32379e4-8027-4da5-a9a1-2e5bc95d253f', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T16:37:44.310785+00:00', '2026-03-04T16:37:44.310785+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('09e30c75-a748-48d3-86c9-2691e3d1f9d8', '70630a84-9a14-443f-aa08-43aacff61fb6', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T17:12:51.452774+00:00', '2026-03-04T17:12:51.452774+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('5d4148ad-7959-41d0-8210-9a311c973431', '865092c6-b17d-4b71-a3d5-e7fe48813bff', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T17:15:38.256971+00:00', '2026-03-04T17:15:38.256971+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('743a43d0-678c-45e1-a4d3-3817cbf89b9d', '21086669-afab-4959-b187-23ddfd27ed11', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T17:51:43.081172+00:00', '2026-03-04T17:51:43.081172+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('b6d4d354-ca5d-4972-bd31-41437f3ffd58', '71ef9c2f-83a4-423a-93b2-ab50d80a504c', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T17:56:00.706765+00:00', '2026-03-04T17:56:00.706765+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('5d184ded-7db9-4f70-876d-eab07af0fda8', 'b5dfa24f-9a6e-4873-a726-c0df47b8fe72', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T17:56:50.671298+00:00', '2026-03-04T17:56:50.671298+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('b3f5d534-8455-4f6c-9db6-4eaa3a4e604b', '1e78c8cd-4fc3-4735-b354-9e947f1d739b', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T17:58:03.089859+00:00', '2026-03-04T17:58:03.089859+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('f0018e6e-6849-4212-b371-4b3ef4bf7c7b', '17a22fe4-f82a-40da-a6d4-582c7ae7ca95', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T17:58:29.059926+00:00', '2026-03-04T17:58:29.059926+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('d56ec903-3081-4868-bc0e-5f97bbc0f51e', '934f98a1-9ca3-4eae-9129-5d3661aa7d33', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T17:59:46.601266+00:00', '2026-03-04T17:59:46.601266+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('09df7dd6-d408-4fb8-847e-7726f0ff17ea', 'd8d5f563-3eaf-4f5e-9338-f45ef55eb1e0', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T18:10:34.804735+00:00', '2026-03-04T18:10:34.804735+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('9df3d987-1876-40ca-9b9d-35cc8678d2a1', '159a69af-4646-4f5d-8c95-7b0256d9eff9', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T18:10:53.144495+00:00', '2026-03-04T18:10:53.144495+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('88b9db1b-165d-474f-b5e6-046b34d105e9', 'ab0492e7-5408-42a2-a8e0-88d723b04ff1', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T18:39:39.29519+00:00', '2026-03-04T18:39:39.29519+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('878c387a-1627-4155-b8e4-1c9c913e6299', '36fb6c63-0a49-4bc5-8bc8-4b1dfabb108f', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T18:41:55.207703+00:00', '2026-03-04T18:41:55.207703+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('e53f467f-61b6-4ad3-9a76-a46c00312306', 'c7371a14-e21a-4521-83f9-ab447c04ee53', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T18:48:05.513979+00:00', '2026-03-04T18:48:05.513979+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('8d5da42d-b029-4749-93aa-950789edcaaa', '31233589-a176-45e0-9ba3-3e44e24f1772', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T18:58:04.824233+00:00', '2026-03-04T18:58:04.824233+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('ec5fa27e-ed7d-438c-b9f9-aac11e47964f', '2452f6e2-e068-4f8b-9a04-341045a51452', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T19:20:13.909731+00:00', '2026-03-04T19:20:13.909731+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('e1183a36-8fe1-4fcc-841c-0315abf42e2c', '44d029f1-975b-4851-bca7-60da4a70e82f', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T19:41:04.135751+00:00', '2026-03-04T19:41:04.135751+00:00');
INSERT INTO "campaigns" ("id", "tenant_id", "name", "type", "slug", "lut_file", "created_at", "updated_at") VALUES ('13c60c3a-bbd8-4c10-aa82-7366a2996956', '1914ffce-c642-4e74-a843-fc7922812f67', 'Holiday Campaign', 'promocional', 'holiday-campaign', NULL, '2026-03-04T19:50:52.96044+00:00', '2026-03-04T19:50:52.96044+00:00');


-- Datos de la tabla: reels
INSERT INTO "reels" ("id", "tenant_id", "campaign_id", "title", "status", "image_urls", "overlay_type", "music_file", "duration", "hashtags", "caption", "metadata", "created_at", "updated_at") VALUES ('ee78d9a2-f37a-419a-98f7-b454078af4c4', '0aa4afad-e647-49c6-8b08-74d1b4bedea2', NULL, 'Reel 20251231_081223', 'failed', '["C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0006.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0043.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0040.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0016.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0069.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20250526-WA0001.jpg"]', 'glitter', 'C:\Dev\Zo\content_generator\backend\assets\music\calm-lounge-cafe-music-347401.mp3', 0, '[]', '', '{"error":"''VideoProcessor'' object has no attribute ''add_overlay_effects''"}', '2025-12-31T08:12:23.128427+00:00', '2025-12-31T14:15:37.488174+00:00');
INSERT INTO "reels" ("id", "tenant_id", "campaign_id", "title", "status", "image_urls", "overlay_type", "music_file", "duration", "hashtags", "caption", "metadata", "created_at", "updated_at") VALUES ('74076dbd-339a-44b6-90a0-9c3ead788837', '0aa4afad-e647-49c6-8b08-74d1b4bedea2', NULL, 'Reel 20251231_090548', 'failed', '["C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0025.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0031.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0025.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0031.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0025.jpg","C:\\Dev\\Zo\\content_generator\\backend\\assets\\tenants\\wondernails\\imagenes\\IMG-20251019-WA0031.jpg"]', 'glitter', 'C:\Dev\Zo\content_generator\backend\assets\music\calm-lounge-cafe-music-347401.mp3', 0, '[]', '', '{"error":"''VideoProcessor'' object has no attribute ''add_overlay_effects''"}', '2025-12-31T09:05:48.600559+00:00', '2025-12-31T15:08:51.002367+00:00');
INSERT INTO "reels" ("id", "tenant_id", "campaign_id", "title", "status", "image_urls", "overlay_type", "music_file", "duration", "hashtags", "caption", "metadata", "created_at", "updated_at") VALUES ('8677186d-8578-4d1f-b518-25d3f2e9496d', '0aa4afad-e647-49c6-8b08-74d1b4bedea2', NULL, 'Reel 20251231_110036', 'completed', '["C:\\Dev\\Zo\\content_generator\\assets\\tenants\\wondernails\\productos\\img1.jpg","C:\\Dev\\Zo\\content_generator\\assets\\tenants\\wondernails\\productos\\Screenshot_5.png","C:\\Dev\\Zo\\content_generator\\assets\\tenants\\wondernails\\productos\\Gemini_Generated_Image_onzsbponzsbponzs.png","C:\\Dev\\Zo\\content_generator\\assets\\tenants\\wondernails\\productos\\WhatsApp Image 2025-12-28 at 3.13.13 PM (1).jpeg","C:\\Dev\\Zo\\content_generator\\assets\\tenants\\wondernails\\productos\\WhatsApp Image 2025-12-28 at 3.13.13 PM.jpeg","C:\\Dev\\Zo\\content_generator\\assets\\tenants\\wondernails\\productos\\logoWn.png"]', 'glitter', 'C:\Dev\Zo\content_generator\backend\assets\music\calm-lounge-cafe-music-347401.mp3', 13.33, '["#Wondernails","#Belleza","#Texcoco","#UñasDeLujo","#Manicura","#BellezaUnica"]', '✨ Belleza que enamora 💄', '{"mode":"simplified_windows","duration":13.333333333333332,"video_path":"output\\reels\\8677186d-8578-4d1f-b518-25d3f2e9496d_optimized.mp4","image_count":6,"lut_enabled":false,"overlay_type":"glitter","campaign_type":"belleza","captions_count":0,"voiceover_text":null,"effects_enabled":false,"overlay_enabled":true,"processing_time":265.422095,"captions_enabled":false,"voiceover_enabled":false,"smart_transitions_enabled":false}', '2025-12-31T11:00:36.494358+00:00', '2025-12-31T17:05:01.06145+00:00');


-- Datos de la tabla: pos_terminals
-- La tabla pos_terminals no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: mercadopago_tokens
-- La tabla mercadopago_tokens no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: mercadopago_payments
-- La tabla mercadopago_payments no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: oauth_state_tokens
-- La tabla oauth_state_tokens no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: customer_advances
-- La tabla customer_advances no contiene datos o hubo un error al obtenerlos


-- Datos de la tabla: advance_applications
-- La tabla advance_applications no contiene datos o hubo un error al obtenerlos
