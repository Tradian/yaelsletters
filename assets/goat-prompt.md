# Our own goat — image-generation prompt

A brief + ready-to-paste prompts to create an **original** goat illustration for
Yael's Letters, in the spirit of the current public-domain plate but ours.

**Goal:** a gentle she-goat (Yael means "goat" in Hebrew) seated on a hill,
**writing a letter with a quill** — an antique **pen-and-ink engraving**, single
dark ink on a **plain white background** so it drops onto our cream paper via the
site's `mix-blend-mode: multiply` and samples cleanly into the particle hero.

**Brand anchors:** cream `#f1e9d2` · forest ink `#2f4538` · gold `#b3812f`. Vintage,
literary, devout, quiet. Motifs already in the world: wax seal "Y", quill/nib,
scrolls, books/Bible, hoof-prints, lamplight, a low farm horizon.

**Output specs:** portrait ~**5:6** (matches 275×324). Generate a clean **2×
master** (~800×960) for crisp particle sampling; export the display copy to
`assets/goat.jpg`. Keep lines near-black/deep-green on **pure white**, no color,
no text, no border (we add the frame and the multiply blend).

---

## Master prompt (tool-agnostic)
> A vintage 19th-century pen-and-ink engraving of a gentle nanny goat seated
> upright on a grassy hilltop, writing a letter on a sheet of paper she holds and
> dipping a long quill pen; a small glass inkwell, two closed leather books and a
> folded scroll rest in the grass beside her among a few wildflowers; a simple
> farm and a low horizon line far behind. Fine cross-hatched line work in the
> antique steel-engraving / woodcut storybook manner of Oliver Herford and Ernest
> Griset; pure line art in a single dark ink tone on a plain white background,
> high contrast, no tonal washes. Quiet, literary, devout mood. Centered
> full-figure composition with generous white margins.

**Exclude:** color, painterly shading, photorealism, 3D render, cartoon/anime,
text or lettering, watermark or signature, decorative border/frame, modern
objects, harsh drop shadow, busy background.

---

## Midjourney
```
vintage 19th-century pen-and-ink engraving of a gentle nanny goat seated on a
grassy hilltop writing a letter with a long quill pen, glass inkwell, two leather
books and a folded scroll in the grass, a few wildflowers, simple farm and low
horizon behind, fine cross-hatched line work in the manner of Oliver Herford and
Ernest Griset, antique steel-engraving / woodcut storybook style, pure black ink
line art on a plain white background, high contrast, no shading washes, centered
full figure, generous white margins --ar 5:6 --style raw --stylize 250 --no color, text, watermark, frame, signature
```

## DALL·E 3 (ChatGPT)
> Create a vintage 19th-century **pen-and-ink engraving** of a gentle nanny goat
> seated on a grassy hilltop, **writing a letter with a long quill pen**, a glass
> inkwell, two closed leather books and a folded scroll in the grass beside her,
> a few wildflowers, and a simple farm with a low horizon far behind. Style: fine
> **cross-hatched line work**, antique steel-engraving / woodcut storybook feel
> (in the spirit of Oliver Herford and Ernest Griset). **Black ink line art on a
> pure white background**, high contrast, no color and no tonal washes. Centered
> full figure with generous white margins. **No text, no border, no signature.**
> Portrait orientation (about 4:5).

## Ideogram
> Vintage pen-and-ink **engraving / etching** of a gentle nanny goat seated on a
> hill writing a letter with a quill; inkwell, leather books, a folded scroll and
> wildflowers in the grass; simple farm and low horizon behind. Monochrome black
> ink line art, fine cross-hatching, antique storybook style, **plain white
> background**, centered full figure, generous margins. Style: Engraving.
> No text. Portrait 4:5.

---

## After you generate
1. Pick the cleanest line version on a true-white ground (clean whites matter for
   both the multiply blend and the particle sampler).
2. Save the display image as `assets/goat.jpg` (it replaces today's plate
   everywhere automatically). Keep a hi-res master too.
3. The particle hero (`assets/ink-light.js`) will sample the new engraving on its
   own — cleaner line art = a crisper assembled goat.
4. Optional: nudge the ink toward brand green via CSS `filter` on `.plate__art`.

**Variations worth trying:** a tighter half-figure (goat + letter + quill only),
and a version with a small **wax-sealed envelope** at her hoof for the Books/Support
art.
