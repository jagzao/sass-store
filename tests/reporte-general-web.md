# Reporte General Web — SaaS Store

**Fecha de ejecución:** 2026-05-18T15:36:15.651Z
**Base URL:** http://127.0.0.1:3002
**Agente:** Playwright CLI
**Tenants probados:** wondernails, centro-tenistico, zo-system

## Resumen

| Métrica                                   | Valor |
| ----------------------------------------- | ----- |
| Rutas probadas                            | 24    |
| OK (sin 404 ni error)                     | 24    |
| 404 detectados                            | 0     |
| Redirects a login (protegidas sin sesión) | 0     |
| Errores de texto/carga                    | 0     |

## Tabla de resultados por ruta

| Tenant      | Ruta      | Pública | HTTP | Estado | Final URL                                    | Errores consola | Botones                                                          | Headings                                                                            | Screenshot     |
| ----------- | --------- | ------- | ---- | ------ | -------------------------------------------- | --------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------- |
| wondernails | /         | true    | 200  | ok     | http://127.0.0.1:3002/t/wondernails          | 2               | VER MÁS ↗, Ver más, RESERVAR                                     | Nuestros Productos, ACEITE DE CUTÍCULA, REMOVEDOR - MAGIC REMOVER BABUCICI          | \_.png         |
| wondernails | /services | true    | 200  | ok     | http://127.0.0.1:3002/t/wondernails/services | 0               | RESERVAR AHORA (1/2), RESERVAR AHORA (1/2), RESERVAR AHORA (1/2) | TECH GEL # ADICIONAL, Visit Service 1778125308587, STIKER CH                        | \_services.png |
| wondernails | /products | true    | 200  | ok     | http://127.0.0.1:3002/t/wondernails/products | 0               | -, +, Comprar ahora                                              | ACEITE DE CUTÍCULA, REMOVEDOR - MAGIC REMOVER BABUCICI, PURE ACETONE - ACETONA PURA | \_products.png |
| wondernails | /book     | true    | 200  | ok     | http://127.0.0.1:3002/t/wondernails/book     | 0               | MON                                                              |

18th

Libre, TUE

19th

Libre, WED

20th

Libre | HORARIOS DISPONIBLES, TUS DATOS | \_book.png |
| wondernails | /contact | true | 200 | ok | http://127.0.0.1:3002/t/wondernails/contact | 0 | - | Contáctanos, Información de Contacto, Teléfono | \_contact.png |
| wondernails | /login | true | 200 | ok | http://127.0.0.1:3002/t/wondernails/login | 0 | Iniciar Sesión, Continuar con Google | Wonder Nails Studio, Inicia sesión en tu cuenta | \_login.png |
| wondernails | /register | true | 200 | ok | http://127.0.0.1:3002/t/wondernails/register | 0 | Registrarse con Google, Crear cuenta | Wonder Nails Studio | \_register.png |
| wondernails | /forgot-password | true | 200 | ok | http://127.0.0.1:3002/t/wondernails/forgot-password | 0 | Enviar enlace de recuperación | Recuperar Contraseña | \_forgot_password.png |
| centro-tenistico | / | true | 200 | ok | http://127.0.0.1:3002/t/centro-tenistico | 0 | CANCHAS DE TENIS

$45/ hora, CLASES PRIVADAS

$120/ sesión, CLASES GRUPALES

$35/ persona | Canchas de Tenis, Canchas de Tenis, Servicios y Canchas | \_.png |
| centro-tenistico | /services | true | 200 | ok | http://127.0.0.1:3002/t/centro-tenistico/services | 0 | RESERVAR AHORA (1/2), RESERVAR AHORA (1/2), RESERVAR AHORA (1/2) | Service to Update 1776912678587 [Updated], Visit Service 1776912488123, Service to Update 1776912749654 [Updated] | \_services.png |
| centro-tenistico | /products | true | 200 | ok | http://127.0.0.1:3002/t/centro-tenistico/products | 0 | -, +, Comprar ahora | qwe, Compra Rápida (≤3 clicks), Seleccionar | \_products.png |
| centro-tenistico | /book | true | 200 | ok | http://127.0.0.1:3002/t/centro-tenistico/book | 0 | MON

18th

Libre, TUE

19th

Libre, WED

20th

Libre | HORARIOS DISPONIBLES, TUS DATOS | _book.png |
| centro-tenistico | /contact | true | 200 | ok | http://127.0.0.1:3002/t/centro-tenistico/contact | 0 | - | Contáctanos, Información de Contacto, Teléfono | \_contact.png |
| centro-tenistico | /login | true | 200 | ok | http://127.0.0.1:3002/t/centro-tenistico/login | 0 | Iniciar Sesión, Continuar con Google | Centro Tenístico Villafuerte, Inicia sesión en tu cuenta | \_login.png |
| centro-tenistico | /register | true | 200 | ok | http://127.0.0.1:3002/t/centro-tenistico/register | 0 | Registrarse con Google, Crear cuenta | Centro Tenístico Villafuerte | \_register.png |
| centro-tenistico | /forgot-password | true | 200 | ok | http://127.0.0.1:3002/t/centro-tenistico/forgot-password | 0 | Enviar enlace de recuperación | Recuperar Contraseña | \_forgot_password.png |
| zo-system | / | true | 200 | ok | http://127.0.0.1:3002/t/zo-system | 2 | ←, → | INGENIERÍA DE SOFTWARE
DE ALTO IMPACTO, PROYECTOS & PROTOTIPOS, ECOSMART DASHBOARD | _.png |
| zo-system | /services | true | 200 | ok | http://127.0.0.1:3002/t/zo-system/services | 1 | - | - | \_services.png |
| zo-system | /products | true | 200 | ok | http://127.0.0.1:3002/t/zo-system/products | 1 | - | COMPRA RÁPIDA (≤3 CLICKS), SELECCIONAR, CONFIRMAR | \_products.png |
| zo-system | /book | true | 200 | ok | http://127.0.0.1:3002/t/zo-system/book | 1 | - | AGENDA NO DISPONIBLE | \_book.png |
| zo-system | /contact | true | 200 | ok | http://127.0.0.1:3002/t/zo-system/contact | 1 | - | CONTÁCTANOS, INFORMACIÓN DE CONTACTO, TELÉFONO | \_contact.png |
| zo-system | /login | true | 200 | ok | http://127.0.0.1:3002/t/zo-system/login | 1 | Iniciar Sesión, Continuar con Google | ZO SYSTEM, INICIA SESIÓN EN TU CUENTA | \_login.png |
| zo-system | /register | true | 200 | ok | http://127.0.0.1:3002/t/zo-system/register | 1 | Registrarse con Google, Crear cuenta | ZO SYSTEM | \_register.png |
| zo-system | /forgot-password | true | 200 | ok | http://127.0.0.1:3002/t/zo-system/forgot-password | 1 | Enviar enlace de recuperación | RECUPERAR CONTRASEÑA | \_forgot_password.png |

## Notas técnicas

- El smoke cubre rutas públicas y protegidas con sesión activa.
- Las rutas 404 pueden ser rutas no configuradas o placeholders.
- Los redirects a login en rutas protegidas son el comportamiento esperado sin sesión.
- Se recogen botones, links y headings visibles para auditoría de UI.

---

_Reporte generado automáticamente por Playwright CLI — reporte-general-web.spec.ts_
