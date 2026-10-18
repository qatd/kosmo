// Runs in the browser before React hydrates (Next.js convention).
// react-grab: hover an element + ⌘C to copy its component name & source location
// (to paste into Claude Code). Dev-only — the import is stripped from production builds.
if (process.env.NODE_ENV === 'development') {
    import('react-grab')
}
