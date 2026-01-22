# Sanctuary

A cloud-native worship presentation platform that reimagines FreeShow's functionality with the aesthetic polish of Notion and the intuitive workflow of Google Slides.

For in-depth documentation, including architecture, development setup, and detailed component breakdowns, please refer to the [documentation directory](./docs/README.md).

## ✨ Features

- **Modern Slide Editor** - Canvas-based editor with horizontal filmstrip, real-time collaboration
- **Multi-Language Bible** - English, Japanese (日本語), Spanish (Español) with offline support
- **Song Library** - Manage lyrics with verse organization and CCLI tracking
- **Live Presentation** - Full-screen presentation mode with presenter view
- **Real-time Collaboration** - Work together with your team in real-time
- **Offline Support** - IndexedDB caching for Bible versions and presentations
- **Desktop App** - Electron wrapper with MIDI/OSC support for professional setups

## 🛠️ Tech Stack

- **Backend**: Convex (real-time database)
- **Auth**: BetterAuth (multi-tenant support)
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Desktop**: Electron with native MIDI/OSC
- **Mobile**: PWA with Capacitor fallback

## 📁 Project Structure

```
sanctuary/
├── apps/
│   ├── web/              # React web application
│   └── electron/         # Electron desktop wrapper
├── packages/
│   ├── convex/          # Convex backend (schema, functions)
│   ├── shared/          # Shared types and constants
│   └── ui/              # Shadcn-style UI components
└── package.json         # Monorepo root
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Convex account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sanctuary.git
cd sanctuary

# Install dependencies
pnpm install

# Set up Convex
cd packages/convex
npx convex dev  # This will prompt you to create a project

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Convex URL

# Start development
pnpm dev
```

### Development

```bash
# Start all services
pnpm dev

# Run web app only
pnpm --filter @sanctuary/web dev

# Run Convex backend only
pnpm --filter @sanctuary/convex dev

# Build for production
pnpm build

# Type check
pnpm typecheck
```

## 📖 Bible Versions

Sanctuary supports multiple Bible translations with offline caching:

### English
- NIV (New International Version)
- ESV (English Standard Version)
- KJV (King James Version)
- NLT (New Living Translation)

### 日本語 (Japanese)
- 口語訳 (Kougo-yaku)
- 新改訳 (Shinkaiyaku)
- JLB (Japanese Living Bible)

### Español (Spanish)
- RVR1960 (Reina-Valera 1960)
- NVI (Nueva Versión Internacional)
- LBLA (La Biblia de las Américas)

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ K` | Command palette |
| `⌘ N` | New presentation |
| `⌘ B` | Open Bible |
| `⌘ ⇧ P` | Start presentation |
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `Esc` | Exit presentation |
| `F` | Toggle fullscreen |

## 🎨 Design Philosophy

Sanctuary blends:
- **Notion**: Sidebar navigation, command palette (⌘K), hover actions
- **Google Slides**: Horizontal filmstrip, canvas editor, selection handles
- **Original**: Glass morphism, warm neutrals, liturgical calendar accents

## 📄 License

MIT © Sanctuary Team
