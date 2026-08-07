# .agents/skills/ — convención

Esta carpeta es la **fuente canónica** de todos los skills del proyecto. `.claude/skills/`
expone (vía symlink) los que deben ser invocables como `/nombre` en Claude Code.

## Al crear un skill nuevo

1. Escribe el contenido real en `.agents/skills/{nombre}/SKILL.md` (frontmatter YAML con
   `name`, `description`, y opcionalmente `metadata`).
2. Symlink hacia `.claude/skills/{nombre}`:
   ```bash
   ln -s "/c/Dev/Zo/sass-store/.agents/skills/{nombre}" ".claude/skills/{nombre}"
   ```
3. No dupliques contenido en ambos lados — `.claude/skills/{nombre}` debe ser siempre un
   symlink, nunca una copia. Si encuentras un skill con contenido real en `.claude/skills/`
   pero sin el symlink correspondiente en `.agents/skills/`, es una inconsistencia heredada
   (ver `auto-implement` histórico) — mover el contenido a `.agents/skills/` y symlinkear.
4. Si el skill es un placeholder sin implementar todavía, deja el directorio vacío en
   `.agents/skills/` en vez de crear un `SKILL.md` a medias — un directorio vacío documenta la
   intención sin fingir que el skill funciona.

## Índice de skills de gobierno (Project Lead)

Añadidos para la mini-orquestación local — ver `.agents/project-profile.md` para el mapa
completo:

| Skill | Rol |
| ----- | --- |
| `deliver` | Entrypoint `/deliver <actividad>` |
| `project-lead` | Router + gate de revisión independiente + síntesis de estado |
| `model-router` | Reglas deterministas de nivel de modelo/trabajador |
| `implement-story`, `qa-e2e-loop`, `code-review` | Bridges — nombres exactos que espera el skill global `story-to-done` |
| `bugfix` | Ruta rápida para chores/fixes triviales |
