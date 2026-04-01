<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:000080,30:00008B,60:0000FF,100:00F5FF&height=180&section=header&text=AIR%20TUNE&fontSize=65&fontFamily=Orbitron&fontColor=00F5FF&animation=blinking&fontAlignY=38&desc=gesture-controlled%20music%20workstation&descAlignY=62&descSize=14&descColor=FF2D78" width="100%"/>

<img src="https://img.shields.io/badge/STATUS-ONLINE-00FF41?style=for-the-badge&labelColor=000000" />
<img src="https://img.shields.io/badge/VERSION-1.0.0-00F5FF?style=for-the-badge&labelColor=000080" />
<img src="https://img.shields.io/badge/LICENSE-MIT-FF2D78?style=for-the-badge&labelColor=1a0010" />
<img src="https://img.shields.io/badge/BROWSER-NATIVE-BF00FF?style=for-the-badge&labelColor=0d0020" />
<img src="https://img.shields.io/badge/NO_INSTALL-REQUIRED-FFF200?style=for-the-badge&labelColor=1a1500" />

<br/><br/>

<img src="https://readme-typing-svg.demolab.com?font=Orbitron&size=14&duration=3000&pause=1000&color=00F5FF&center=true&vCenter=true&multiline=true&repeat=true&width=700&height=30&lines=★+YOUR+WEBCAM+IS+NOW+AN+INSTRUMENT+★" alt="Typing SVG"/>

</div>

---

> **🎵 `about.exe` — Air Tune \[Running\]**
>
> **Air Tune** is a **browser-based, gesture-controlled music workstation** that transforms your webcam into a polyphonic instrument suite. Built with a nostalgic 90s OS aesthetic, it leverages computer vision to map hand movements and finger gestures to high-fidelity audio synthesis.
>
> No plugins. No downloads. No boundaries.
> **Your hands are the interface. Motion is the music.**

---

<div align="center">

```
╔══════════════════════════════════════════════════════════╗
║  📷 WEBCAM FEED — GESTURE DETECTION ACTIVE              ║
║ ┌────────────────────────────────────────────────────┐  ║
║ │  ┌──┐                                        ┌──┐  │  ║
║ │  └──┘                                        └──┘  │  ║
║ │                                                    │  ║
║ │              ✋ HAND DETECTED                       │  ║
║ │          [21 LANDMARKS MAPPED]                     │  ║
║ │                                                    │  ║
║ │              ♪♪♪♪♪♪♪♪♪♪♪                          │  ║
║ │          NOW PLAYING: C#4 + E4 + G#4               │  ║
║ │                                                    │  ║
║ │  └──┘                                        └──┘  │  ║
║ │                                              REC ● │  ║
║ └────────────────────────────────────────────────────┘  ║
║  [▶ LAUNCH]  [⚙ SETTINGS]  [♫ EXPORT SESSION]          ║
╚══════════════════════════════════════════════════════════╝
```

<img src="https://readme-typing-svg.demolab.com?font=Share+Tech+Mono&size=13&duration=2000&pause=500&color=39FF14&center=true&vCenter=true&multiline=true&repeat=true&width=600&height=50&lines=GESTURE+DETECTED:+OPEN+PALM;NOTE+TRIGGERED:+A4+%2F+440Hz;REVERB+DEPTH:+72%25+%7C+DELAY:+120ms" alt="Typing SVG"/>

</div>

---

## ⬡ Features

<table>
<tr>
<td width="50%">

**`🤚 Gesture Engine`**
Real-time hand tracking via **MediaPipe Hands** — 21 landmarks per hand at 60fps. Both hands tracked simultaneously for polyphonic control.

**`🎹 Polyphonic Synthesis`**
Multi-voice **Web Audio API** synthesis engine. Theremin, drums, pads, and arp — all gesture-mapped with zero plugin dependency.

**`🎛️ Live Effects Chain`**
Reverb · Delay · Distortion · Filter — controlled by hand height, tilt angle, and spread distance.

</td>
<td width="50%">

**`📡 Ultra-Low Latency`**
On-device CV inference. No server roundtrip. **<16ms audio response time.** As natural as touching a real instrument.

**`💻 Pure Browser`**
WebGL + Web Audio. Works in Chrome, Firefox, Edge. Mobile-ready. No install, no accounts, no barrier.

**`🎨 Retro Aesthetic`**
Authentic 90s OS chrome. CRT scanlines. Pixel fonts. A time machine wrapped around a cutting-edge instrument.

</td>
</tr>
</table>

---

## ✌️ Gesture Map

<div align="center">

| Gesture | Action | Parameter |
|:---:|:---|:---|
| 🤚 Open Palm | **Theremin Pitch** | Hand height = frequency |
| ✌️ Peace Sign | **Arpeggiator** | Finger spread = tempo |
| 👊 Fist | **Drum Trigger** | Punch velocity = volume |
| 🤏 Pinch | **Filter Sweep** | Pinch distance = cutoff |
| 🖐️ Spread | **Reverb Depth** | Finger distance = wet mix |
| 🤙 Shaka | **Delay Toggle** | Hold 1s = on/off |
| 👆 Point Up | **Octave Shift** | Height = octave register |
| 🤜 Side Swipe | **Pattern Change** | Speed = BPM multiplier |

</div>

---

## 🔧 Tech Stack

<div align="center">

<img src="https://img.shields.io/badge/MediaPipe_Hands-CV_Engine-00F5FF?style=flat-square&labelColor=000080" />
<img src="https://img.shields.io/badge/Web_Audio_API-Synthesis-FF2D78?style=flat-square&labelColor=1a0010" />
<img src="https://img.shields.io/badge/WebGL-Render_Layer-39FF14?style=flat-square&labelColor=001a00" />
<img src="https://img.shields.io/badge/Vanilla_JS-ES2022-FFF200?style=flat-square&labelColor=1a1500" />
<img src="https://img.shields.io/badge/Vite-Build_Tool-BF00FF?style=flat-square&labelColor=0d0020" />
<img src="https://img.shields.io/badge/CSS3-Retro_UI-00F5FF?style=flat-square&labelColor=000080" />

</div>

<br/>

```
┌─────────────────────────────────────────────────────────┐
│  SYSTEM ARCHITECTURE — AIR TUNE v1.0.0                 │
├─────────────┬──────────────────┬───────────────────────┤
│  LAYER      │  TECHNOLOGY      │  FUNCTION             │
├─────────────┼──────────────────┼───────────────────────┤
│  👁 VISION  │  MediaPipe Hands │  Landmark detection   │
│  🎵 AUDIO   │  Web Audio API   │  Synthesis & FX chain │
│  🖼 RENDER  │  WebGL + Canvas  │  Visual feedback      │
│  🧠 LOGIC   │  Vanilla JS      │  Gesture → param map  │
│  🎨 UI      │  CSS3 / Custom   │  Retro OS chrome      │
│  📦 BUILD   │  Vite            │  Bundle & dev server  │
└─────────────┴──────────────────┴───────────────────────┘
```

---

## 💻 Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/air-tune.git

# Navigate to project
cd air-tune

# Install dependencies
npm install

# Start the dev server
npm run dev

# → Open http://localhost:5173
# → Allow camera access when prompted
# → Wave your hands and make music ✋🎵
```

> ⚠️ **Camera required.** Air Tune uses your webcam for gesture tracking — all processing is done on-device. No data leaves your machine.

---

## 📊 Performance

<div align="center">

| Metric | Value | Status |
|:---|:---:|:---:|
| Gesture Detection Latency | `<16ms` | ✅ |
| Audio Synthesis Response | `<8ms` | ✅ |
| Hand Landmark Points | `21 / hand` | ✅ |
| Supported Browsers | `Chrome · Firefox · Edge` | ✅ |
| Max Simultaneous Notes | `8 voices` | ✅ |

</div>

---

## 🗺️ Roadmap

- [x] Core gesture engine (MediaPipe)
- [x] Web Audio synthesis chain
- [x] Theremin mode
- [x] Drum pad mode
- [x] Filter + reverb effects
- [ ] MIDI export
- [ ] Multi-user jam sessions (WebRTC)
- [ ] Mobile touch fallback
- [ ] Preset system with save/load
- [ ] Audio recording + WAV export

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00F5FF,30:0000FF,60:000080,100:000000&height=100&section=footer" width="100%"/>

**★ ✦ ★ ✦ ★ ✦ ★ ✦ ★ ✦ ★ ✦ ★**

<img src="https://readme-typing-svg.demolab.com?font=Press+Start+2P&size=10&duration=4000&pause=2000&color=FFF200&center=true&vCenter=true&repeat=true&width=700&height=30&lines=BEST+VIEWED+IN+NETSCAPE+NAVIGATOR+4.0+AT+800x600" alt="Retro footer" />

`© 2025 Air Tune` · `MIT License` · `Made with 🎵 and too much nostalgia`

*Turn on your speakers.*

</div>
