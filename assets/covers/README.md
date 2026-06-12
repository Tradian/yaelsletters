# Book covers

Drop a cover image here named to match each book, and it appears automatically
on that book's page (no code changes needed). Until then, the page shows the
typographic cover as a graceful fallback.

- `letters-from-the-hill.jpg`  → shows on book-letters-from-the-hill.html
- `before-the-rooster.jpg`     → shows on book-before-the-rooster.html

The filename must match the `data-cover` attribute on that page's `.book-cover`.

**Specs:** portrait, ratio ~14:19.5 (the cover frame). Author at **448×624 px**
(2× for retina), JPEG or WebP, optimized. The image is shown with `object-fit:
cover`, so it fills the frame edge to edge.
