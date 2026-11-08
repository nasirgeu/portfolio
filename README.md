# Mohd Nasir — Portfolio

A fast, accessible, static personal portfolio.

**Stack:** Astro 7 · TypeScript (strict) · Tailwind CSS 4 · React (project cards only) · Motion · Lucide · Cloudflare Pages

## Quick start

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
npm test          # run the checks for the Lab demos (no extra install needed)
```

Requires Node.js 22.23.4 or newer.

## Edit your content

Everything personal lives in `src/data/`. No component edits are needed.

| File | What it controls |
| --- | --- |
| `src/data/site.ts` | Name, title, email, resume path, social links, availability indicator, About text, experience, education |
| `src/data/projects.ts` | Project cards (highlights, tech, architecture layers, snippets, links) |
| `src/data/skills.ts` | Skill groups |
| `src/data/achievements.ts` | Competitive programming cards |

### Already filled in from your resume and public profiles

Email, GitHub, LinkedIn, LeetCode, resume PDF (`public/Mohd-Nasir-Resume.pdf`), experience, education, skills, projects and achievements. LeetCode figures were checked against the public profile (1,747 solved; peak contest rating 1989).

### Still worth checking

1. **HackWithInfy** — your resume says "Finalist"; "Top 100, 2024" came from your brief. It is marked `verified: false` in `src/data/achievements.ts` (a tag shows in dev only). Confirm, then set `verified: true`.
2. **LeetCode Knight** — shown per your resume. The live profile currently shows a rating of ~1770, so confirm you want this badge displayed.
3. **Resume PDF** — it contains your phone number and area. Swap `public/Mohd-Nasir-Resume.pdf` for a version without them if you prefer.
4. **Open Graph image** — add a 1200×630 PNG at `public/og-image.png`. Social previews use it automatically once it exists.
5. **Site URL** — see "Domain" below.

Project descriptions are intentionally high-level. Do not add confidential source code or internal details.

## Deploy to Cloudflare Pages (free)

1. Create a GitHub repository and push this project:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo>.git
   git push -u origin main
   ```
2. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git** and choose the repository.
3. Use these build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** `NODE_VERSION` = `22` (or newer)
4. Click **Save and Deploy**. Every push to `main` redeploys automatically.

### Domain

The sitemap, canonical URLs and Open Graph tags use the site URL. The default is `https://nasirgeu.mohdnasir4257.workers.dev`.

- Set an environment variable `SITE_URL` in Cloudflare Pages (for example `https://yourname.dev`), **or** edit `astro.config.mjs`.
- Update the `Sitemap:` line in `public/robots.txt` to match.

## Performance and accessibility

Tested on a production build with Lighthouse (headless Chrome):

| | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Mobile | 99 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Scores vary by machine and network, so re-run them after you change content.

Design notes: React loads only when the Projects section scrolls into view; the hero, terminal and navigation use small vanilla scripts; fonts are self-hosted; `prefers-reduced-motion` is respected; dark/light theme is saved in `localStorage`.

## The Lab (/lab)

A small engineering platform inside the portfolio: a dashboard at `/lab` and one dedicated page per experiment.

| Route | Experiment |
| --- | --- |
| `/lab` | Dashboard with a card for each experiment, plus a diagram of how they are built |
| `/lab/page-replacement` | Page replacement: FIFO, LRU, Optimal |
| `/lab/cpu-scheduling` | CPU scheduling: FCFS, SJF, SRTF, Round Robin, two priority methods, HRRN |
| `/lab/memory-allocation` | Memory allocation: first, best and worst fit |
| `/lab/sorting` | Sorting: bubble, selection, insertion, merge, quick, heap, counting, radix, shell |
| `/lab/searching` | Searching: linear, binary, jump, interpolation |
| `/lab/graph-algorithms` | Graphs: BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim, Kruskal, topological sort |
| `/writing` | Writing: list of posts (add a post by adding one object to `posts` in `src/data/writing.ts`) |
| `/writing/<slug>` | One post |

Each experiment page has a workspace (inputs and controls on one side, visualization on the other), design diagrams, and technical notes: how it works, steps, variables, complexity, an example and edge cases.

**Adding or editing an experiment**

- Text for the dashboard cards and the technical notes lives in `src/data/labExperiments.ts`.
- Each experiment keeps its logic in `src/lib/` (no screen code), records every decision as a step with a reason, and is covered by the checks in `tests/`.
- Shared pieces live in `src/components/lab/` (top bar, sidebar, cards, workspace layout, execution controls, statistics, technical details). Each experiment has its own visualization in `src/components/lab/viz/`.
- The Lab uses the same navigation bar as the rest of the portfolio (with "Lab" highlighted) and the same colour palette. Colours are defined once, as tokens in `src/styles/global.css`. `src/styles/lab.css` holds only Lab layout and animation styles.
- The "Under the hood" pipeline diagrams are written in `src/data/pipelineDiagrams.ts`, and the decision-flow diagrams in `src/data/designDiagrams.ts`.

`npm test` runs the checks. They use Node's built-in TypeScript support, so Node 22.23.4 or newer is required (already the project minimum).

## Project structure

```
src/
  components/   Section components and the React project cards
  data/         All editable content
  layouts/      Page shell, SEO metadata, structured data
  pages/        index and 404
  lib/          Pure logic for the Lab demos (no screen code)
  scripts/      Navigation, theme, scroll reveal, copy-to-clipboard
  styles/       Tailwind 4 setup and design tokens
tests/          Checks for the Lab logic, run with npm test
public/         favicon, robots.txt, _headers (security + cache headers)
```
