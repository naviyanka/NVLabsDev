# Original User Request

## Initial Request — 2026-06-24T22:47:03Z

Create a standalone, non-destructive theme engine and premium UI redesign using Stitch MCP, adding a new Cyberpunk Neon Glassmorphism theme toggle option without altering or removing existing working themes.

Working directory: C:\Users\OrgAdmin\Documents\NVLabs
Integrity mode: benchmark

## Requirements

### R1. Standalone Stitch MCP Theme Engine
Implement a new theme engine utilizing Stitch MCP (`create_design_system`, `generate_variants`, `apply_design_system`) to introduce a premium "Cyberpunk Neon Glassmorphism" theme featuring vibrant HSL tailored colors, deep void backgrounds, and sleek glass panels.

### R2. Strict Non-Interference
Ensure all existing themes (`dark`, `light`, `system`, terminal themes) remain completely untouched, active, and fully functional. The new theme must exist as an independent, side-by-side selectable option in the settings UI.

### R3. Premium Frontend Redesign Support
Equip the application layout and core UI components with dynamic glassmorphism support (`backdrop-blur`, borders) and micro-animations that activate exclusively when the new Cyberpunk theme is toggled.

### R4. Controlled MCP Infrastructure
You must use Stitch MCP to generate and apply the new design system tokens, and Playwright MCP to verify layout rendering and theme toggling.

## Acceptance Criteria

### Standalone Theme Integration
- [ ] Legacy theme tokens and classes remain 100% intact in `index.css` and `settings.tsx` with zero deletions or breaking modifications.
- [ ] Stitch MCP successfully generates and registers the new `cyberpunk-neon` design system.
- [ ] Toggle control in Settings successfully switches between legacy themes and the new Cyberpunk Neon Glassmorphism theme without errors.
- [ ] Playwright visual snapshots confirm vibrant HSL colors, glassmorphic backdrop filters (`backdrop-blur`), and dynamic micro-animations upon theme activation.

## Follow-up — 2026-07-02T19:58:13Z

# Teamwork Project Prompt — Draft

Review, suggest modifications, remove unused code, and actively refactor the entire NEXUS application (both .NET Gateway backend and Node.js React frontend) to prepare for a final production build.

Working directory: C:\Users\OrgAdmin\Documents\NVLabs
Integrity mode: benchmark

## Requirements

### R1. Codebase Cleanup
Identify and safely remove unused code, dead files, and obsolete dependencies across the frontend and backend. 

### R2. Active Refactoring
Refactor messy logic for better production quality. Prioritize improving the architecture, eliminating code duplication, and adhering to best practices for React and .NET 8.

### R3. Safe Exploration
You must heavily use the `gitnexus` and `code-review-graph` MCP tools to understand the blast radius (`impact`) of any deletions or refactoring BEFORE modifying files. 

## Acceptance Criteria

### Objective Verification
- [ ] Automated build scripts (`npm run build` in `src/Nexus.Frontend` and `dotnet build` in `src/Nexus.Gateway`) must pass entirely without errors after the cleanup and refactor.
- [ ] No required functionality is accidentally broken (the frontend and backend must successfully start).
- [ ] A final `walkthrough.md` report is generated listing precisely what was removed, optimized areas, and why the refactored code is superior.
