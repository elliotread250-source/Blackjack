# Open Arcade 20× rebuild — build log

Branch `upgrade/arcade-20x` (from `phase3/more`). Not deployed.

## 1. Audit and plan
- Before screenshots taken at 390 and 1440 px: `before-390.png`, `before-1440.png`.
- `PLAN.md` written. It covers page flow, motion architecture, components, file layout, budgets and the QA checklist.
- Constraints kept:
  - every `tokens.css` value is unchanged;
  - same fonts;
  - `registry.json` is still the single source, with no `id` or `url` changes;
  - the server API is unchanged;
  - no build step and no runtime dependencies;
  - no trackers or cookies.

## 2. Design system
- `tokens.css` was extended, not changed. New tokens are derived only: alpha steps of the existing colours, plus gradients, glows, bezels, z-layers, a type scale, durations, easings and staggers.
- A test scans every stylesheet for colours outside the original hues. It was checked by adding `#3366ff`, which made it fail.
- The CSS was split into `components/` and `sections/`. The old `components.css` and `animations.css` were removed.
- Living style guide: `styleguide.html`, linked from the footer.

## 3. Motion engine (`js/motion/`)
- **One loop:** a single requestAnimationFrame loop with a task list. It pauses while the tab is hidden.
- **Building blocks:** springs, counters and odometers, split text, typewriter and scramble effects, tilt and magnetic pointers, FLIP animations (plus a View Transitions helper, currently unused), a particle canvas, ripple, shake, glitch and sheen effects, marquees, scroll velocity and progress, pins, reveals, and optional synthesised sound (off by default).
- **Quality governor:** steps from 3 down to 0 when the frame rate falls below 50 fps on desktop or 28 fps on touch devices. It never steps back up in the same visit.
- **Motion levels:** `html[data-anim]` is `full`, `reduced` or `off`. `prefers-reduced-motion` gives `reduced` by default.
  - Reduced removes keyframe animations and keeps only opacity and colour transitions.
  - Off removes all motion.
- **Reveals:** they only run once `html.motion-ready` is set, so a failed script never leaves content hidden.

## 4. Sections (top to bottom)
1. **Boot:**
   - First visit: a cold scan line, the logo, then the headline. Later visits in the same session fade in.
   - Skipped when the URL has a hash. A Skip button is shown. The intro can be replayed from settings.
2. **Header:**
   - Starts transparent and turns to frosted glass after you scroll.
   - Hides as you scroll down and springs back as you scroll up.
   - The active-section underline follows the current section, and a scroll progress spark runs along the bottom.
   - On phones a drawer has numbered items and can be swiped closed.
3. **Hero:**
   - Split-text headline, a cabinet with a live attract screen, orbiting art and a perspective floor grid.
   - Odometer facts (game count, real total plays) and magnetic CTAs.
   - The "Surprise me" slot machine only lands on live games.
4. **Ticker:** two marquees. One is a strip of every live game's logo, each a real link; the other runs huge outlined words the opposite way.
5. **Headliners:** featured games in a carousel stage with pips, arrows, swipe and a pause button. Autoplay pauses on hover, on focus, when off-screen and in Reduced or Off.
6. **Continue:** recently played games (up to 10). Each can be removed, the strip can be cleared, and both can be undone.
7. **Charts:** a HIGH SCORES board from real `/api/plays` counts, with the top three on a podium and split-flap rank numbers. ▲ ▼ NEW movement is measured against a snapshot from this browser's last visit.
8. **Vibes:** one tile per registry category, showing its real game count and a looping original micro-illustration. Clicking a tile filters the library.
9. **Lobby:** "SELECT YOUR MODE", with tabs for Online, Co-op, Vs bots and Same screen. Games are taken only from the registry `features`, with no player counts.
10. **Shelf:**
    - Desktop: a pinned section where vertical scrolling walks every cabinet past the camera with depth parallax.
    - Phones and Reduced: a swipe row instead.
11. **Library:**
    - Search keeps the rules "car"≠"cards" and "pac"≠"space".
    - Category chips, sort, and grid, compact and list views.
    - The state lives in the URL hash, so back and forward work.
    - Uses FLIP animations and the stretched-link card pattern.
    - Hover moments: an original animated SVG per game, loaded on hover or focus only.
12. **Favourites:** an ordered list with undo. It can be reordered by mouse, touch or keyboard, with screen-reader announcements.
13. **Profile:** local-only stats, streaks and 12 badges, with a reset that asks for confirmation. Nothing leaves the browser.
14. **Idea box:** a terminal-style suggestion box using the same API. Wrong viewer codes are refused.
15. **Footer:**
    - Live status dots, the style guide link and the CONTINUE countdown easter egg.
    - The back-to-top rocket.
- **Also added:**
  - Detail sheet: deep-linked as `#game/{id}`, works with back, and has a copy-link button.
  - Ctrl/Cmd+K palette with commands, fuzzy fallback and a "NO SIGNAL" empty state.
  - Keyboard shortcuts and a `?` overlay.
  - Konami "arcade mode", "insert coin", and the original ember egg.
  - Custom cursor (fine pointers only, optional).
  - Optional CRT filter.
  - Themed 404 page.
  - A static `<noscript>` list of every live game, generated into `index.html`.

## 5. Launch path
- **Plain click:** plays a short zoom-and-flash transition, records one count, then navigates.
- **Middle or modifier click:** opens a new tab and records one count, with no transition.
- **Back-forward cache:** a `pageshow` handler resets the overlay.
- **Counting:** each launch is one POST (`sendBeacon` with a fetch fallback). The server still rate-limits each visitor and game to one count per 30 s.

## 6. Fixes made during QA
- **Shelf heading off-screen:** the heading sat at x=4849 because the track was sizing the grid column. Fixed with `minmax(0,1fr)` on the column and `width: max-content` on the track.
- **Horizontal overflow:**
  - phone toolbar: fixed with grid areas;
  - 1024 px headliner: fixed;
  - 320 px header: the brand text is now hidden.
- **Phone layout:**
  - `.btn > span` was overriding `.btn-fill`, which made the Explore button huge;
  - headliner pips were squeezed and are now flexible;
  - vibes and the compact library now use 2 columns;
  - phones default to the compact view.
- **Desktop hamburger:** it was showing because of the cascade order; fixed with higher specificity.
- **Library state:**
  - Back did not restore the view: `applyState` now defaults it.
  - Keyboard reorder lost the picked-up card when focus moved: fixed.
- **Easter egg clash:** typing "insert coin" triggered the R shortcut. Shortcuts now ignore egg typing.
- **CONTINUE overlay:** it was blocking clicks; it is now `pointer-events: none` except on its button.
- **Lighthouse findings:** the odometer used an `aria-allowed-role` and `dl` structure that failed. It now uses a visually hidden number plus decorative columns.

## 7. Verification
- **Tests:**
  - `node arcade/tests/test_registry.mjs`: 1223 ✓
  - `python3 arcade/tests/test_server.py`: 27 ✓
  - `tools/e2e/hub.mjs`: Chromium 95 ✓, Firefox 95 ✓, WebKit 94 ✓ (284 in total). WebKit skips the middle-click step because under automation it opens in the same tab.
- **Lighthouse 12.2.1, desktop, local:**
  - Performance 96, Accessibility 100, Best Practices 100, SEO 100.
  - LCP about 1.0 s, CLS 0.001–0.003.
- **Motion:**
  - Full animates. Reduced and Off are static.
  - `prefers-reduced-motion` gives Reduced with the fade boot.
  - With background effects off, the canvas stops.
  - At 4× CPU throttling the governor stepped down (41 fps → quality 2 → 1).
- **Other checks:**
  - Blocked storage still works.
  - With JS off, the static list is shown.
  - No horizontal overflow at 12 sizes.
  - No console errors or failed requests.
- **Sizes, over budget:**
  - JS: about 175 KB uncompressed, 73 KB gzipped file by file. The budget was about 150 KB.
  - CSS: about 136 KB uncompressed, 43 KB gzipped. The budget was about 90 KB.
  - Moments: 39 SVGs, 156 KB in total, loaded on hover only.
- **Not verified:** VoiceOver or other screen readers by hand (only the ARIA structure and announcements were tested); real phones (emulated only).

## 8. Final test pass
- **Accessibility fix:** a toast with an action (Undo) now lasts 6.5 s instead of 3.8 s. Toasts also pause while keyboard focus is inside them, as well as on hover, so a keyboard user can reach Undo in time.
- **e2e hardening (no assertion was changed):**
  - Async results are now polled for, instead of read after fixed sleeps.
  - Clicks inside scroll-revealed sections wait until the target has stopped moving. Headless WebKit throttles frames, so a click could land where a button was mid-reveal.
  - The settings button is focused before it is clicked, which brings back an auto-hidden header, just as it does for keyboard users.
- **Result:** all three browsers pass, 284/284.
