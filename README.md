<div align="center">

# 💿 AIR_OS: VIRTUAL INSTRUMENT SUITE
### [ SYSTEM STATUS: ONLINE ]

<img src="assets/Y2K Wallpaper.jpg" width="100%" alt="Air OS Desktop" />

<p align="center">
  <img src="assets/_2000s Y2K Stickers You’ll Obsess Over 💖_.jpg" width="300" />
</p>

**Air OS** is a browser-native desktop environment designed for gesture-based music production. It bypasses traditional MIDI hardware by mapping hand landmarks to high-fidelity synthesis engines.

---

## 📂 INSTALLED BINARIES (INSTRUMENTS)

<div align="left">

### 🎹 SALAMANDER_PIANO.DLL
<img src="assets/y2k early 2000s old windows inspired apple widget aesthetic cd player silk sonic bruno mars (1).webp" align="right" width="200" />

* **Logic:** Uses `Tone.Sampler` for high-fidelity multi-sampled audio.
* **Controls:** Left hand sets the `activeOctave` (1-7), Right hand executes key strikes.
* **Aesthetic:** Retro LCD display with real-time frequency feedback.

### 🥁 CR78_DRUM_KIT.SYS
<img src="assets/Screenshot 2026-04-01 180854.jpg" align="right" width="200" />

* **Logic:** Hybrid synthesis using `MembraneSynth` (Kick/Toms) and `NoiseSynth` (Snare).
* **Collision Detection:** Euclidean distance mapping between `indexTip` landmarks and virtual coordinate pads.
* **Interaction:** Velocity-sensitive "Air Strikes" based on vertical hand movement.

### 🎸 GUITAR_AMP.EXE
* **Logic:** Polyphonic triangle-wave synthesis with resonant filtering.
* **Modes:** `Strum Mode` for gesture-based chords vs `Fretboard Mode` for 15-fret grid interaction.

</div>

---

## 🛠️ KERNEL ARCHITECTURE
<img src="assets/像素桌面图标7.jpg" width="100%" />

| COMPONENT | SPECIFICATION |
| :--- | :--- |
| **Window Manager** | Custom React 19 state machine handling `zIndex`, minimization, and focus. |
| **Neural Core** | MediaPipe Hands via `handLandmarkerService` for real-time tracking. |
| **Audio Engine** | Tone.js V15 with customizable `lookAhead` latency drivers. |
| **UI Framework** | Tailwind CSS 4 + Framer Motion for hardware-accelerated window transitions. |

---

## 💾 INSTALLATION LOG
```bash
> Initializing clone...
git clone [https://github.com/user/air-tune.git](https://github.com/user/air-tune.git)

> Booting dependencies...
npm install

> Setting Environment variables...
# Add your API keys to .env

> Starting System...
npm run dev
