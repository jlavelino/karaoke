# NumberKanta — Offline Android Karaoke App Specification

> **Working name:** NumberKanta (provisional; check name availability before public release).
> **Product type:** Offline-first, Android-first karaoke/videoke application for personal home use.
> **Status:** Initial product specification. Treat decisions marked “MVP” as the current scope; do not silently add features outside it.

---

## 1. Product Overview

Build a mobile karaoke app that recreates the familiar song-number workflow of a traditional videoke machine, but runs directly on an Android phone or tablet.

The user has a collection of existing karaoke video files stored locally. The app imports those files, associates each with a song number and metadata, and plays the selected video on the same phone or tablet. Lyrics and music are expected to be embedded in the video for the MVP.

**The app must work without an internet connection after installation.** Core catalog, lookup, queue, favorites, history (if implemented), and playback functionality must be local. Do not require an account, cloud database, or online service.

### Product goals

- Reproduce the familiar “enter a song number and play” videoke experience.
- Make a local collection of karaoke videos easy to organize and browse.
- Play karaoke videos directly on the Android device.
- Support both phones and tablets with a touch-friendly interface.
- Keep the core experience reliable in airplane mode.

### Target users and devices

- Primary user: one person using the app at home.
- Primary platform: Android phones and tablets.
- Phone orientation: portrait-friendly browsing and number entry; fullscreen playback may use landscape.
- Tablet layout: may use a landscape split view for songbook and queue.
- **Not in current scope:** TV output, online streaming, cloud sync, multi-user accounts, voice scoring, payments, or a Windows build.

---

## 2. Traditional Videoke Workflow to Recreate

The intended interaction resembles a traditional videoke machine:

1. The user opens a digital songbook or enters a song number using a large on-screen keypad.
2. The app looks up the song number in its local catalog.
3. The app shows the song title and artist, if known.
4. The user chooses **Play Now** or **Add to Queue**.
5. The app plays the matching local karaoke video, including its embedded lyrics and backing music.
6. When a queued song finishes, the next queued song can start automatically.
7. The user can pause, resume, seek, adjust volume, or skip to the next song.

Song numbers must be stored as **text**, not numeric values, so leading zeros such as `0012` are preserved.

---

## 3. MVP Scope

### Required features

- [ ] Home screen with a large numeric keypad.
- [ ] Lookup by song number.
- [ ] Local songbook/library list.
- [ ] Search by song title and artist.
- [ ] Song detail or confirmation view with title, artist, and number.
- [ ] Play Now action.
- [ ] Add to Queue action.
- [ ] Queue list with remove and reorder controls.
- [ ] Local video playback.
- [ ] Playback controls: play/pause, seek, skip/next, and fullscreen.
- [ ] Automatic next-song playback when the current song finishes, if the queue is not empty.
- [ ] Import video files from device-accessible local storage.
- [ ] Associate imported videos with song number, title, and optional artist.
- [ ] Persistent catalog and queue across app restarts.
- [ ] Favorites, if feasible without delaying the core flow.
- [ ] Clear handling for missing, unsupported, or unreadable media files.
- [ ] Fully usable core features with the device in airplane mode.

### Later enhancements — do not build before the MVP works

- Separate synchronized lyrics such as LRC or SRT files.
- Local Wi-Fi transfer between devices.
- Support for media stored on external USB drives.
- Optional Windows version.
- Microphone mixing or vocal effects.
- Voice scoring.
- Cloud backup or synchronization.
- Online song search or downloading.

---

## 4. Importing and Managing Local Media

Users supply their own karaoke video files. The app should not bundle copyrighted karaoke videos unless the project has the required rights.

### Import workflow

1. User taps **Import Video**.
2. Android's system file picker opens.
3. User selects a local video file.
4. App copies the selected file into app-managed storage so it remains available reliably offline.
5. App asks for or collects:
   - Song number (required, unique)
   - Song title (required)
   - Artist (optional)
6. App validates the entry and saves the media reference and metadata in the local database.
7. App reports success or a useful error.

### Media management requirements

- Do not rely on a temporary picker URI that may stop working later.
- Store a stable app-managed relative file path or media identifier in the database.
- Avoid overwriting an existing song accidentally.
- Detect duplicate song numbers and ask the user how to resolve them.
- Warn the user if storage space is insufficient.
- If import is cancelled or fails, do not leave a broken database record.
- Provide a way to remove a song and its imported file, with confirmation.
- On playback, handle files that have gone missing or become unreadable.
- Keep database metadata and copied media consistent; use safe cleanup when a database write fails.
- Consider large files and long copy operations. Show progress if practical.
- Do not attempt to upload media to a server.

### First test media format

Use a known-good **MP4 file with H.264 video and AAC audio** for initial playback testing. Validate playback on actual target Android devices; do not assume every codec or container will work on every device.

For the MVP, lyrics should be embedded in the video. Do not implement lyric synchronization unless specifically requested later.

---

## 5. Recommended Technology Stack

The developer already has experience with React and TypeScript, so the initial recommendation is **React Native + Expo + TypeScript**.

Suggested starting stack:

- **App UI:** React Native
- **Language:** TypeScript
- **Project/runtime:** Expo, with a development build if required by native functionality
- **Navigation:** Expo Router (or another consistent React Native navigation solution)
- **Local database:** `expo-sqlite`
- **File selection:** `expo-document-picker`
- **File management:** `expo-file-system`
- **Video playback:** `expo-video`
- **Platform-specific code:** isolate Android-specific functionality behind small service modules

Before implementation, verify that the selected package versions and Expo SDK support the exact local-file import, file-copy, and video playback behavior needed. Test on a physical Android device early. Do not assume Expo Go supports every native capability; use a development build when required.

### Architecture

Use a simple local-first architecture:

`React Native screens → application services → SQLite database + app-managed media files`

- **Screens/UI:** keypad, songbook, queue, library management, and player.
- **Services:** song lookup, catalog management, queue management, media import, and playback orchestration.
- **Database:** metadata, favorites, and queue order.
- **File storage:** imported video files stored locally on the device.
- **No backend is required for the MVP.** Do not add Supabase, Firebase, authentication, or a server unless the user later changes the requirements.

Keep UI components separate from database and file-system operations. Use typed service interfaces and handle errors explicitly.

---

## 6. Local Database Design

Use SQLite for persistent metadata. Enable foreign-key enforcement and use transactions for multi-step changes.

### `songs`

| Column | Suggested type | Purpose |
|---|---|---|
| `id` | TEXT or INTEGER primary key | Internal song identifier |
| `song_number` | TEXT UNIQUE NOT NULL | Traditional videoke number; preserve leading zeros |
| `title` | TEXT NOT NULL | Song title |
| `artist` | TEXT nullable | Artist name |
| `media_path` | TEXT NOT NULL | Stable app-managed relative path or media identifier |
| `duration_seconds` | INTEGER nullable | Duration, if available |
| `created_at` | TEXT or INTEGER | Import/creation timestamp |
| `updated_at` | TEXT or INTEGER | Last update timestamp |

### `queue_items`

| Column | Suggested type | Purpose |
|---|---|---|
| `id` | TEXT or INTEGER primary key | Queue entry identifier |
| `song_id` | Same type as `songs.id`, foreign key | Referenced song |
| `position` | INTEGER NOT NULL | Queue order |
| `added_at` | TEXT or INTEGER | When the item was added |

A queue can contain the same song more than once unless a product decision is made to prevent duplicates. Make the behavior consistent and clear in the UI.

### `favorites` (optional MVP feature)

| Column | Suggested type | Purpose |
|---|---|---|
| `song_id` | Same type as `songs.id`, primary key and foreign key | Favorited song |
| `created_at` | TEXT or INTEGER | When favorited |

### Data rules

- Song numbers are strings and unique.
- Validate required fields before writing.
- Use parameterized SQL queries.
- Use transactions when adding/removing/reordering queue entries.
- Ensure queue items cannot reference deleted songs.
- Decide how to handle deleting a song that is in the queue; remove or invalidate related queue entries safely.
- Keep schema changes in migrations rather than relying only on ad hoc database creation code.
- Do not store the video binary inside SQLite.

---

## 7. Screen and UX Requirements

Use a high-contrast dark interface suitable for use from a short distance, with large touch targets and readable text. Visual styling should be clean and simple; do not overcomplicate the initial UI.

### Screen A — Home / Number Keypad

- Large numeric keypad (0–9).
- Current song-number entry displayed prominently.
- Clear/backspace control.
- **Search/Find Song** action.
- **Play Now** and **Add to Queue** after a valid song is found.
- Shortcut to open the songbook/library.
- Clear feedback when a number is not found.

### Screen B — Songbook / Library

- Scrollable list of imported songs.
- Search field for title or artist.
- Song number shown clearly alongside title.
- Play Now and Add to Queue actions.
- Optional favorite toggle.
- Empty state with an **Import Video** action.

### Screen C — Queue

- Shows songs in playback order.
- Play selected item now, remove item, and reorder items.
- Clear queue action with confirmation.
- Persist queue order after app restart.
- Show a useful empty state when no songs are queued.

### Screen D — Player

- Video displayed prominently; support fullscreen playback.
- Play/pause.
- Seek bar and elapsed/duration labels when available.
- Next/skip control.
- Show current song number, title, and artist when practical.
- After a song ends, play the next queued song automatically.
- If there is no next song, remain on the player or return to a sensible idle state.
- Gracefully handle an unreadable/missing file and let the user skip it.

### Screen E — Library Management / Import

- Import local video.
- View imported songs.
- Edit song number, title, or artist.
- Remove song with confirmation.
- Display useful import and storage errors.
- Do not make internet access a prerequisite.

### Responsive behavior

- Phone: prioritize the keypad and simple navigation; avoid crowded controls.
- Tablet: in landscape, optionally show songbook and queue side-by-side.
- Ensure controls have generous spacing and are comfortable to tap.
- Handle portrait/landscape changes during playback.

---

## 8. Application Logic and Playback Rules

Implement and test these behaviors explicitly:

1. **Number lookup:** exact match on the text song number.
2. **Leading zeros:** `0012` and `12` are different values unless the user deliberately chooses a normalization rule. Default to preserving the exact entered number.
3. **Play Now:** play the selected song immediately. Define a consistent policy for whether the current song is stopped and whether the selected song remains in the queue.
4. **Add to Queue:** append the selected song to the end of the queue and persist the new order.
5. **Queue reorder:** update all affected positions in a transaction.
6. **Song completion:** remove or advance the completed queue item according to a clearly defined queue policy, then play the next item.
7. **Manual skip:** advance to the next queue item. Handle the empty queue without crashing.
8. **App interruption:** respond safely when the app is backgrounded, the device locks, audio focus changes, or playback is interrupted. The MVP can pause on backgrounding if reliable background playback is not required.
9. **App restart:** restore the catalog and saved queue. Do not assume a previous temporary player state is still valid.
10. **Missing media:** show a helpful message and allow the user to remove or skip the affected song.
11. **Database or filesystem error:** show a useful message and avoid corrupting catalog or queue state.

Document any unresolved behavior as an explicit decision instead of silently implementing inconsistent rules.

---

## 9. Offline-First Requirements

After installation, the core app must operate with Wi-Fi and mobile data disabled.

Must work offline:

- Opening the app.
- Viewing the local songbook.
- Searching titles and artists.
- Entering and looking up song numbers.
- Adding, removing, and reordering the queue.
- Playing imported local videos.
- Managing favorites, if implemented.
- Importing files already accessible on the device.
- Retaining catalog and queue data across app restarts.

No internet dependency for the MVP:

- No sign-in.
- No cloud database.
- No remote API calls.
- No streaming.
- No online song metadata lookup.
- No analytics requirement that blocks the app from working offline.

Test in airplane mode on a real Android phone or tablet.

---

## 10. Suggested Project Structure

Adapt this structure to the current Expo SDK and routing setup; do not force files into it if the chosen framework conventions differ.

```text
numberkanta/
├── app/                         # Expo Router screens/routes
├── src/
│   ├── components/
│   │   ├── NumberKeypad.tsx
│   │   ├── SongListItem.tsx
│   │   ├── SongQueue.tsx
│   │   └── PlayerControls.tsx
│   ├── services/
│   │   ├── songService.ts
│   │   ├── queueService.ts
│   │   ├── mediaImportService.ts
│   │   └── playbackService.ts
│   ├── database/
│   │   ├── database.ts
│   │   └── migrations.ts
│   ├── platform/
│   │   └── mediaStorage.ts
│   ├── hooks/
│   │   └── usePlayback.ts
│   └── types/
│       └── song.ts
├── assets/
├── app.json
├── package.json
└── README.md
```

Do not mix all logic into one screen component. Keep the app small, but maintain clear boundaries between UI, database access, media storage, and playback.

---

## 11. Implementation Roadmap

Build in small, testable stages. Keep the project runnable at each stage.

### Stage 1 — Project setup and UI prototype

- Create the Expo + React Native + TypeScript app.
- Build the home keypad, songbook, queue, and player layouts using mock data.
- Add navigation and responsive phone/tablet layouts.
- Confirm the project runs on an actual Android device.

**Acceptance:** User can navigate the screens and demonstrate the intended flow with mock songs.

### Stage 2 — SQLite catalog

- Create database initialization and migrations.
- Implement create, read, update, and delete operations for song metadata.
- Implement exact song-number lookup and title/artist search.
- Persist favorites if included.

**Acceptance:** Catalog remains after app restart; song numbers preserve leading zeros; duplicate numbers are rejected or handled clearly.

### Stage 3 — Local media import

- Integrate the Android file picker.
- Copy selected videos to app-managed storage using supported APIs.
- Add metadata entry and validation.
- Handle duplicates, cancellation, insufficient storage, and failed copies.
- Ensure database and filesystem changes do not leave broken records.

**Acceptance:** An imported local video remains accessible after restarting the app and while offline.

### Stage 4 — Video playback

- Integrate the selected video playback package.
- Play imported local files.
- Implement pause, resume, seek, fullscreen, and next.
- Test a known-good H.264/AAC MP4 on a physical Android device.
- Handle unsupported or missing files.

**Acceptance:** Imported video plays correctly without internet on the target device.

### Stage 5 — Queue behavior

- Implement add, remove, reorder, and persistence.
- Implement Play Now behavior.
- Advance automatically when a song ends.
- Handle an empty queue and unavailable media.

**Acceptance:** Queue order remains correct after app restart and playback moves through the queue as specified.

### Stage 6 — Offline and reliability testing

- Test in airplane mode.
- Test app backgrounding, locking/unlocking, rotation, and interruptions.
- Test large files and low-storage conditions.
- Test app restart during and after playback.
- Check database consistency after failed imports and removals.

**Acceptance:** Core features remain usable offline and errors do not crash the app or corrupt data.

### Stage 7 — Packaging and documentation

- Configure Android application ID, app name, and icon.
- Build and install a test APK using the appropriate Expo/EAS or native build workflow.
- Write setup, run, build, and troubleshooting instructions in `README.md`.
- Document device testing and known limitations.

**Acceptance:** A fresh checkout can be installed and built using the documented steps.

---

## 12. Testing Checklist

- [ ] App opens with no internet connection.
- [ ] Empty library shows an import action.
- [ ] Importing a valid local video succeeds.
- [ ] Cancelling the file picker does not create a song record.
- [ ] Duplicate song numbers are handled clearly.
- [ ] Leading zeros are preserved.
- [ ] Search by title and artist works.
- [ ] Play Now starts the correct video.
- [ ] Add to Queue persists the song.
- [ ] Queue reorder and removal work.
- [ ] Automatic next-song playback works.
- [ ] Empty queue does not crash playback.
- [ ] Missing or unsupported files show a useful error.
- [ ] Removing a song handles related queue entries safely.
- [ ] Catalog and queue persist after force-close/restart.
- [ ] Playback survives or gracefully handles orientation changes.
- [ ] App behaves sensibly when backgrounded or interrupted.
- [ ] Low-storage and failed-copy cases do not leave broken records.
- [ ] The APK installs and works on a physical Android phone/tablet.

---

## 13. Guidance for an AI Coding Assistant

When implementing this project:

1. Read this specification first and treat it as the current source of truth.
2. **Do not generate the entire app in one giant response.** Implement one roadmap stage at a time.
3. Before changing files, inspect the existing repository, framework version, package scripts, and current code.
4. If the repository already exists, preserve its established conventions unless there is a concrete reason to change them.
5. State the files you plan to create or modify and briefly explain the plan.
6. Use TypeScript types for songs, queue entries, database rows, and service interfaces.
7. Use parameterized database queries and safe transactions.
8. Verify package and API compatibility with the project's installed Expo SDK; do not invent APIs.
9. Do not claim a build or test passed unless it was actually run and its result is known.
10. Prefer small, understandable components and services over premature abstractions.
11. Keep all core data and media local. Do not introduce Supabase, Firebase, a server, sign-in, or other online dependency.
12. Use mock data only during the UI prototype stage; replace it with real local persistence in later stages.
13. Ask a concise question only when a decision is genuinely blocking implementation. Otherwise use the defaults in this specification and document assumptions.
14. At the end of each stage, summarize what changed, which commands/tests were run, what passed, what remains, and the next step.
15. Keep a `README.md` with setup, development, Android build, media handling, and known limitations.

### Recommended first task to give the coding AI

> Read `NumberKanta-Spec.md`. Inspect the current repository (or create a new Expo + React Native + TypeScript project if none exists). Do not implement the whole app at once. Start with **Stage 1 only**: create the project foundation, navigation, and responsive mock-data UI for the Home/Number Keypad, Songbook, Queue, and Player screens. Do not add a backend or internet-dependent services. After implementation, report the files changed and the exact commands and device steps needed to run it. Do not claim tests passed unless you ran them.

---

## 14. Assumptions and Open Decisions

Use these defaults unless the user explicitly changes them:

- **Platform:** Android-first.
- **Playback device:** same phone or tablet running the app.
- **Media source:** existing local karaoke video files provided by the user.
- **Lyrics:** embedded in the video for the MVP.
- **Internet:** not required for core functionality.
- **Accounts/backend:** none for the MVP.
- **Song numbers:** manually assigned or entered during import; stored as text.
- **Queue:** local and persistent.
- **App name:** NumberKanta is only a working name.
- **Video compatibility:** begin with H.264/AAC MP4 and verify on real devices.
- **Background playback:** not required initially; pause or recover safely when backgrounded.
- **Media rights:** user imports media they are permitted to use.

Potential future decisions:

- Whether importing should support batch selection and bulk metadata entry.
- Whether duplicate song numbers can be overwritten, renumbered, or only rejected.
- Whether Play Now removes a song from the queue if it is already queued.
- Whether completed songs are removed from the queue or retained in history.
- Whether a local backup/export should include media files or metadata only.
- Whether external storage and local-network transfer are needed.
- Whether a separate Windows version is worth building after the Android MVP.

---

## 15. Definition of Done for the MVP

The MVP is done when a user can install the Android app, import authorized karaoke videos from local storage, assign unique song numbers and metadata, find songs through the keypad or songbook, play them directly on the same device, manage a persistent queue, and move through queued songs—all without internet access—and when the app handles common media and storage errors without losing catalog or queue integrity.
