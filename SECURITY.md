# Security notes

## Accepted risk: `frontend` build-toolchain vulnerabilities (react-scripts / CRA)

`npm audit` in `frontend/` reports a set of HIGH/MODERATE advisories rooted in
`react-scripts@5.0.1` (Create React App), which is unmaintained upstream and has
no non-breaking fix:

- `@svgr/webpack` → `@svgr/plugin-svgo` → `svgo` → `css-select` → `nth-check`
- `postcss`, `css-minimizer-webpack-plugin`, `resolve-url-loader`
- `webpack-dev-server`, `sockjs`
- `workbox-build`, `workbox-webpack-plugin`, `rollup-plugin-terser`,
  `serialize-javascript`

These were deliberately left unpatched after review, for two reasons:

1. **`svgo` is dead code in this build.** `react-scripts`'s own webpack config
   (`node_modules/react-scripts/config/webpack.config.js`) passes `svgo: false`
   to `@svgr/webpack`, so `svgo`/`css-select`/`nth-check` are never invoked
   despite being installed. The advisory is unreachable.
2. **Everything else here is build-time tooling over trusted input.** These
   packages process the project's own source (CSS, JS, the service worker
   bundle) during `npm run build`/`npm start`, not data supplied by an
   end user or attacker over the network. The realistic exploit path for
   their advisories (ReDoS/prototype-pollution via crafted CSS/SVG/JS input)
   requires an attacker to control the build input — a supply-chain/insider
   scenario, not something reachable by hitting the deployed app.

A real fix would require migrating off Create React App (e.g. to Vite),
which is a multi-hour, high-risk rewrite (env vars, asset/public path
handling, the PWA/service-worker setup, possibly the test runner) for a
security benefit that is already close to zero in practice. That migration
was evaluated and consciously deferred; revisit it if `react-scripts` is
ever dropped for other reasons (perf, DX), not purely for these CVEs.

Everything else in the dependency tree (backend and frontend) has been kept
current — see git history for the vulnerability-reduction passes.
