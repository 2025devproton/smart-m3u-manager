# Smart M3U Manager - Project Specification

## 1. Project Overview
A web-based intelligent management tool for Dispatcharr. The primary goal is to ingest raw M3U playlists and automatically consolidate duplicate streams (e.g., HD, FHD, Backup versions of "Channel X") into single, unified Channel entities within Dispatcharr, cleaning up the user's library.

## 2. Recommended Tech Stack
Given the requirement for ease of use into a rich web interface, we will use:

- **Framework**: **Next.js 14+ (App Router)**. This allows us to have a React frontend for the interactive UI and server-side API routes to handle heavy text processing (M3U parsing) without lagging the browser.
- **Language**: **TypeScript**. Essential for strongly typing the Dispatcharr API responses and our internal M3U structures.
- **Styling**: **Tailwind CSS**. For rapid, modern, "premium" styling.
- **UI Components**: **shadcn/ui** (based on Radix UI). Provides high-quality, accessible, and customizable components (Tables, Dialogs, Selects) that look professional out of the box.
- **State Management**: **Zustand** or React Context for managing the "Draft" channel list state before saving.

## 3. Core Features & Workflow

### Phase 1: Connection & Source Selection
- **API Connection**: Input Dispatcharr URL and Auth Token (if needed, though endpoints seen are mostly open/token-based).
- **M3U Browser**: List existing `M3UAccount`s from Dispatcharr (`/api/m3u/accounts/`).
- **Selection**: User selects one M3U Account to process.

### Phase 2: Analysis & Intelligence (The Brain)
- **Download & Parse**: The app downloads the raw M3U text from the selected account's URL.
- **Parsing**: detailed extraction of:
  - `tvg-id` (EPG ID)
  - `tvg-name`
  - `group-title`
  - Stream URL
  - Channel Name (clean/raw)
  - Logos
- **Grouping Engine**:
  - The system iterates through all parsed streams.
  - **Strategy A (Primary)**: Match by `tvg-id`. If multiple streams share `tvg-id="ES:Tele5"`, they are grouped.
  - **Strategy B (Secondary)**: Fuzzy name matching. If `tvg-id` is missing, compare names like "Tele 5 FHD" and "Tele 5 HD" -> Group as "Tele 5".
  - **Strategy C (Exact)**: Match by exact channel name.

### Phase 3: Review & Refine (The "Smart" UI)
- **Unified Grid View**: Show the proposed *Channels*, not streams.
  - Example Row: **"Telecinco"** | *3 Streams (FHD, HD, SD)* | *Group: General*
- **Expandable Details**: User can click a row to see the specific streams inside and uncheck/remove bad ones.
- **Manual Merge/Split**: Drag-and-drop or checkbox selection to manually merge disparate groups that the AI missed.

### Phase 4: Execution
- **Target Selection**: Choose a destination **Channel Profile** in Dispatcharr (pick existing or create new).
  - Channel Profiles allow different channel lineups for different devices/users.
- **Batch Creation** (for each selected channel):
  1. Create or find **Channel Group** based on M3U `group-title` (`/api/channels/groups/`).
  2. Create **Stream** entities (`/api/channels/streams/`).
  3. Create **Logo** if provided in M3U (`/api/channels/logos/`).
  4. Create **Channel** with all metadata: name, tvg-id, logo, channel group, and streams (`/api/channels/channels/`).
  5. Assign Channel to selected **Channel Profile** (`/api/channels/profiles/{id}/channels/{id}/`).

## 4. API Documentation

The complete Dispatcharr API specification is available in [dispatcharr_api.json](./dispatcharr_api.json). This Swagger/OpenAPI 2.0 document contains detailed information about all available endpoints, request/response schemas, and authentication requirements.

Key endpoints used by this application:
- `/api/m3u/accounts/` - M3U account management
- `/api/channels/profiles/` - Channel profile management
- `/api/channels/groups/` - Channel group management
- `/api/channels/channels/` - Channel CRUD operations
- `/api/channels/streams/` - Stream management

## 5. detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DispatcharrAPI

    User->>App: Select M3U Account
    App->>DispatcharrAPI: GET /api/m3u/accounts/
    DispatcharrAPI-->>App: Return Account (URL)
    App->>External: Download M3U File
    App->>App: Parse & Auto-Group Streams
    App-->>User: Display Review Dashboard
    User->>App: Adjust Groups / Confirm
    User->>App: Select Target Channel Profile
    loop For each Channel
        App->>DispatcharrAPI: POST /api/channels/groups/ (Create/Find Channel Group)
        App->>DispatcharrAPI: POST /api/channels/streams/ (Create Streams)
        App->>DispatcharrAPI: POST /api/channels/logos/ (Create Logo if needed)
        App->>DispatcharrAPI: POST /api/channels/channels/ (Create Channel with metadata)
        App->>DispatcharrAPI: PATCH /api/channels/profiles/{id}/channels/{id}/ (Assign to Profile)
    end
    App-->>User: Success Report
```

## 6. grouping Strategies Draft

1.  **Strict ID Match**:
    - Key: `tvg-id`
    - Action: All entries with identical non-empty `tvg-id` are merged.
2.  **Name Normalization Match**:
    - Key: Channel Name
    - Normalization: Remove tags like `[FHD]`, `(HD)`, `|ES|`, `50FPS`.
    - Action: If `normalize(A) == normalize(B)`, merge.

## 7. Implementation Notes

### API Flow
- **Streams First**: `/api/channels/channels/` POST accepts `streams: integer[]`, so streams must be created before the channel.
- **Channel Groups**: Channel groups are created/retrieved by name. Channels are assigned to groups via `channel_group_id`.
- **Channel Profiles**: Separate from channel groups. Profiles define which channels are available to specific users/devices.
- **Metadata Requirements**: For proper Dispatcharr functionality with stream codes, channels must include:
  - `tvg_id` - EPG identifier from M3U
  - `logo_id` - Reference to created logo
  - `channel_group_id` - Reference to channel group

### Duplicate Handling
Currently, the tool does not check for existing channels. Re-running the sync will create duplicate channels. Future enhancement could include:
- Checking for existing channels by name or tvg-id
- Updating existing channels instead of creating duplicates
```
