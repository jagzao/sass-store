# Sprint por User Story

Cada story activa (`docs/stories/active/STRY-XXX-*.md`) tiene una carpeta homónima aquí:

```
.agents/sprint/{STRY-XXX-nombre-corto}/
├── plan.md              # Plan de ejecución autónomo (orden, archivos, APIs, riesgos)
├── implementacion.md    # CA → código → tests; desarrollo, QA de punta a punta, definición de hecho
└── testing-usuario.md   # Pasos reproducibles para agente/Playwright (no manual del PO); base de `test:e2e:subset`
```

## Flujo (orden estricto, autonomía)

1. **Fase 0 + PM:** story activa → tres archivos; **bloque único de preguntas** al inicio o “cero preguntas”; **`plan.md` completo** (pasos numerados, asunciones) antes de codificar en serio.
2. **Architect** → **Dev** → **QA** en secuencia **sin** pedir autorización entre fases (`AGENTS.md` § 3).
3. Si QA falla: **bucle Dev ⟲ QA** (fixes + Playwright CLI de nuevo) hasta verde o tope de ciclos.
4. Con todo verde: el agente **notifica** al usuario (implementado + validado); pendiente **reviewer** (skill `pr-reviewer` en `.agents/skills/pr-reviewer/SKILL.md`) + **visto bueno** para `done`/merge/deploy.

Protocolo: `.agents/protocols/story-orchestrator.md`.

## Definición de hecho y publicación

Tras **codificar** el plan de la US: pruebas con **Playwright CLI** como una persona (**`--headed`** primero, luego specs + headless) — ver `AGENTS.md` “Transición obligatoria: tras la codificación”.

No marcar la story como **completa** ni hacer **push/deploy** hasta cumplir `AGENTS.md` § **1.2** y § **1.3**: `testing-usuario.md` basado en la US (incl. **cada tenant activo** listado en el doc), proyecto levantado, acceso con `jagzao@gmail.com`/`admin` **por slug** (o corregido con seed/usuario), **todos** los casos ejecutados con éxito por el agente (exploración tipo usuario + **Playwright CLI** headed y headless), luego UT; después **visto bueno del dueño** (no segunda ronda de QA). Luego `done`, `completed/`, commit, push, publicar. Ver `AGENTS.md` § 1.4.
