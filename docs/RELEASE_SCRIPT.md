# Script de Release Automático

Este script automatiza el proceso completo de creación de releases desde la rama `develop`.

## Requisitos

- Git configurado
- Node.js y npm instalados
- GitHub CLI (`gh`) instalado (opcional, para crear releases automáticamente)
  ```bash
  # Ubuntu/Debian
  sudo apt install gh
  
  # Autenticarse
  gh auth login
  ```

## Uso

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x release.sh

# Crear una release
./release.sh <version> [mensaje]

# Ejemplo simple
./release.sh 0.2.0

# Ejemplo con mensaje personalizado
./release.sh 0.2.0 "Release con migración a Node 22 y React 19"
```

## Flujo del Script

El script realiza automáticamente los siguientes pasos:

1. **Validaciones iniciales**
   - Verifica que estés en la rama `develop`
   - Verifica que no haya cambios sin commitear
   - Valida el formato de versión (semver)

2. **Actualización de versión en develop**
   - Actualiza `package.json` a la versión especificada
   - Commitea el cambio: `chore: bump version to vX.Y.Z`
   - Pushea a `origin/develop`

3. **Merge a main**
   - Cambia a la rama `main`
   - Mergea `develop` en `main`
   - Crea el tag `vX.Y.Z`
   - Pushea `main` y el tag a GitHub

4. **Creación de release en GitHub**
   - Si tienes `gh` instalado, crea la release automáticamente
   - Esto dispara el workflow de GitHub Actions para construir las imágenes Docker

5. **Preparación de siguiente snapshot**
   - Vuelve a `develop`
   - Incrementa la versión patch y añade `-SNAPSHOT`
   - Ejemplo: si liberaste `0.2.0`, develop quedará en `0.2.1-SNAPSHOT`
   - Commitea y pushea el cambio

## Ejemplo Completo

```bash
# Estado inicial
# develop: 0.1.0-SNAPSHOT
# main: 0.1.0

./release.sh 0.2.0

# Estado final
# develop: 0.2.1-SNAPSHOT
# main: 0.2.0 (con tag v0.2.0)
```

## Tags de Docker Generados

Después de ejecutar el script, GitHub Actions construirá automáticamente:

- `2025dev/smart-m3u-manager:0.2.0`
- `2025dev/smart-m3u-manager:0.2`
- `2025dev/smart-m3u-manager:0`
- `2025dev/smart-m3u-manager:latest`

## Troubleshooting

### Error: "GitHub CLI (gh) no está instalado"
El script funcionará igualmente, pero deberás crear la release manualmente en GitHub:
1. Ve a https://github.com/tu-usuario/smart-m3u-manager/releases
2. Click en "Draft a new release"
3. Selecciona el tag que se creó
4. Publica la release

### Error: "Hay cambios sin commitear"
Commitea o descarta tus cambios antes de ejecutar el script:
```bash
git status
git add .
git commit -m "tu mensaje"
```
