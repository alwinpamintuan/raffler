# Raffler design

Raffler translates Rappler’s editorial front page into a raffle interface.

- Orange masthead (`#ff5f1b`), white R emblem, lavender page (`#f5f6ff`), navy ink (`#172038`).
- IBM Plex Sans for headlines and controls; PT Serif for summaries; Open Sans Condensed for navigation and metadata. Fonts are self-hosted.
- An open lead story sits beside the names column. Latest winners appear below the lead.
- Use square controls, thin rules, plain action labels, and visible keyboard focus. Dark orange (`#a63308`) provides readable accent text.
- Below 768px, use Names/Draw views. Long names must wrap without clipping.
- Presentation retains the masthead and enlarges the lead while hiding setup and history.
- The three-second draw animation never determines the winner. Celebration is finite, skips instant/reduced-motion modes, and never replays on load or Undo.
- Keep the unaffiliated parody credit visible in the footer.

Styles live in `src/App.css`; the emblem and fonts live in `src/assets`.
