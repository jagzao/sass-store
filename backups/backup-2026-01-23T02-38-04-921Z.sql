-- Backup de Supabase - 2026-01-23T02-38-04-921Z
-- Proyecto: jedryjmljffuvegggjmw

-- Este archivo contiene un backup de la base de datos
-- Fecha de creación: 2026-01-23T02:38:04.921Z



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
