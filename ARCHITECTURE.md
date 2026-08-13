# AI Voiceover Studio — Design Document (v1)

## Overview
A MERN app that lets a content creator paste a script, preview it against multiple
Google Cloud TTS voices, generate a final voiceover, and export the audio plus an
auto-generated subtitle file — organized by project (vlog episode).

## Core workflow
1. User creates a Project (a vlog episode)
2. User adds/edits a Script inside that project (versioned)
3. User previews the script against multiple voices
4. User picks a voice → triggers full generation (async job)
5. User downloads: MP3 audio + SRT/VTT subtitle file

## Data model

```
User
 └── Projects (vlog episodes)
      └── Scripts (versioned, isCurrent flag marks active version)
           └── AudioGeneration (per voice attempt: status, audioUrl, transcriptUrl, charCount)
```

### Collections

**User**
- _id, name, email, passwordHash, createdAt

**Project**
- _id, userId (ref), title, description, status (draft/in_progress/completed), createdAt, updatedAt

**Script**
- _id, projectId (ref), versionNumber, content, isCurrent, charCount, createdAt

**AudioGeneration**
- _id, scriptId (ref), projectId (ref, denormalized for fast project-level queries),
  voiceId, voiceLabel, status (queued/processing/completed/failed),
  audioUrl, transcriptUrl, durationSeconds, charCount, createdAt

### Key design decisions
- **Script separated from AudioGeneration** — one script version can be tested against
  multiple voices without duplicating text.
- **isCurrent flag on Script** — avoids a separate "current version pointer" on Project.
- **projectId denormalized on AudioGeneration** — trades normalization for fast
  "all audio for this project" queries.
- **charCount tracked at generation time** — foundation for future usage-based billing;
  cheap to add now, expensive to retrofit later.

## API contract

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login` → returns JWT
- `GET /api/auth/me` (protected)

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id` (cascades: scripts + audio)

### Scripts
- `GET /api/projects/:projectId/scripts`
- `POST /api/projects/:projectId/scripts` (new version, auto-increments versionNumber)
- `GET /api/scripts/:id`
- `PATCH /api/scripts/:id/set-current`
- `DELETE /api/scripts/:id`

### Voices
- `GET /api/voices` (cached list of Google TTS voices)
- `POST /api/voices/preview` (short sample clip)

### Audio generation (async job pattern)
- `POST /api/generate` → body: `{scriptId, voiceId}`, returns job id immediately
- `GET /api/generate/:id/status` → client polls this (queued/processing/completed/failed)
- `GET /api/projects/:projectId/audio`
- `DELETE /api/audio/:id`

**Why async job + polling, not a blocking call:** TTS generation takes a few seconds.
Blocking the HTTP request risks timeouts and bad UX. Polling every 1-2s is simple to
build and feels real-time for a task this short. WebSockets are a legitimate v2 upgrade
if long-running jobs (e.g. batch generation, voice cloning) get added later.

## System architecture

```
React client  →  Express server  →  MongoDB (users, projects, scripts, jobs)
                       ↓
                Google Cloud TTS (generates audio)
                       ↓
                Cloud storage (MP3 + SRT files)
```

## Folder structure

### server/
```
config/db.js              MongoDB connection
models/                   User, Project, Script, AudioGeneration
controllers/               HTTP request/response handling per resource
routes/                    Express route definitions per resource
middleware/                authMiddleware (JWT verify), errorMiddleware
services/
  ttsService.js            All Google Cloud TTS calls — isolated
  storageService.js        File upload/save logic — isolated
index.js                   Server entry point
```

**Why services are separate from controllers:** controllers handle HTTP in/out.
Services hold business logic (calling Google's API, saving files). Swapping TTS
providers later means touching only `ttsService.js` — nothing else changes.

### client/src/
```
components/     VoicePicker, ScriptEditor, AudioPlayer, ProjectCard
pages/          Login, Register, Dashboard, ProjectDetail
context/        AuthContext (global logged-in user state)
services/api.js All Axios calls centralized — one place for base URL, auth headers, error handling
hooks/          usePolling.js — reusable status-polling logic
```

## Tech decisions log
| Decision | Choice | Reason |
|---|---|---|
| TTS provider | Google Cloud TTS | Most generous free tier (1M chars/mo), full SSML control, no cost anxiety |
| Repo structure | Single repo, client/ + server/ folders | Simpler than workspaces; matches typical deploy targets |
| Status updates | Polling | TTS jobs are short (seconds); WebSockets are unjustified complexity for v1 |
| Script edits | Versioned, not overwritten | Enables compare/revert; realistic "revision history" data model |
| Usage limits | Tracked but not enforced (v1) | Building for solo use now; usage data laid down early for future billing |

## Status
v1 scope locked. Building for single-user (solo) use first; multi-user auth and
subscription billing are architected for but deferred to v2.
