---
name: improve
description: Audit the project and deliver the next most valuable upgrade from the backlog in the root AGENTS.md. Use when asked to improve, upgrade, harden, or take the product further without a specific task.
---

# Improve the product

## 1. Find the real state

1. Read the root `AGENTS.md`, especially **Upgrade backlog**.
2. Run the `verify` skill first. Fix anything broken before adding anything new.
3. Walk the three audience paths in a browser (buyer, client, staff) and note friction, wrong data, and dead ends.

## 2. Choose one upgrade

Take the highest backlog item you can finish and verify in this session. Prefer, in order: correctness and trust, then search and navigation, then provider selling tools, then polish. If the best item needs something only the user has (database credentials, auth provider setup, a product decision), prepare everything up to that point and ask.

## 3. Deliver it

Follow the `add-feature` skill. Keep the change to one upgrade; note other problems you found instead of fixing them in the same pass.

## 4. Close the loop

- Remove the finished item from the backlog and add any new gap you discovered, in priority order.
- Update `README.md` and the affected `AGENTS.md` files.
- Report what changed, what you verified and how, and what still needs the user.

## Do not

- Present demo roles, sample data, or simplified boundaries as production features.
- Write to a hosted database, change auth settings, or deploy without the user asking.
