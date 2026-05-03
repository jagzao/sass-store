# Sprint por User Story

Cada story activa (`docs/stories/active/STRY-XXX-*.md`) tiene una carpeta homónima aquí:

```
.agents/sprint/{STRY-XXX-nombre-corto}/
├── plan.md              # Plan de ejecución autónomo (orden, archivos, APIs, riesgos)
├── implementacion.md    # CA → código → tests; desarrollo, QA de punta a punta, definición de hecho
└── testing-usuario.md   # Pasos reproducibles para agente/Playwright (no manual del PO); base de `test:e2e:subset`
```

## Flujo

1. PM activa story → crear o completar los tres archivos.
2. Architect / Dev → actualizar `plan.md` e `implementacion.md`.
3. QA → ejecutar y refinar `testing-usuario.md`, luego generar `tests/e2e/*.spec.ts`.

Protocolo: `.agents/protocols/story-orchestrator.md`.

## Definición de hecho y publicación

Tras **codificar** el plan de la US: pruebas con **Playwright CLI** como una persona (**`--headed`** primero, luego specs + headless) — ver `AGENTS.md` “Transición obligatoria: tras la codificación”.

No marcar la story como **completa** ni hacer **push/deploy** hasta cumplir `AGENTS.md` § **1.2** y § **1.3**: `testing-usuario.md` basado en la US (incl. **cada tenant activo** listado en el doc), proyecto levantado, acceso con `jagzao@gmail.com`/`admin` **por slug** (o corregido con seed/usuario), **todos** los casos ejecutados con éxito por el agente (exploración tipo usuario + **Playwright CLI** headed y headless), luego UT; después **visto bueno del dueño** (no segunda ronda de QA). Luego `done`, `completed/`, commit, push, publicar. Ver `AGENTS.md` § 1.4.
