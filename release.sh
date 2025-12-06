#!/bin/bash
# Script para crear una release automática desde develop
# Uso: ./release.sh <version>
# Ejemplo: ./release.sh 0.2.0

set -e  # Salir si hay algún error

VERSION=$1
RELEASE_MESSAGE=${2:-"Release v$VERSION"}

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Validar argumentos
if [ -z "$VERSION" ]; then
    log_error "Debes especificar una versión. Uso: ./release.sh <version>"
fi

# Validar formato semver
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "La versión debe tener formato semver: X.Y.Z (ejemplo: 1.0.0)"
fi

log_info "🚀 Iniciando proceso de release v$VERSION..."

# 1. Verificar que estamos en develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    log_error "Debes estar en la rama 'develop' para crear una release"
fi

# 2. Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    log_error "Hay cambios sin commitear. Por favor, commitea o descarta los cambios primero."
fi

# 3. Actualizar desde remoto
log_info "📥 Actualizando develop desde origin..."
git pull origin develop

# 4. Actualizar versión en package.json (develop)
log_info "📝 Actualizando package.json a v$VERSION en develop..."
npm version $VERSION --no-git-tag-version

# 5. Commit del cambio de versión en develop
log_info "💾 Commiteando cambio de versión en develop..."
git add package.json package-lock.json
git commit -m "chore: bump version to v$VERSION"
git push origin develop

# 6. Cambiar a main y actualizar
log_info "🔄 Cambiando a rama main..."
git checkout main
git pull origin main

# 7. Merge de develop a main
log_info "🔀 Mergeando develop en main..."
git merge develop --no-ff -m "chore: merge develop for release v$VERSION"

# 8. Crear tag en main
log_info "🏷️  Creando tag v$VERSION en main..."
git tag -a "v$VERSION" -m "Release v$VERSION"

# 9. Push de main y tag
log_info "⬆️  Pusheando main y tag a GitHub..."
git push origin main
git push origin "v$VERSION"

# 10. Crear release en GitHub
log_info "📦 Creando release en GitHub..."
if command -v gh &> /dev/null; then
    gh release create "v$VERSION" \
        --title "v$VERSION" \
        --notes "$RELEASE_MESSAGE" \
        --latest
    log_success "Release v$VERSION creada en GitHub"
else
    log_warning "GitHub CLI (gh) no está instalado. Debes crear la release manualmente en GitHub."
fi

# 11. Volver a develop y preparar siguiente snapshot
log_info "🔄 Volviendo a develop para preparar siguiente snapshot..."
git checkout develop

# Calcular siguiente versión snapshot (incrementar patch)
IFS='.' read -r -a version_parts <<< "$VERSION"
MAJOR="${version_parts[0]}"
MINOR="${version_parts[1]}"
PATCH="${version_parts[2]}"
NEXT_PATCH=$((PATCH + 1))
NEXT_VERSION="$MAJOR.$MINOR.$NEXT_PATCH-SNAPSHOT"

log_info "📝 Actualizando package.json a $NEXT_VERSION en develop..."
npm version $NEXT_VERSION --no-git-tag-version

# 12. Commit y push de la versión snapshot
log_info "💾 Commiteando versión snapshot en develop..."
git add package.json package-lock.json
git commit -m "chore: bump to next snapshot version $NEXT_VERSION"
git push origin develop

# Resumen final
echo ""
log_success "🎉 Release v$VERSION completada exitosamente!"
echo ""
echo -e "${CYAN}📊 Resumen:${NC}"
echo "  • Versión en main: v$VERSION (tag creado)"
echo "  • Versión en develop: $NEXT_VERSION"
echo ""
echo -e "${CYAN}🐳 GitHub Actions está construyendo las imágenes Docker...${NC}"
echo "  Ver progreso: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
