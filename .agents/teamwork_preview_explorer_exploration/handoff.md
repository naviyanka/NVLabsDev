# Codebase Theme & Settings Exploration Report

## 1. Observation

### Settings & Styling Configuration Files
* **Frontend Stylesheet**: `src/Nexus.Frontend/src/styles.css`
  * Configured using Tailwind CSS v4 directives:
    ```css
    @import "tailwindcss" source(none);
    @source "../src";
    ```
  * Custom theme variables and token bridging:
    ```css
    @theme inline {
      --color-void: var(--bg-void);
      --color-surface: var(--bg-surface);
      --color-card: var(--bg-card);
      --color-border: var(--border-c);
      --color-border-dim: var(--border-dim);
      --color-amber: var(--amber);
      /* ... */
      --color-background: var(--bg-void);
      --color-foreground: var(--text);
    }
    ```
* **Frontend Settings Page Route**: `src/Nexus.Frontend/src/routes/settings.tsx`
  * Implements `GlobalSettingsPage` component.
  * Extends the local state type `AppSettings` (lines 24-43) and defines terminal theme previews.
* **Frontend Components Configuration**: `src/Nexus.Frontend/components.json`
  * Shadcn configuration file using Tailwind CSS variables:
    ```json
    "tailwind": {
      "css": "src/styles.css",
      "baseColor": "slate",
      "cssVariables": true,
      "prefix": ""
    }
    ```
* **Backend API Controller**: `src/Nexus.Gateway/Controllers/AppSettingsController.cs`
  * Exposes GET and PATCH endpoints at `/api/settings` to read/write settings.
* **Backend Model**: `src/Nexus.Gateway/Models/AppSetting.cs`
  * Persistent Entity Framework class specifying property defaults:
    ```csharp
    public string Id { get; set; } = "global";
    public string Theme { get; set; } = "dark";
    public string TerminalTheme { get; set; } = "nexus-dark";
    ```
* **Database Registration**: `src/Nexus.Gateway/Data/NexusContext.cs` (lines 39) & `src/Nexus.Gateway/Program.cs` (lines 56-57)
  * PERSISTS settings in SQLite `nexus.db` database using Entity Framework Core:
    ```csharp
    builder.Services.AddDbContext<NexusContext>(options => options.UseSqlite("Data Source=nexus.db"));
    ```

---

### Theme Definition, Storage, and Toggling
1. **Theme Definitions**:
   Defined under attribute selectors in `src/Nexus.Frontend/src/styles.css`:
   * `:root, [data-theme="dark"]` (Default theme)
   * `[data-theme="light"]` (Light theme)
   * `[data-theme="slate"]` (Slate theme)
   * `[data-theme="stealth"]` (Stealth OLED theme)
2. **Storage**:
   * Master configuration is persisted in the backend database (`nexus.db` sqlite).
   * Cached in browser `localStorage` using keys `'nexus-theme'` and `'nexus-terminal-theme'`.
3. **Toggling**:
   * When settings are saved in `settings.tsx`, the `patch` method is invoked:
     ```typescript
     if (p.theme) {
       document.documentElement.setAttribute("data-theme", p.theme);
     }
     ```
     This triggers a PATCH request to `/api/settings` to persist the update.
   * To prevent Flash of Unstyled Content (FOUC), `src/Nexus.Frontend/src/routes/__root.tsx` contains an inline blocking script in the `<head>` of the `RootShell` component (lines 127-137):
     ```html
     <script dangerouslySetInnerHTML={{ __html: `
       (function() {
         try {
           var t = localStorage.getItem('nexus-theme');
           if (t) document.documentElement.setAttribute('data-theme', t);
           var tt = localStorage.getItem('nexus-terminal-theme');
           if (tt) document.documentElement.setAttribute('data-terminal-theme', tt);
         } catch(e) {}
       })();
     ` }} />
     ```
   * An additional `useEffect` hook in `RootComponent` runs after mount to fetch master values from `/api/settings` and align `localStorage`:
     ```typescript
     fetch("/api/settings")
       .then(res => res.json())
       .then(data => {
         if (data.theme) {
           document.documentElement.setAttribute("data-theme", data.theme);
           try { localStorage.setItem("nexus-theme", data.theme); } catch(e) {}
         }
       })
     ```

---

### Stitch MCP Design Tokens
* **Stitch MCP Schema**:
  The schema for `create_design_system` in `C:\Users\OrgAdmin\.gemini\antigravity\mcp\StitchMCP\create_design_system.json` details the target token parameters:
  * `theme`: `DesignTheme` object specifying:
    * `bodyFont` / `headlineFont` / `labelFont` (e.g. `SPACE_GROTESK`, `INTER`, `JETBRAINS_MONO`)
    * `colorMode` (`LIGHT`, `DARK`)
    * `colorVariant` (`MONOCHROME`, `NEUTRAL`, `TONAL_SPOT`, `VIBRANT`, etc.)
    * `customColor` (seed hex color, e.g. `"#ff0000"`)
    * `roundness` (`ROUND_FOUR`, `ROUND_EIGHT`, `ROUND_TWELVE`, `ROUND_FULL`)
    * `overridePrimaryColor`, `overrideSecondaryColor`, etc.
* **Current Status**:
  * A repository-wide PowerShell search was run to find any existing references to Stitch:
    `Get-ChildItem -Path src, tests -Recurse -File | Where-Object { $_.FullName -notmatch "\\node_modules\\" } | Select-String -Pattern "Stitch"`
  * No matching strings were found in the source or tests directories, verifying that no Stitch configurations, scripts, or outputs currently exist.
  * In the overall execution plan (`.agents/orchestrator/plan.md`), Stitch MCP tools (`create_design_system`, `generate_variants`, `apply_design_system`) are scheduled to be executed during Milestone 3 to generate the new `cyberpunk-neon` tokens and register them.

---

## 2. Logic Chain

1. **Identifying settings/styling files**:
   * Inspecting the root directory layout using `list_dir` showed `src` and `tests` as primary code boundaries, with `.gitnexus` and `playwright.config.ts` confirming the tech stack.
   * `list_dir` of the frontend directory showed `components.json`, `package.json`, and `src/styles.css` as styling targets.
   * `package.json` confirmed Tailwind CSS v4.2.1 is configured via `@tailwindcss/vite`.
   * Under Tailwind v4 conventions, utility mappings and custom theme declarations are defined directly inside `styles.css`. Viewing `styles.css` confirmed the presence of custom CSS variables defining the global theme colors.

2. **Identifying theme toggle & persistence logic**:
   * Inspecting `styles.css` revealed the CSS selectors `[data-theme="light"]`, `[data-theme="slate"]`, and `[data-theme="stealth"]` mapped to overriding custom properties.
   * Querying the codebase for `theme` and `AppSettings` using GitNexus (`node .gitnexus/run.cjs query`) pointed to `settings.tsx` (frontend) and `AppSettingsController.cs` (backend).
   * Viewing `settings.tsx` verified that selecting a theme modifies the `data-theme` attribute on `document.documentElement` and sends a PATCH request to `/api/settings`.
   * Viewing `__root.tsx` confirmed an inline `<script>` tag is used for FOUC protection via `localStorage` lookups, and a client-side API call synchronized backend-persisted settings.

3. **Locating Stitch tokens**:
   * Viewing the Stitch MCP schema directories under `C:\Users\OrgAdmin\.gemini\antigravity\mcp\StitchMCP` identified the precise parameter structure required for design system declarations.
   * Running a filtered PowerShell file scan across all non-`node_modules` folders yielded zero matches for `Stitch`, indicating that the implementation of Stitch tokens is not yet present and is planned for Milestone 3 (as referenced in `plan.md`).

---

## 3. Caveats

* **Database Persistence**: The database is SQLite (`nexus.db`). The E2E tests in Milestone 2 must ensure they mock the API or operate on a clean sqlite file during validation to prevent test-run contamination.
* **Tailwind v4 Integration**: The Tailwind config is fully inline in `styles.css`. Any new theme variables (like `cyberpunk-neon`) must be appended as selectors in `styles.css` and mapped to Tailwind inline rules if they need to be bridged as utility classes.

---

## 4. Conclusion

The application implements a robust, database-persisted and locally-cached theme system with built-in FOUC protection. Themes are governed by `data-theme` HTML attributes matching CSS custom variables in a Tailwind CSS v4 environment.
There are no existing Stitch design system files or configurations in the workspace. Implementing the `cyberpunk-neon` theme will require invoking the Stitch MCP tools in Milestone 3, mapping the generated tokens to new attribute selectors in `styles.css`, and updating the `settings.tsx` page options and `AppSettings` type/controller.

---

## 5. Verification Method

To verify these observations independently:
1. **Locate settings files**:
   Verify existence of `src/Nexus.Frontend/src/styles.css` and `src/Nexus.Frontend/src/routes/settings.tsx`.
2. **Observe theme selectors**:
   Run the following PowerShell command to locate theme selectors in CSS:
   `Select-String -Path src/Nexus.Frontend/src/styles.css -Pattern "data-theme"`
   Expected output: matches for `[data-theme="dark"]`, `[data-theme="light"]`, `[data-theme="slate"]`, and `[data-theme="stealth"]`.
3. **Verify Stitch absence**:
   Confirm that a search for "Stitch" in source code returns no results:
   `Get-ChildItem -Path src, tests -Recurse -File | Where-Object { $_.FullName -notmatch "\\node_modules\\" } | Select-String -Pattern "Stitch"`
   Expected output: empty or no hits in actual source files.
