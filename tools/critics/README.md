# Critics
`npm run build && npx vite preview --port 4173` then `node tools/critics/run-all.mjs <iteration> "<note>" [functional,fidelity,touch,craft,art,a11y,perf]`.
Each critic returns {pass, defects[], screenshots[]}; run-all.mjs records to progress.html. Critics rely on the ?test=1 hooks documented in docs/ARCHITECTURE.md.
