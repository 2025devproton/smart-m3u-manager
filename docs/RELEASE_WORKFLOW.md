# Workflow de Releases y Versionado

Este documento explica la estrategia de ramas y releases para integrar **GitHub** y **DockerHub** de forma automatizada mediante GitHub Actions.

## Estrategia de Ramas (Git Flow Simplificado)

Utilizaremos dos ramas principales:

1.  `develop`: Carpeta de trabajo continuo. Aquí se integran las nuevas features.
2.  `main`: Rama de producción. Solo contiene código estable y listo para release.

### Ciclo de Vida

1.  **Desarrollo**:
    *   Se trabaja en ramas `feature/nombre-feature`.
    *   Se hace **Pull Request (PR)** hacia `develop`.
    *   Al mezclar en `develop`, se genera una imagen Docker con el tag `:develop`.

2.  **Release (Paso a Producción)**:
    *   Se hace un **Pull Request** de `develop` hacia `main`.
    *   Al mezclar en `main`, se genera una imagen Docker con el tag `:latest`.

3.  **Versionado (Tags)**:
    *   Para crear una versión fija (ej. `v1.0.0`), se crea una **Release** en GitHub (o se pushea un tag).
    *   Esto dispara un build que genera imágenes Docker con los tags `:v1.0.0`, `:v1.0` y `:v1`.

## Tags de DockerHub Generados

| Evento | Rama/Tag Git | Docker Tag Resultante | Propósito |
| :--- | :--- | :--- | :--- |
| Push/Merge | `develop` | `:develop` | Entorno de Pruebas / Beta |
| Push/Merge | `main` | `:latest` | Producción "Bleeding Edge" |
| Release | `v1.2.3` | `:1.2.3`, `:1.2`, `:latest`* | Producción Versionada |

*> Nota: El tag `latest` se suele actualizar con la rama `main`, pero dependiendo de la configuración puede apuntar también a la última release estable.*

## Cómo Configurar GitHub Actions

El archivo `.github/workflows/docker-publish.yml` debe configurarse para escuchar estos eventos.

### 1. Triggers (`on`)

```yaml
on:
  push:
    branches: [ "main", "develop" ] # Escuchar ambas ramas
    tags: [ 'v*.*.*' ]              # Escuchar tags de versión
  pull_request:
    branches: [ "main", "develop" ] # Validar PRs (sin subir a DockerHub)
```

### 2. Extracción de Metadatos

La acción `docker/metadata-action` gestiona automáticamente los tags:

*   Si es rama `main` -> `type=raw,value=latest`
*   Si es rama `develop` -> `type=ref,event=branch` (genera `:develop`)
*   Si es tag `v1.2.3` -> `type=semver` (genera `:1.2.3`, `:1.2`, etc)

## Pasos para crear una Release

1.  Asegúrate que `develop` está probada.
2.  Haz merge de `develop` a `main`.
3.  En GitHub, ve a **Releases** > **Draft a new release**.
4.  Crea un nuevo tag (ej: `v1.0.0`).
5.  Dale título y descripción.
6.  Publica la release.
7.  GitHub Actions compilará y subirá las imágenes versionadas a DockerHub automáticamente.
