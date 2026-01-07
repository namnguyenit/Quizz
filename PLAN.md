# Theme & Font Switcher Implementation Plan

## Overview

- **Style switcher** (3 styles) and **Font switcher** (4 fonts) directly in TopBar
- Simple native `<select>` dropdowns
- Live preview (changes apply immediately)
- Hidden on mobile (< 768px) to save space
- All hardcoded colors → CSS variables
- FavoritesModal converted to dark style

---

## Style Definitions

| Style      | Background | Surface   | Hover     | Primary   | Secondary | Accent    | Error     | Text      | Text Muted | Border    |
| ---------- | ---------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | ---------- | --------- |
| **Ember**  | `#1F2128`  | `#282A36` | `#353845` | `#E07B54` | `#00D9C0` | `#F5A623` | `#FF4747` | `#E8E6E3` | `#9CA3AF`  | `#3F4251` |
| **Violet** | `#1A1D21`  | `#22262B` | `#2D3239` | `#8B5CF6` | `#06B6D4` | `#FBBF24` | `#EF4444` | `#F8FAFC` | `#94A3B8`  | `#374151` |
| **Amber**  | `#1C1917`  | `#292524` | `#3D3835` | `#F59E0B` | `#10B981` | `#F97316` | `#DC2626` | `#FAFAF9` | `#A8A29E`  | `#44403C` |

## Font Definitions

| Font              | Package                                              |
| ----------------- | ---------------------------------------------------- |
| Plus Jakarta Sans | `@fontsource-variable/plus-jakarta-sans`             |
| Outfit            | `@fontsource-variable/outfit`                        |
| Manrope           | `@fontsource-variable/manrope`                       |
| Noto Sans         | `@fontsource-variable/noto-sans` (already installed) |

---

## Task List

- [x] 1. Install font packages
- [x] 2. Create `src/lib/theme.ts` - Style & font definitions
- [x] 3. Update `src/lib/localKeys.ts` - Add STYLE_KEY, FONT_KEY
- [x] 4. Update `src/routes/global.svelte.ts` - Add styleState, setStyle(), setFont()
- [x] 5. Rewrite `src/app.css` - CSS variables for all 3 styles
- [x] 6. Update `src/app.html` - FOUC prevention script
- [x] 7. Update `src/routes/+layout.svelte` - Font imports, apply style/font
- [x] 8. Update `src/routes/TopBar.svelte` - Add Style/Font dropdowns + CSS vars
- [x] 9. Update `src/routes/Sidebar.svelte` - Replace hardcoded colors with CSS vars
- [x] 10. Update `src/routes/QuizCard.svelte` - Replace hardcoded colors with CSS vars
- [x] 11. Update `src/routes/Carousel.svelte` - Replace hardcoded colors with CSS vars
- [x] 12. Update `src/routes/FavoritesModal.svelte` - Dark style + CSS vars
- [x] 13. Update `src/routes/+page.svelte` - Replace hardcoded colors with CSS vars
- [x] 14. Run `bun run check` to verify no type errors

---

## Color Mapping (Old → New)

| Current Hardcoded         | CSS Variable            |
| ------------------------- | ----------------------- |
| `#1D1B2C`                 | `var(--bg-primary)`     |
| `#29273F`                 | `var(--bg-surface)`     |
| `#35325A`                 | `var(--bg-hover)`       |
| `#302E4A`                 | `var(--bg-hover)`       |
| `#C294FF`                 | `var(--color-primary)`  |
| `#6c63ff` / `#574fd6`     | `var(--color-primary)`  |
| `#CECDE0`                 | `var(--text-primary)`   |
| `#8582B0`                 | `var(--text-secondary)` |
| `#33314E`                 | `var(--border)`         |
| `#FFD700`                 | `var(--color-accent)`   |
| `#FF4747`                 | `var(--color-error)`    |
| `green-400` / `green-300` | `var(--color-success)`  |

---

## TopBar Layout

### Desktop

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [☰] Subject > Quiz Name     [Style: Ember ▼] [Font: Outfit ▼] [Favorites]│
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

Style/Font hidden - only hamburger + breadcrumb + Favorites button visible
