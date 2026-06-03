# Testing de Usuario — STRY-022 Quality OS

## Credenciales

- Email: `jagzao@gmail.com`
- Password: `admin`
- Rol: Admin

## Precondiciones

- Proyecto levantado (`npm run dev` en puerto 3001)
- `.agent-reports/quality-report.json` generado
- Sesión de admin activa

---

## Escenarios

### SC-01: Acceso al dashboard de calidad

| Paso | Acción                | Resultado esperado                      |
| ---- | --------------------- | --------------------------------------- |
| 1    | Ir a `/admin/quality` | Se carga la página sin 404              |
| 2    | Verificar título      | Aparece "Panel de Calidad — Quality OS" |
| 3    | Verificar score       | Muestra un número de 0 a 100            |

### SC-02: Visualización de hallazgos

| Paso | Acción                    | Resultado esperado                         |
| ---- | ------------------------- | ------------------------------------------ |
| 1    | En /admin/quality         | Existe tabla/lista con severity (P0/P1/P2) |
| 2    | Expandir/ver primera fila | Muestra mensaje y categoría                |

### SC-03: Accesibilidad básica (desktop + móvil)

| Paso | Acción                | Resultado esperado                     |
| ---- | --------------------- | -------------------------------------- |
| 1    | Redimensionar a 375px | Layout adapta sin overflow horizontal  |
| 2    | Navegar con Tab       | Foco visible en elementos interactivos |

### SC-04: API directa

| Paso | Acción                    | Resultado esperado                        |
| ---- | ------------------------- | ----------------------------------------- |
| 1    | GET `/api/system/quality` | JSON válido con score, findings, lastScan |

---

## Playwright CLI

```bash
# Headed (exploración humana agente)
npm run test:e2e:subset -- --headed --grep "quality"

# Headless (regresión)
npm run test:e2e:subset -- --grep "quality"
```
