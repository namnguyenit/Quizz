# qtri-quiz

A mobile-first quiz application built with SvelteKit 2, Svelte 5, Tailwind CSS 4, and libSQL (Turso).

## Getting Started

```bash
bun install
bun run dev
```

## Commands

### Development

| Command           | Description              |
| ----------------- | ------------------------ |
| `bun run dev`     | Start development server |
| `bun run build`   | Build for production     |
| `bun run preview` | Preview production build |

### Code Quality

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `bun run check`       | Run type checking (one-time)           |
| `bun run check:watch` | Run type checking (watch mode)         |
| `bun run lint`        | Check ESLint and Prettier              |
| `bun run format`      | Auto-format code with Prettier         |
| `bun run prepare`     | Sync SvelteKit types (runs on install) |

### Quiz Sync

Sync quiz JSON files from `subjects/` directory to the Turso database.

| Command              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `bun run sync`       | Incremental sync: adds new, updates changed, deletes removed |
| `bun run sync:clean` | Full reset: drops all tables and rebuilds from scratch       |
| `bun run sync:add`   | Safe mode: only adds/updates, never deletes                  |

#### Flags

| Flag        | Effect                                        |
| ----------- | --------------------------------------------- |
| `--dry-run` | Preview changes without applying them         |
| `--verbose` | Show detailed progress (each question synced) |

#### Examples

```bash
# Preview what would change
bun run sync --dry-run

# Apply incremental changes
bun run sync

# Full database reset
bun run sync:clean

# Add new quizzes without deleting anything
bun run sync:add

# Combine flags
bun run sync --dry-run --verbose
```

### Utilities

#### Convert Images to WebP

Converts PNG/JPEG images in `static/images/questions/` to WebP format for better compression.

```bash
bun run convert-webp
```

| Setting           | Value                      |
| ----------------- | -------------------------- |
| Input directory   | `static/images/questions/` |
| Quality           | 80%                        |
| Supported formats | `.png`, `.jpg`, `.jpeg`    |

Features:

- Skips files that already have a `.webp` version
- Keeps original files (non-destructive)

Example output:

```
Scanning static/images/questions/ for images to convert...

✅ Converted: diagram.png → diagram.webp
⏭️  Skipped: chart.jpg (chart.webp already exists)

========================================
Done!
  Converted: 1
  Skipped:   1
========================================
```

## Project Structure

```
├── src/
│   ├── app.html                 # HTML template
│   ├── app.css                  # Global styles (Tailwind)
│   ├── app.d.ts                 # TypeScript declarations
│   │
│   ├── lib/                     # Shared utilities ($lib alias)
│   │   ├── config.ts            # App configuration (DEBUG flag, etc.)
│   │   ├── localKeys.ts         # localStorage key constants
│   │   └── theme.ts             # Theme utilities
│   │
│   └── routes/                  # SvelteKit pages & components
│       ├── +layout.svelte       # Root layout (navbar, providers)
│       ├── +page.svelte         # Home page
│       ├── global.svelte.ts     # Global state (Svelte 5 runes)
│       │
│       ├── api/                 # API endpoints
│       │   ├── nav/+server.ts   # GET /api/nav - subject & collection list
│       │   ├── quiz/+server.ts  # GET /api/quiz - questions by collection
│       │   └── module/+server.ts # GET /api/module - questions by module/IDs
│       │
│       └── [Components]         # UI components
│           ├── Carousel.svelte      # Quiz carousel (Embla)
│           ├── QuizCard.svelte      # Individual quiz question card
│           ├── Sidebar.svelte       # Navigation sidebar
│           ├── TopBar.svelte        # Top navigation bar
│           ├── LibraryGrid.svelte   # Quiz collection grid view
│           ├── FavoritesModal.svelte    # Favorites management
│           ├── ShortcutsModal.svelte    # Keyboard shortcuts help
│           └── NewVersionModal.svelte   # Version update notification
│
├── subjects/                    # Quiz data source (JSON files)
│   └── {subject-id}/            # e.g., "project-management"
│       ├── subjectInfo.json     # Subject metadata (name, order, description)
│       └── XX-Quiz-Name.json    # Quiz questions (XX = display order)
│
├── sync_universal.js            # Quiz sync script (JSON → Turso DB)
├── convert_to_webp.js           # Image conversion utility
├── split-quiz-json.js           # Quiz file splitter utility
│
├── svelte.config.js             # SvelteKit configuration
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── eslint.config.js             # ESLint configuration
```

## Data Flow

```
subjects/*.json  ──(sync)──►  Turso DB  ──(API)──►  SvelteKit  ──►  Browser
                                                        │
                                                        ▼
                                                  localStorage
                                                  (favorites, progress)
```

## Database Schema

Three tables in Turso (libSQL):

| Table              | Description                                                                     |
| ------------------ | ------------------------------------------------------------------------------- |
| `subjects`         | Subject metadata (id, name, display_order, description)                         |
| `quiz_collections` | Quiz modules within subjects (id, subject_id, name, display_order)              |
| `questions`        | Individual questions (question_id, collection_id, question_text, answers, etc.) |

## Environment Variables

Create a `.env` file:

```env
TURSO_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```
