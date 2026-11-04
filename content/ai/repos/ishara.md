# Ishara: the repository

- Repository: https://github.com/Zidarc/Ishara
- GitHub description: AI-driven campus accessibility app bridging the sensory gap for visually and hearing-impaired students — real-time AR wayfinding and adaptive safety alerts where static, single-sense infrastructure fails.
- Main language: Python
- Last pushed: 2026-09-07

## README

# Ishara (إشارة) - Assistive Campus Navigation for Visually Impaired Students

  
  
  
  
  
  
  
  

---

## 📖 Executive Summary

University campuses are designed with the assumption that every student can visually inspect signage, read room placards, and build mental spatial maps on the fly. For blind and low-vision students, navigating unfamiliar, crowded corridors between classes is a high-effort task requiring memorized routes and tactile exploration. Existing assistive tools (white canes, guide dogs, tactile maps, RFID beacons) are either strictly **proximity-only** or dependent on **expensive, static physical infrastructure**.

**Project Ishara** bridges this critical gap within the **Healthcare & Assistive Technology** domain. By combining real-time edge computer vision (object detection + monocular depth estimation) with an **Android AR client (Unity)**, Ishara empowers students with continuous spatial awareness, dynamic obstacle avoidance through two parallel output channels: a live AR camera overlay for partially sighted users who retain some functional vision, and audio-haptic cues for users who are unable to see clearly enough to rely on the visual overlay alone.
> [!WARNING]
> ### 🩺 Healthcare & Assistive Aid Advisory (Non-Reliance Notice)
> **Auxiliary Assistive Aid Only - Not for Sole Reliance**
>
> Project Ishara is an auxiliary perception tool intended solely to augment environmental spatial awareness for blind and low-vision individuals. **It is NOT a certified medical diagnostic device, clinical prosthesis, or primary mobility substitute.**
>
> Users and caregivers must **NEVER** place sole reliance on this software for solitary navigation or life safety. It is engineered to complement, and must always be used alongside, primary mobility aids including the **white cane, guide dog, and certified Orientation & Mobility (O&M) training**. Always maintain primary physical contact and environmental awareness while navigating.

> 📄 **Read the Full Academic Problem Statement**: [docs/PROBLEM_STATEMENT.md](docs/PROBLEM_STATEMENT.md)

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    subgraph SENSING["1. Environmental Sensing"]
        CAM["Smartphone Camera Feed\n(1080p / 30 FPS)"]
    end

    subgraph INFERENCE["2. Edge Perception Engine"]
        YOLO["Object Detection\n(YOLO26n / Custom Weights)"]
        DEPTH["Monocular Depth Estimation\n(YOLO-Depth Model)"]
        OPENVINO["OpenVINO Runtime\n(Optimized Edge Latency)"]
        CAM --> YOLO
        CAM --> DEPTH
        YOLO -.-> OPENVINO
        DEPTH -.-> OPENVINO
    end

    subgraph REASONING["3. Navigational Zone Engine"]
        ZONES["Zone Classifier\n(Left | Center | Right)"]
        PROX["Proximity Classifier\n(Near  ZONES
        DEPTH --> PROX
        ZONES --> ALERTS
        PROX --> ALERTS
    end

    subgraph CLIENT["4. Unity Mobile Application (APK)"]
        AR["AR Core / Vuforia Engine"]
        AUDIO["3D Spatialized Audio Cues"]
        HAPTIC["Haptic Feedback Alerts"]
        ALERTS --> AR
        AR --> VISUAL["AR Visual Overlay\n(Camera feed + markers)"]
        AR --> AUDIO
        AR --> HAPTIC
        CLIENT_BUILD["Deployable Android APK"]
        VISUAL -.-> CLIENT_BUILD
        AUDIO -.-> CLIENT_BUILD
        HAPTIC -.-> CLIENT_BUILD
    end
```

---

## 📂 Repository Structure

The repository is organized as a modular monorepo cleanly separating mobile application development, machine learning models, video datasets, and research documentation:

```
Ishara/
├── .gitignore                       # Master Git hygiene configuration (protects large data)
├── README.md                        # Project flagship documentation (this file)
│
├── Ishara_Unity/                    # 🎮 Unity Mobile AR Client (Outputs Android APK)
│   ├── Assets/                      # C# scripts, Vuforia configs, Scenes, Input systems
│   ├── Packages/                    # Unity package dependencies
│   ├── ProjectSettings/             # Player & Android build settings
│   └── README.md                    # Step-by-step guide to building the APK
│
├── models/                          # 🧠 Machine Learning Models & Perception
│   ├── base/                        # Pretrained Open-Source Models (YOLO, Depth, OpenVINO)
│   │   ├── weights/                 # Model weight files (.gitignored)
│   │   ├── scripts/                 # detect.py, detect2.py, benchmark.py
│   │   └── README.md                # Base model specs, OpenVINO compilation instructions
│   └── trained/                     # Custom Fine-Tuned Campus Navigation Checkpoints
│       ├── checkpoints/             # Fine-tuned model checkpoints (.gitignored)
│       ├── scripts/                 # model.py, benchmarkv1.py (evaluation suite)
│       └── README.md                # Training details, mAP metrics, and release links
│
├── datasets/                        # 📹 Video Datasets & Preprocessing Pipeline
│   ├── raw_videos/                  # Raw campus walkthroughs & batch recordings (.gitignored)
│   │   └── batch_videos/            # Multi-clip benchmark series (V01.MOV - V28.MOV)
│   ├── processed/                   # Letterboxed and normalized training frames (.gitignored)
│   ├── pipeline/                    # Data preparation tools
│   │   ├── framegen.py              # Letterboxed frame extraction (640x640, 1280x1280)
│   │   ├── frameimprove.py          # Frame filtering and contrast enhancement
│   │   ├── data_merger.py           # Multi-dataset annotation merger with unified classes
│   │   └── remap.py                 # Label remapping utility
│   └── README.md                    # Data collection protocol and storage policy
│
├── apps/                            # 💻 Interactive Demos & Applications
│   └── video_depth_app/             # Streamlit visual dashboard (Detection + Depth)
│       ├── app.py                   # Real-time side-by-side video processor
│       ├── requirements.txt         # Python dependencies
│       └── R

(README cut short here)
