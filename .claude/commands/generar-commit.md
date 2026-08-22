---
description: Analiza los cambios pendientes y propone un mensaje de commit siguiendo Conventional Commits
---

Analiza los cambios recientes del repositorio (`git status`, `git diff`, `git diff --stat`) y proponme uno o más mensajes de commit claros siguiendo la convención **Conventional Commits** (`tipo(scope): descripción`, con cuerpo si hace falta explicar el porqué).

Reglas a seguir:
- Si hay cambios que corresponden a unidades lógicas distintas (por ejemplo, un refactor de código y un documento nuevo), proponé commits separados en vez de mezclarlos en uno solo.
- Usá el tipo correcto (`feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `test`, etc.) según lo que realmente cambió.
- El mensaje debe explicar el *porqué* del cambio, no solo repetir la lista de archivos.
- No ejecutes `git add` ni `git commit` todavía — solo mostrame el/los mensaje(s) propuestos y esperá mi confirmación antes de commitear.
