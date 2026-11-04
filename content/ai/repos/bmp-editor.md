# BMP Image Editor: the repository

- Repository: https://github.com/Zidarc/BitMap_Image_Editor
- GitHub description: A Bit Map Image Editor made for PF lab project at FAST NU KHI
- Main language: C
- Last pushed: 2026-05-23

## README

# BMP Image Editor

A compact BMP-focused image editor implemented in C. It provides both a command-line interface for testing filters and a simple GUI built with Raylib + RayGui for interactive use. The project targets 24-bit, uncompressed BMP images and was developed as a Programming Fundamentals lab-style project.

---

## Overview

This repository contains tools to load, edit, preview and save 24-bit BMP images. The GUI (`bitmapgui.c` + `backend.c`) offers a basic login flow and panels for selecting filters and templates. A CLI entry (`main.c`) exists for testing filters and batch processing.

Supported workflows:
- CLI: quick testing and batch runs via `main.c`.
- GUI: interactive editing using Raylib / RayGui (`bitmapgui.c` + `backend.c`).

---

## Features

- Open and save 24-bit uncompressed `.bmp` files
- Multiple image filters implemented in `filters.c` (grayscale, sepia, blur, invert, sharpen, gaussian blur, emboss, pixelate, vignette, add border, reflect, resize, rotate)
- Brightness and contrast adjustment
- Resize and rotate helpers
- Basic login/signup system using `users.txt` (XOR+hex demo encoding)
- Simple GUI with panels for filters, templates, and file I/O

Note: Some items (e.g., `edges` filter, full GUI parameter dialogs, and edit history) are documented but partially implemented.

---

## Repository Layout

- `bmp.h` — BMP header structs and `RGBTRIPLE` definitions
- `filters.h` / `filters.c` — image manipulation algorithms
- `backend.c` / `backend.h` — GUI-facing helpers: load/save/apply filter (stateful)
- `bitmapgui.c` — Raylib + RayGui GUI implementation
- `main.c` — CLI test driver for filters
- `login.c` / `login.h` — simple signup/login helpers using `users.txt`
- `runningcommand.txt` — example GCC link command used on Windows
- `Images/` — sample BMPs and screenshots (add your own)
- `Testing files/` — additional test sources and helpers

---

## Build & Run (Windows / MinGW)

### Prerequisites

- GCC (MinGW)
- Raylib + RayGui compiled for MinGW (headers & libs available locally)

### Example Build (GUI)

```bash
gcc -o bmt.exe backend.c bitmapgui.c login.c filters.c -I"C:/raylib/raylib/src" -L"C:/raylib/raylib/src" -lraylib -lopengl32 -lgdi32 -lwinmm -luser32
```

If you prefer a minimal CLI build that only links the filter test harness:

```bash
gcc -o bmp_cli.exe main.c filters.c -I"C:/raylib/raylib/src"
```

Run the GUI:

```bash
bmt.exe
```

Run the CLI:

```bash
bmp_cli.exe
```

Check `runningcommand.txt` for the original build command used during development.

---

## Usage

GUI:
1. Launch `bmt.exe`.
2. Use the login/signup screen or continue with a test account.
3. Enter a file path or use the `Images/` samples and click `Load`.
4. Select a filter or template and apply; the backend will update `output.bmp` by default.

CLI:
1. Run `bmp_cli.exe`.
2. Follow prompts to choose filters and parameters, or modify `main.c` to accept arguments for automation.

---

## Implementation Notes & Known Issues

- Target format: 24-bit uncompressed BMPs (standard 54-byte header). Other BMP variants are not supported.
- `filters.c` declares an `edges` function in `filters.h` but the implementation is missing — linking will fail if referenced.
- `backend_free` is declared in `backend.h` but not implemented in `backend.c`; repeated image loads in the GUI will leak memory until fixed.
- `backend_apply_filter` currently dispatches a limited set of filters (grayscale & invert are wired); many GUI hooks are placeholders and need parameter dialogs.
- Password storage in `users.txt` uses XOR+hex encoding (demo only). Replace with secure hashing for real deployments.

Suggested next steps (issues to fix): `edges` implementation, implement `backend_free`, expand `backend_apply_filter` to accept parameters, and refactor shared BMP I/O into a single module.

---

## Developer Notes

- CLI entrypoint (`main.c`) duplicates some parsing logic found in `backend.c`. Consider extracting `image_io.c` to share load/save logic between CLI and GUI.
- Typical padding computation used across the codebase: `(4 - ((width * 3) % 4)) % 4` for scanline alignment.

---

## Troubleshooting

- App won’t compile: confirm raylib include and library paths. Update `-I`/`-L` flags to your raylib installation path.
- Missing DLL errors: ensure raylib and runtime DLLs are available in your PATH or alongside the executable.
- Images don’t load: verify file is a 24-bit BMP and that the path is correct (Windows paths are case-insensitive but examples in the code sometimes vary in case).

---

## Team

- Ali Hussain
- Muhammad Talha — https://github.com/Muhammad-Talha-25k2500
