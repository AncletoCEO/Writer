# Fixtures

| Fixture | Cubre |
|---|---|
| `empty/` | repositorio sin archivos fuente |
| `mixed/` | JS, TS, JSX y TSX; imports, llamadas y herencia |
| `monorepo/` | `baseUrl` + `paths` (`@core/*`) y re-exports |
| `cycles/` | ciclo de imports y self-loop |
| `skipped/` | base para omitidos; el test agrega un symlink y un archivo grande en una copia temporal |

Los casos que requieren symlinks o archivos > 1 MiB se generan en el test para no inflar el
repositorio.
