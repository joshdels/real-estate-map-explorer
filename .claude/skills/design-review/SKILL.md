---
name: design-review
description: Review or change the visual design, copy, and brand of the site so it reads as a professional Philippine real-estate service. Use when asked to improve the look, taste, branding, positioning, homepage, or wording.
---

# Design and brand review

## Positioning

A professional real-estate service for the Philippines: property shown on the official map, managed for providers, kept honest by staff. Buyers should feel informed; providers should feel well presented.

## Brand system

- Name, tagline, positioning, and notices: `src/lib/brand.ts` only.
- Indigo `--color-brand`, violet accent, night-indigo hero, Georgia display headings, Inter / system body. No green theme.
- The parcel-grid texture in the hero is the one decorative motif. Do not add others.
- Gold is for ratings and provider highlights only. Amber panels are for honesty notices only.

## Copy rules

- Use short, common words. Remove jargon and extra detail.
- Keep headings, labels, and buttons brief. Say what happens next: "Find land", "Add photos", "Save listing".
- Avoid hyphenated terms when a familiar word or short phrase works.
- Break long sentences into two short ones.
- No hype ("best", "guaranteed", "verified") and no claim the product cannot back. "Staff reviewed" is not "verified".
- Keep the sample-data notice and the PSA / NAMRIA credit visible on public pages.
- Prices through `formatPrice()`; dates in `Asia/Manila`.

## Review checklist

1. Does the first screen say what this is, who it is for, and what to do next?
2. Is there one primary action per section?
3. Do cards align, with consistent image ratio, badge order, and price prominence?
4. At 390 px: no horizontal scroll, controls at least 40 px tall, nothing clipped.
5. Contrast at least 4.5:1 for text; focus outline visible on every control.
6. Empty states tell the user what to do next.
7. Take screenshots at mobile and desktop widths and look at them before reporting.

Then run the `verify` skill.
