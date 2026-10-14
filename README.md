# NumberKanta 🎤

An offline-first, Android-first karaoke/videoke mobile application recreating the familiar song-number workflow of a traditional videoke machine.

## Current Status: Phase 1 Completed (UI & Navigation Prototype)

- **Keypad Screen (`/`)**: Large touch-friendly numeric keypad (0–9), vintage LED digital song number display with leading zeros preserved, instant search preview card, and *Play Now* / *Add to Queue* actions.
- **Songbook Screen (`/songbook`)**: Scrollable library with title/artist search, favorites filter, prominent song number badges, and quick queue/play triggers.
- **Queue Screen (`/queue`)**: "Now Singing" widget, up-next ordered list with up/down reorder buttons, remove song, and clear queue with confirmation.
- **Player Screen (`/player`)**: Fullscreen-ready videoke stage layout with lyrics mockup, bouncing ball prompt, elapsed/duration timer, seekbar, and player controls.
- **Import Screen (`/import`)**: Modal interface for assigning unique song numbers, titles, and artists to local video files.

---

## Getting Started

### Prerequisites

- Node.js (v20+ or v22+)
- Android device or emulator with Expo Go or Development Build

### Installation

```bash
npm install
```

### Running Locally

```bash
npx expo start
```

Press `a` in the terminal to open on a connected Android device or emulator, or scan the QR code using Expo Go.

### Quality Checks

```bash
# TypeScript Typecheck
npx tsc --noEmit

# ESLint
npx expo lint

# Expo Doctor Dependency & Config Diagnostics
npx expo-doctor
```

---

## Technical Specification

See [NumberKanta-Spec.md](NumberKanta-Spec.md) for full architecture, roadmap stages, and database schema.
