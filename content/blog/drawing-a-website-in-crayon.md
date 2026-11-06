---
title: How I drew a website in crayon
date: 2026-11-06
summary: Every heading on this site is drawn stroke by stroke in SVG. Here's how, and what it cost to keep it smooth.
tags: [frontend, svg, performance]
draft: true
---

<!-- Draft written with Claude from the code and the work on it. Read it, change what doesn't sound like you, then set draft: false. -->

Most portfolios pick a font. This one draws its words: every heading, doodle and box outline on the site
is written in crayon, stroke by stroke, as you scroll to it. There's no canvas library and no animation
library underneath, just SVG and about 1,500 lines of TypeScript. This is how it works, and the
performance bugs I hit on the way.

## Handwriting from a single-line font

Normal fonts are outlines: a letter is a shape you fill. A crayon doesn't fill shapes, it drags a line.
So the handwriting starts from a **Hershey font**, an old single-line font made for pen plotters, where
each letter is a list of strokes in the order you'd draw them.

Each letter then gets a little human error before it's drawn:

- the strokes wobble a bit, seeded per letter, so no two "a"s come out quite alike
- each stroke is timed by its length, with some unevenness, so long strokes take longer
- the strokes are revealed with a dash animation, one after another, in stroke order

Because the wobble is seeded, the same heading always looks like the same handwriting, but nothing on the
page is a copy of anything else.

## Making it look like wax

A plain SVG line looks like a pen. Crayon is wax dragged over bumpy paper, so every drawing goes through an
SVG filter that does three things:

1. **roughens the edges**: a displacement map pushes the line around with noise
2. **specks it**: fine noise punches small holes where the paper's tooth stops the wax
3. **varies the pressure**: broad noise makes some parts lighter, like a hand pressing unevenly

The noise sizes are converted to screen pixels, so the grain is the same size on a huge heading as on a
small label.

## Keeping it smooth

The look was the easy part. A page with hundreds of filtered, animated drawings can make scrolling stutter
on an ordinary laptop, so most of the work went here. I measure every change on the production build with
the CPU slowed down four times, scrolling the page like a person would.

What helped:

- **A Web Worker** works out the crayon passes for each drawing, so the main thread stays free.
- **Drawings wait for the scroll to settle** before they animate. Nothing starts drawing while you're
  still moving.
- **Watching, not reading.** The navbar used to read `scrollY` on every scroll event, which forced the
  browser to finish its layout mid-scroll. An `IntersectionObserver` on a tiny marker does the same job
  for free.

What surprised me:

- **`content-visibility: auto` made it worse.** It's meant to skip work for off-screen content, and it does,
  but un-skipping a whole section full of crayon paths as it came near was a 500 to 950 ms freeze. It stays
  only on the project cards, one card at a time.
- **An SVG inside an SVG ignores CSS width.** On the sketchpad, the AI's answers came out at half size on a
  laptop and tiny on a phone. Chrome sizes a nested `<svg>` from its attributes only, so the CSS size was
  ignored and it fell back to the width of the whole sheet. Setting the size as attributes fixed it.
- **Not every clever fix pays.** The texture filter is the biggest steady cost, so I tried drawing its noise
  once into image tiles instead of generating it per pixel. It looked almost the same and measured no faster
  (and Chrome's `feTile` turned out to only tile sideways, which cut whole strokes out on the way). I kept
  the original. Measuring first saved me from shipping a change that only felt faster.

## What I'd tell someone trying this

Build the look first, then measure before you optimise, on the real build, with the CPU throttled. Half my
guesses about what was slow were wrong, and the profiler was right every time.
