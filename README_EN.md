<div align="center">

<img src="static/logo.png" alt="Match Point Logo" width="100" />

# Match Point 赛点

**Offline timer, marker, scoring, and review tool for skill competition training**

<br />

<a href="#"><img alt="version" src="https://img.shields.io/badge/version-v1.3.0-blue?color=0F5C5C" /></a> <a href="#"><img alt="platform" src="https://img.shields.io/badge/platform-Android-blue?color=0078D6" /></a> <a href="#"><img alt="framework" src="https://img.shields.io/badge/framework-uni--app-green" /></a> <a href="#"><img alt="license" src="https://img.shields.io/badge/license-Private-red" /></a>

<br />

<p>
  <a href="#what-it-is">What It Is</a> ·
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#project-structure">Project Structure</a> ·
  <a href="#data-storage">Data Storage</a> ·
  <a href="#faq">FAQ</a>
</p>

</div>

---

## What It Is

When practicing for a competition, trainees need to repeatedly simulate the competition flow, manage time pacing, log problem areas, and review improvement directions.

The traditional approach: **manual timer + paper notes** → inefficient, scattered, reliant on memory.

Match Point's approach: **digitize the entire training workflow, fully offline, all data stored locally.**

> Select Template → Timed Training → Quick Markers → Task Checklist → Self-Scoring → Generate Report → Export & Share

One app covers the entire training loop. No network, no login, no uploads.

---

## Features

### Template System

4 built-in templates + custom templates, covering common training scenarios:

| Template | Duration | Target | Stages | Scenario |
|:---------|:--------:|:------:|:------:|:---------|
| 60-min Full Competition | 60 min | 55 min | 6 | Full competition simulation |
| 55-min Sprint Training | 55 min | 50 min | 4 | Compressed practice run |
| Project Defense | 20 min | 18 min | 4 | Presentation / defense scenario |
| Device Debugging | 45 min | 40 min | 5 | Technical debugging session |

Custom templates support: name, total duration, target time, and per-stage names with minute allocations.

### Training Timer

- **Stage Timing** — Auto-advances through preset stages; manual forward / backward navigation
- **Dual Progress Bars** — Overall progress + current stage progress, at a glance
- **Overtime Alerts** — Target time reminder to wrap up; red overtime warning
- **Fullscreen Mode** — Large-text display of remaining time, ideal for projection or remote viewing
- **Background Timing** — Timer keeps running when you leave the app; elapsed time is calculated on return
- **Draft Recovery** — Unfinished training auto-saves; resume on next launch

### Quick Markers

One-tap annotations during training — no pausing, no pen needed:

| Marker Type | Purpose |
|:------------|:--------|
| Lecture Start / End | Track explanation segment duration |
| Demo Start / End | Track demonstration segment duration |
| Device Error | Flag when something goes wrong |
| Speech Hesitation | Mark moments of verbal stumbling |
| Overtime Risk | Flag potential time overruns early |

Supports custom marker types + free-text notes.

### Scoring & Review

- **7 self-assessment categories** — Time Control, Technical Explanation, System Demo, Operation Standard, Expression Fluency, On-site Stability, Innovation Display
- Each category supports **selecting deduction reasons** for precise weak-point identification
- Auto-generates a **review report** (marker analysis, stage deviation, improvement advice)
- Report exportable as an **image** to the photo album, or **copy as text** to share directly

### Statistics & Analytics

Automatically aggregates all training data to help you spot patterns:

- Total training count / average score / highest score
- Overtime count and most frequently overtime stages
- Most common marker types (high-frequency issues)
- Most common deduction reasons (weak points)

### Pre-Competition Checklist

5 categories, 29 check items, covering:

> Equipment Check, Material Check, Program Check, Demo Check, Backup Plan

Check off items one by one with visual progress tracking. State auto-saves — complete it across multiple sessions.

---

## Getting Started

### Prerequisites

| Dependency | Version |
|:-----------|:--------|
| HBuilderX | 3.0+ |
| Node.js | 16+ (only if npm dependencies are needed) |
| Android SDK | Required for APK builds |

### Development

```bash
# 1. Clone the project
git clone <repo-url>
cd app/

# 2. Open the app/ directory in HBuilderX

# 3. Run → Run to Phone or Simulator (Android)
```

### Production Build

```
HBuilderX → Publish → Native App - Cloud Packaging → Select Android → Generate APK
```

- Target SDK: Android API 34
- Required permissions: `VIBRATE`, `WAKE_LOCK`, `READ/WRITE_EXTERNAL_STORAGE`

---

## Project Structure

```
app/
├── manifest.json              # App config (AppID, permissions, version, icons)
├── pages.json                 # Page routes & TabBar config
├── main.js                    # Entry point
├── App.vue                    # Root component
│
├── pages/
│   ├── index/                 # Home — stats overview, recent training, slogan carousel
│   ├── template/              # Templates — list + editor
│   ├── training/              # Training — timer, fullscreen, checklist, scoring, report
│   ├── history/               # Records — training history list + detail view
│   ├── statistics/            # Statistics — aggregate analytics
│   ├── tools/                 # Tools — time calculator, precheck, data backup
│   └── check/                 # Pre-competition checklist — 5 categories, 29 items
│
├── utils/
│   ├── storage.js             # Local storage CRUD
│   ├── report.js              # Report generation (scoring, deviation, marker analysis)
│   ├── time.js                # Time utilities (formatting, calculation, conversion)
│   └── export.js              # Export (Canvas image generation, text export)
│
├── styles/
│   ├── theme.scss             # Design tokens (colors, radii, shadows)
│   └── common.scss            # Global reusable styles
│
├── data/
│   └── slogans.json           # Home page slogans (65 bilingual entries)
│
└── static/                    # Static assets (icons, TabBar images)
```

---

## Data Storage

**All data is stored locally on the device.** No network, no login, no uploads.

| Storage Key | Contents |
|:------------|:---------|
| `skill_training_templates` | Training templates (built-in + custom) |
| `skill_training_records` | Completed training records (timing, scores, markers, reports) |
| `skill_current_training` | In-progress training draft |
| `MATCH_POINT_PRECHECK` | Pre-competition checklist state |
| `MATCH_POINT_SETTINGS` | App settings |

> Uninstalling the app will clear all data. Use the Data Backup feature to export a JSON file regularly.

Supports **export backup** / **import restore**. Confirmation required before clearing data.

---

## Design System

| Token | Value | Usage |
|:------|:------|:------|
| Primary | `#0F5C5C` Dark Teal | Headers, primary actions |
| Accent | `#C99A2E` Gold | Emphasis, highlights |
| Background | `#F7F4EA` Warm White | Page backgrounds |

Material 3-inspired design with consistent radii, shadows, and spacing. See `styles/theme.scss` for details.

---

## FAQ

<details>
<summary><b>Does the timer stop when I switch to another app?</b></summary>
<br />
No. The timer keeps running in the background. When you return, the elapsed time during your absence is automatically calculated and added.
</details>

<details>
<summary><b>What if I quit in the middle of a training session?</b></summary>
<br />
Your progress is auto-saved as a draft. The next time you open the same template, you'll be prompted to resume.
</details>

<details>
<summary><b>Will I lose my data?</b></summary>
<br />
All data is stored in local device storage. Uninstalling the app will clear it. Use the Data Backup feature (Tools → Backup) to export a JSON file regularly.
</details>

<details>
<summary><b>What's the difference between fullscreen mode and the normal timer?</b></summary>
<br />
Fullscreen mode displays the remaining time and current stage in large text, ideal for projection screens or viewing from a distance. Both modes share the same training data and can be switched freely.
</details>

<details>
<summary><b>Report image export failed?</b></summary>
<br />
Some Android devices require photo album permission to be granted manually. If saving fails, use the Copy Report Text button as a fallback.
</details>

---

<div align="center">

**Match Point** · An offline review tool for skill competition training

</div>
