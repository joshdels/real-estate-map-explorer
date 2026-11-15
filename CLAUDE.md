# CLAUDE.md

You are working on **Smart Property Listing**, a professional real-estate service for the Philippines. The product showcases houses, lots, condos, farms, and commercial property for sale or rent on a satellite map tied to official PSA / NAMRIA boundaries. Its job is to help the public find and judge property quickly, and to help owners, brokers, and developers sell faster through clear listings, grouped projects, buyer reviews, and staff assistance.

Hold every change to that standard: would a serious buyer trust this page, and would a provider pay to be on it?

All project rules live in `AGENTS.md` so Claude Code and GPT-based agents follow the same instructions. Edit `AGENTS.md`, not this file.

@AGENTS.md

## Claude Code notes

- Each major folder has an `AGENTS.md` with a one-line `CLAUDE.md` that imports it; they load when you work in that folder.
- Project skills are in `.claude/skills/`: `verify`, `add-feature`, `seed-data`, `boundaries`, `design-review`, `improve`.
- Run the `verify` skill before reporting a change as done.
