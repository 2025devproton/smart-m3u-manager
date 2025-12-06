# Smart M3U Manager

<div align="center">

![License](https://img.shields.io/github/license/2025devproton/smart-m3u-manager?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/2025devproton/smart-m3u-manager?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/2025devproton/smart-m3u-manager/docker-publish.yml?branch=main&label=Build%20%26%20Publish&style=flat-square)

[![Docker Pulls](https://img.shields.io/docker/pulls/2025devproton/smart-m3u-manager.svg?style=flat-square)](https://hub.docker.com/r/2025devproton/smart-m3u-manager)
[![Docker Image Size](https://img.shields.io/docker/image-size/2025devproton/smart-m3u-manager/latest.svg?style=flat-square)](https://hub.docker.com/r/2025devproton/smart-m3u-manager)
![Issues](https://img.shields.io/github/issues/2025devproton/smart-m3u-manager?style=flat-square)
![Pull Requests](https://img.shields.io/github/issues-pr/2025devproton/smart-m3u-manager?style=flat-square)

</div>

**Smart M3U Manager** is an intelligent web-based tool designed to streamline the management of M3U playlists for [Dispatcharr](https://github.com/m3u-man/dispatcharr). It simplifies the process of importing, analyzing, grouping, and synchronizing streams into Dispatcharr Channel Profiles.

## Features

- 🔌 **Seamless Connection**: Connects directly to your Dispatcharr instance using API tokens.
- 🧠 **Intelligent Analysis**: Parses M3U playlists and automatically suggests channel groupings based on name similarity.
- 🧹 **Smart Grouping Review**: Interactive wizard to review, merge, or split channel groups before syncing.
- 🔄 **Profile Sync**: Synchronizes your curated channels directly to Dispatcharr Channel Profiles.
- 🐳 **Docker Ready**: Fully dockerized with support for runtime configuration.

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- A running instance of **Dispatcharr**.
- [Docker](https://www.docker.com/) and Docker Compose (recommended).
- OR Node.js 20+ for local development.

### Running with Docker (Recommended)

1.  Clone the repository.
2.  Use the included `docker-compose.yml` file.

```bash
# Start with default settings (Port 7000, connects to localhost:9191)
docker compose up -d --build
```

#### Configuration via Environment Variables

You can configure the application using environment variables in your `docker-compose.yml` or CLI.

| Variable | Description | Default |
|:---|:---|:---|
| `PORT` | Port where the application will listen. | `7000` |
| `DISPATCHARR_URL` | URL of your Dispatcharr instance. | `http://host.docker.internal:9191` |
| `DISPATCHARR_USER` | (Optional) Default username to pre-fill login. | - |
| `DISPATCHARR_PASSWORD` | (Optional) Default password to pre-fill login. | - |

**Example `docker-compose.yml`**:

```yaml
version: '3.8'

services:
  app:
    container_name: smart-m3u-manager
    build: .
    restart: unless-stopped
    ports:
      - "8080:7000" # Maps host 8080 to container 7000
    environment:
      - PORT=7000
      - DISPATCHARR_URL=http://192.168.1.100:9191
      - DISPATCHARR_USER=admin
      - DISPATCHARR_PASSWORD=mysecret
```

### Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).
