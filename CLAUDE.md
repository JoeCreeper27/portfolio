# CLAUDE.md — Portfolio Codebase Guide

## Overview

Static HTML/CSS portfolio website for Joe Huang (JoeCreeper27), an Urban Planner / Editor
specializing in GIS, 3D modelling, and data visualization.

No build system, no JavaScript framework, no backend — pure HTML5 + SCSS/CSS.

---

## Directory Structure

```
portfolio/
├── index.html          # Landing page (hero + intro cards)
├── resume.html         # Work experience, education, skills table
├── project.html        # Project gallery (thumbnail grid → detail pages)
├── competition.html    # Competition achievements with images
│
├── project/            # Individual project / competition detail pages
│   ├── project_1.html … project_5.html
│   ├── competiton_1.html … competiton_4.html   (note: intentional legacy spelling)
│   └── projectpic/     # Images used inside project detail pages
│
├── css/
│   ├── style.scss      # SCSS source — edit this, not style.css
│   ├── style.css       # Compiled output (commit after compiling)
│   └── style.css.map   # Source map (auto-generated)
│
├── Icons/              # SVG social icons (LinkedIn, GitHub, Medium, etc.)
├── pic/                # Site-wide images (hero bg, self photo, competition pics)
│   └── competition/    # Competition thumbnail images
│
├── .gitignore
└── CLAUDE.md           # This file
```

---

## Key Conventions

### HTML

- All pages share the same `<header>` and `<footer>` structure — keep them in sync
  when editing any of the four main pages.
- Active nav link uses `class="active"` on the `<a>` tag for the current page.
- Nav separators use `<li class="slv"></li>` (NOT `<div>`) — `<div>` inside `<ul>`
  is invalid HTML and was a known bug that has been fixed.
- External links must include `rel="noopener noreferrer" target="_blank"`.
- Favicon MIME type is `image/x-icon`.
- `<base target="_self" />` is used in `<head>` (note: `target`, not `href`).
- Favicon paths use relative `./pic/icon-j.ico` (not absolute `/pic/icon-j.ico`).

### CSS / SCSS

- **Always edit `css/style.scss`**, then compile to `css/style.css`.
- Default font is `"Quicksand", sans-serif` (set on `*`).
  Headings override: `h1/h2` → `"Barlow Semi Condensed"`, `h4` → `"Quicksand"`.
- Color palette:
  - Body text: `#20303c`
  - Background: `#f9fafa`
  - Accent / active: `teal`
  - Muted accent: `darkslategray` / `darkslategrey`
- Responsive breakpoint: `@media screen and (max-width: 800px)`
- Image size utility classes: `.project` (240×240), `.project-w` (wide),
  `.project-h` (tall), `.project-l` (large square)
- `transition: all 0.5s ease-in` is applied globally on `*` — avoid adding more
  transitions individually unless overriding speed/easing.

### SCSS Compilation

No package.json exists. Compile SCSS manually with the Sass CLI:

```bash
sass css/style.scss css/style.css
# or with watch mode:
sass --watch css/style.scss:css/style.css
```

---

## Common Tasks

### Add a new project page

1. Create `project/project_N.html` by copying an existing detail page.
2. Add a `<div class="card-p">` entry in `project.html` pointing to it.

### Update contact info or social links

Edit the `<footer>` block — it is duplicated across all four main pages, so update
all of them.

### Change the hero background

Replace `pic/back.jpg` (keep the filename, or update the path in `style.scss`
under `section.backImage { background-image: ... }`).

---

## Known Issues / Watch-outs

- `css/style.css` is the compiled output and should be regenerated after any SCSS
  change. The compiled file is committed to the repo (no CI build step).
- Project/competition detail pages inside `project/` use relative paths that
  assume they are one level below root — keep them there.
- The `competition.html` link in the nav (legacy) points to `competition.html`
  (fixed from the original typo `competotion.html`).
