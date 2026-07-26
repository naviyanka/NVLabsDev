# Detailed Analysis: NEXUS Frontend Themes, Settings, and Build Configurations

## 1. Theme Implementation (styles.css & Components)

### App-wide UI Themes
App-wide themes are implemented in **`src/Nexus.Frontend/src/styles.css`** using CSS Custom Properties (CSS variables) that are dynamically loaded on the `<html>` root element. 

Four UI themes are supported:
- **Signal Room (Dark)**: The default theme applied on `:root` and when `[data-theme="dark"]` is active.
- **Pure Light**: Triggered by `[data-theme="light"]`.
- **Slate**: Triggered by `[data-theme="slate"]`.
- **Stealth (OLED)**: Triggered by `[data-theme="stealth"]`.

#### CSS Custom Variables Map
Themes override core CSS custom properties to swap background, foreground, border, text, and accent colors:

| Theme | Selector | Void Background (`--bg-void`) | Card Background (`--bg-card`) | Primary Accent (`--amber`) | Secondary Accent (`--teal`) | Text Color (`--text`) |
|---|---|---|---|---|---|---|
| **Signal Room (Dark)** | `:root`, `[data-theme="dark"]` | `#09090f` | `#111428` | `#e8a020` | `#0effd0` | `#dde3f0` |
| **Pure Light** | `[data-theme="light"]` | `#f8fafc` | `#ffffff` | `#f59e0b` | `#0d9488` | `#0f172a` |
| **Slate** | `[data-theme="slate"]` | `#0f172a` | `#1e293b` | `#38bdf8` | `#818cf8` | `#f8fafc` |
| **Stealth (OLED)** | `[data-theme="stealth"]` | `#000000` | `#050505` | `#10b981` | `#3b82f6` | `#f5f5f5` |

#### Tailwind CSS v4 Theme Bridge
Tailwind CSS v4 is configured to map these CSS custom variables directly to Tailwind utility classes inside the `@theme inline` block in `styles.css`. This includes a bridge for **shadcn/ui** variables:

```css
@theme inline {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  --color-void: var(--bg-void);
  --color-surface: var(--bg-surface);
  --color-card: var(--bg-card);
  --color-border: var(--border-c);
  --color-border-dim: var(--border-dim);

  /* ... */

  /* shadcn token bridge */
  --color-background: var(--bg-void);
  --color-foreground: var(--text);
  --color-primary: var(--amber);
  --color-primary-foreground: #09090f;
  --color-secondary: var(--bg-card);
  --color-secondary-foreground: var(--text);
  --color-muted: var(--bg-card);
  --color-muted-foreground: var(--text-sub);
  --color-accent: var(--bg-card);
  --color-accent-foreground: var(--text);
  --color-destructive: var(--crit);
  --color-destructive-foreground: #ffffff;
  --color-input: var(--border-c);
  --color-ring: var(--amber);
  --color-popover: var(--bg-card);
  --color-popover-foreground: var(--text);
  --color-card-bg: var(--bg-card);
  --color-card-foreground: var(--text);
}
```

Components use these variables through clean Tailwind utility utilities (e.g. `bg-void`, `text-text`, `border-border`, `bg-card`).

#### Anti-FOUC (Flash of Unstyled Content) Mitigation
To prevent visual flashing on initial render before the client-side JavaScript bundle runs, an inline IIFE script is embedded in `RootShell` (`src/Nexus.Frontend/src/routes/__root.tsx` lines 128-137):
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
This script reads the cached theme values from `localStorage` and applies the attributes `data-theme` and `data-terminal-theme` to the `<html>` tag before the HTML body starts parsing and painting.

---

### Terminal Themes (PowerShell PTY)
The PowerShell page (`src/Nexus.Frontend/src/routes/powershell.tsx`) hosts interactive terminals powered by **xterm.js**. Since canvas/WebGL-based terminal displays cannot read standard DOM CSS variables directly, terminal themes are handled via a dedicated JavaScript configuration.

#### Terminal Theme Map
Eight terminal themes are defined inside the `getTheme()` function:
```typescript
const TERMINAL_THEMES: any = {
  "nexus-dark":  { bg: "#050508", prompt: "#f59e0b", output: "#94a3b8", cursor: "#f59e0b" },
  "win-classic": { bg: "#0c0c0c", prompt: "#cccccc", output: "#cccccc", cursor: "#ffffff" },
  "matrix":      { bg: "#020e02", prompt: "#00ff41", output: "#009921", cursor: "#00ff41" },
  "solarized":   { bg: "#002b36", prompt: "#268bd2", output: "#839496", cursor: "#268bd2" },
  "dracula":     { bg: "#282a36", prompt: "#ff79c6", output: "#f8f8f2", cursor: "#bd93f9" },
  "cobalt":      { bg: "#001e3c", prompt: "#00bcd4", output: "#b0bec5", cursor: "#00bcd4" },
  "monokai":     { bg: "#272822", prompt: "#e6db74", output: "#f8f8f2", cursor: "#a6e22e" },
  "nord":        { bg: "#2e3440", prompt: "#88c0d0", output: "#d8dee9", cursor: "#88c0d0" },
};
```

#### Theme Application and Reactivity
1. **MutationObserver**: In `PowerShellPage` (lines 60-64), a `MutationObserver` listens for changes to the `data-terminal-theme` attribute on the `<html>` tag:
   ```typescript
   useEffect(() => {
     const observer = new MutationObserver(() => setTheme(getTheme()));
     observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-terminal-theme"] });
     return () => observer.disconnect();
   }, []);
   ```
2. **Terminal Syncing**: When the state `theme` changes, a React `useEffect` hook in the child `TerminalSession` component updates the raw xterm options (lines 215-223):
   ```typescript
   useEffect(() => {
     if (session.xterm) {
       session.xterm.options.theme = {
         background: theme.bg,
         foreground: theme.output,
         cursor: theme.cursor
       };
     }
   }, [theme]);
   ```

---

## 2. Settings Page Operation (`settings.tsx`)

The settings page at **`src/Nexus.Frontend/src/routes/settings.tsx`** exposes configuration sections (General, Appearance, Security, Monitoring, Data, Extensions, Testing, Backend Logs). 

### How Settings are Retrieved
1. **Initial Mount Load**: A `useEffect` hook on mount (lines 82-90) executes a GET request to `/api/settings`:
   ```typescript
   useEffect(() => {
     fetch("/api/settings")
       .then(res => res.json())
       .then(data => {
         setS(data);
         document.documentElement.setAttribute("data-theme", data.theme);
       })
       .catch(err => toast.error("Failed to load settings"));
   }, []);
   ```
   The backend retrieves this from the SQLite database using Entity Framework Core (queried by key `"global"` in `AppSettingsController.cs`).
2. **Global Level Sync**: During app startup, `RootComponent` in `__root.tsx` also fetches `/api/settings` and caches the theme values in local storage (`nexus-theme` and `nexus-terminal-theme`) to be ready for the anti-FOUC script.

### How Theme Selectors are Rendered
Within the "Appearance" section:
- **UI Theme Selector**: Displays a grid of 4 buttons mapping to the UI themes. The active button is styled with a prominent border and accent background:
  ```tsx
  {[
    { id: "dark", name: "Signal Room (Dark)" },
    { id: "light", name: "Pure Light" },
    { id: "slate", name: "Slate" },
    { id: "stealth", name: "Stealth (OLED)" }
  ].map(t => (
    <button 
      key={t.id} 
      onClick={() => patch({ theme: t.id as AppSettings["theme"] })} 
      className={"p-3 rounded-md border text-[12px] text-center transition-colors " + 
        (s.theme === t.id 
          ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" 
          : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)]")}
    >
      {t.name}
    </button>
  ))}
  ```
- **Terminal Theme Selector**: Renders a 4-column preview grid (lines 170-196) displaying a miniature text-based preview of a mock PowerShell shell for each of the 8 terminal themes:
  ```tsx
  <div style={{ background: t.bg, padding: "8px 10px", ... }}>
    <div style={{ color: t.prompt }}>PS C:\&gt; <span style={{ color: t.output }}>Get-Process</span></div>
    /* ... */
  </div>
  ```

### How Theme Settings are Updated
Updates are processed in the component using a `patch` helper function:
```typescript
function patch(p: Partial<AppSettings>) {
  if (!s) return;
  const next = { ...s, ...p };
  setS(next);
  if (p.theme) {
    document.documentElement.setAttribute("data-theme", p.theme);
  }
  if (p.terminalTheme) {
    document.documentElement.setAttribute("data-terminal-theme", p.terminalTheme);
    try { localStorage.setItem("nexus-terminal-theme", p.terminalTheme); } catch(e) {}
  }
  
  fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(next)
  }).then(res => {
    if(res.ok) toast.success("Settings saved");
    else toast.error("Failed to save settings");
  });
}
```

#### Important Syncing Behaviors and Local Storage Discrepancy:
- **Terminal Theme (`terminalTheme`)**: When changed, it immediately calls `localStorage.setItem("nexus-terminal-theme", p.terminalTheme)` in the client browser.
- **UI Theme (`theme`)**: When changed via `patch()`, it updates `document.documentElement`'s `data-theme` attribute and calls `PATCH /api/settings`, but does *not* write to `localStorage` immediately. Instead, `localStorage` is updated with `nexus-theme` when the user reloads the application and `RootComponent` runs its fetch mount effect.

---

## 3. Build & Compiler Configurations (Tailwind & PostCSS)

This project has **no separate `tailwind.config.js` or `postcss.config.js` files** at the root or within `src/Nexus.Frontend`.

Instead, the project leverages **Tailwind CSS v4**, which is fully compiler-driven:

### 1. Build Integration (Vite)
- In `src/Nexus.Frontend/package.json`, the dependencies include:
  - `"tailwindcss": "^4.2.1"`
  - `"@tailwindcss/vite": "^4.2.1"`
- In `src/Nexus.Frontend/vite.config.ts`, the bundler imports `defineConfig` from `@lovable.dev/vite-tanstack-config`.
- This shared configuration package registers the `@tailwindcss/vite` compiler plugin under the hood. The compiler intercepts CSS files and processes Tailwind directives directly inside Vite without needing PostCSS as a separate middleware layer.

### 2. Configuration Entrypoint (`styles.css`)
Since Tailwind CSS v4 relies on CSS-first configuration rather than JavaScript objects, all custom configuration is declared inside **`src/Nexus.Frontend/src/styles.css`**:
- `@import "tailwindcss" source(none);` imports Tailwind v4.
- `@source "../src";` specifies where the compiler should look for utility classes (our React files).
- Custom variables and theme mappings are configured via `@theme inline { ... }` (lines 9-56).
- Custom utility classes are declared using the `@utility` directive:
  - `@utility eyebrow` (lines 174-180)
  - `@utility mono` (lines 182-184)
  - `@utility display` (lines 186-189)
  - `@utility nx-card` (lines 191-195)
  - `@utility metric-bar` (lines 197-202)
  - `@utility metric-fill` (lines 204-209)
- Custom viewport variants are configured via `@custom-variant`:
  - `@custom-variant dark (&:is(.dark *));` (line 5)
- Custom animations are defined via standard `@keyframes`:
  - `@keyframes nx-pulse` (lines 211-214)
  - `@keyframes nx-spin-slow` (lines 216-218)
  - `@keyframes nx-ring-pulse` (lines 220-223)

### 3. Component/Shadcn/UI Bridge (`components.json`)
The shadcn/ui configuration at `src/Nexus.Frontend/components.json` is set to bridge styles directly through the `styles.css` file:
```json
"tailwind": {
  "css": "src/styles.css",
  "baseColor": "slate",
  "cssVariables": true,
  "prefix": ""
}
```
This causes any shadcn components added to place their variable-dependent tailwind styles in the `styles.css` structure, matching the `@theme inline` bridge.
