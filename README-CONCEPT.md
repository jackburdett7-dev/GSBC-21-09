# GBSC site concept (local only)

The redesigned Guildford Baseball & Softball Club site: maroon and gold, the scroll set pieces
(home hero, About's 1992 and diamond build, History's season rail, Gallery's print table,
Roster's trading cards, Juniors' Saturday clock, Schedule's season calendar), and the corrected
club facts.

**This folder is never deployed.** It sits next to the live site's repo (`../site`, which Vercel
deploys) but outside it, and the workspace repo ignores it. It lives in OneDrive, so it is
backed up and reachable from any device.

- **Preview:** double-click `_preview/preview.cmd` (needs Node), then open http://localhost:4520/.
- **History:** this folder is its own git repo with no remote. `git log` lists every saved round.
- **Build notes and tools:** `C:/Users/jackb/scrollcraft/builds/gbsc/` (BUILD-REPORT.md, FACTS.md,
  the lab tests). That workspace links its `site` folder here, so both places are the same files.
- **Live-site problems found along the way:** `../LIVE-SITE-FIXES.md`.

Adopting it later means copying these pages into `../site` on a branch and reviewing it there;
until then, nothing here goes near Vercel.
