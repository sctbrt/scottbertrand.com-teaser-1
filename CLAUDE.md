# Claude Instructions — scottbertrand.com

## Build v1.5.1 (Final, Locked)

You are working inside the **scottbertrand.com** repository.

This is a production site with an established visual language. Your task is a **material realism and typographic refinement**, not a redesign.

This document is the single source of truth. Follow it exactly.

---

## 1. Build Intent (v1.5.1)

Version 1.5.1 evolves the site in four precise ways:

1. Introduce a **realistic, architectural glass material system**
2. Match the glass visually to the provided reference renders (dark + light)
3. **Add extremely subtle ambient lighting response**
4. Refine and formalize the typography system

No layout redesigns. No new features. No stylistic reinterpretation.

---

## 2. Absolute Constraints (Non-Negotiable)

These override all other instincts:

- Glass must look **exactly like the reference visuals**
- Glass is architectural, not decorative
- Ambient light must feel **premium and restrained**
- If an effect is noticeable, it is wrong
- If glass draws attention away from content, remove it
- Zero gimmicks, zero spectacle
- Do NOT change layout, typography (beyond what's specified), or copy
- Do NOT add dependencies or frameworks
- Do NOT touch unrelated files

---

## 3. Glass Material System

### 3.1 Visual Calibration

The glass must **visually match the generated references**. The references show:

- Extreme subtlety (barely perceptible blur)
- Edge-led lighting (not surface-led)
- Natural depth without obvious shadows
- Premium feel without being flashy

If the implementation doesn't match the reference, it's wrong.

### 3.2 Technical Implementation

Create/maintain **`css/glass.css`** as the canonical glass system.

Required properties:
- `backdrop-filter: blur(...)` — Match reference blur intensity
- Edge highlights via subtle borders or inset shadows
- No heavy box-shadows or glows
- Fallback mode for browsers without `backdrop-filter` support (e.g., Firefox)

### 3.3 Where to Apply Glass

Add glass ONLY where it creates hierarchy and containment:

- Section transitions (bands/separators)
- Case studies/projects/offerings containers
- Methodology/system callouts
- Nav-adjacent anchors (very subtle)
- Footer/closing zone (one calm container)

Do NOT:
- Wrap entire pages in glass
- Stack glass-on-glass
- Add "card UI"
- Add icons/glows/heavy decorative shadows

---

## 4. Ambient Light Response

### 4.1 Desktop Only

On desktop, cursor position may **very subtly** influence glass edge lighting.

Requirements:
- Effect must be **barely perceptible**
- Strong damping/inertia (no follow-the-mouse behavior)
- Very low intensity deltas
- Only update CSS variables (no layout thrash)
- Heavy throttling (60fps max, prefer lower)

If it feels clever, playful, or obvious — remove it.

### 4.2 Implementation

Create/maintain **`js/glass-light.js`** (or equivalent single file).

- JS only updates CSS custom properties
- Respects `prefers-reduced-motion` (disable motion-based updates)
- No DOM manipulation beyond variable updates

---

## 5. Typography Refinement

Formalize the existing typographic system. Do NOT redesign it.

Goals:
- Ensure consistent hierarchy across all pages
- Verify line-height, letter-spacing, and font-weight consistency
- Fix any orphans or awkward line breaks
- Maintain existing type scale and rhythm

Do NOT:
- Change font families
- Introduce new type styles
- Add animations or transitions to type

---

## 6. Accessibility Requirements

- `prefers-reduced-motion` must disable all motion-based updates
- Provide fallback styles when `backdrop-filter` is unsupported
- Maintain WCAG contrast ratios
- Do not break keyboard navigation or screen readers

---

## 7. Editing Rules

- Keep diffs minimal
- Preserve existing formatting as much as possible
- Prefer adding classes over restructuring HTML
- Test at minimum:
  - Desktop Chrome (primary)
  - Mobile Safari (basic rendering)
  - Firefox (fallback mode)

---

## 8. Deliverables Checklist

A change-set is complete only when:

- [ ] Glass system exists as `css/glass.css` and is used consistently
- [ ] Glass visually matches the reference renders
- [ ] Desktop light effect is extremely subtle and respects reduced-motion
- [ ] Fallback mode works without `backdrop-filter`
- [ ] Typography system is formalized and consistent
- [ ] Site feels premium, architectural, and nearly imperceptible
- [ ] No console errors are introduced

---

**End of Instructions**
