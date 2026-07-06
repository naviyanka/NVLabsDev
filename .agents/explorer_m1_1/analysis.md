# Stitch MCP Server and Design System Token Analysis

## 1. Overview of Stitch MCP Configuration
Stitch MCP is configured as a remote Model Context Protocol (MCP) server in the global `C:\Users\OrgAdmin\.gemini\config\mcp_config.json` file. It connects over standard input/output (stdio) using a proxy client (`mcp-remote`) with Google API Key credentials:
```json
"StitchMCP": {
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote",
    "https://stitch.googleapis.com/mcp",
    "--header",
    "X-Goog-Api-Key: AQ.Ab8RN6LX32fyNsskFevnVsGjrfKoVZgwB8E5Xd5qYaV6glT1iw"
  ]
}
```

---

## 2. Exploration of Current Projects, Design Systems, and Screens
Using direct JSON-RPC messages sent to the Stitch MCP server stdio channel, we executed the core listing and creation tools.

### A. Projects (`list_projects`)
- **Initial State**: Running `list_projects` on the connection initially returned `{}` (empty JSON object inside text content), indicating that no projects existed in the Stitch account.
- **Created Project**: We successfully created a new project to host our exploration:
  - **Tool Name**: `create_project`
  - **Arguments**: `{ "title": "Nexus Cyberpunk Explorer" }`
  - **Result**:
    ```json
    {
      "name": "projects/3025252520653166800",
      "title": "Nexus Cyberpunk Explorer",
      "visibility": "PRIVATE",
      "projectType": "PROJECT_DESIGN",
      "origin": "STITCH"
    }
    ```
    This established our **Project ID**: `3025252520653166800`.
- **Updated Projects List**: Querying `list_projects` again returned a list containing the newly created project `projects/3025252520653166800`.

### B. Design Systems (`list_design_systems`)
- **Initial State**: Querying `list_design_systems` with `projectId: "3025252520653166800"` returned `{}` (empty list).
- **Created Design System**: We successfully created a `"cyberpunk-neon"` design system under the project:
  - **Tool Name**: `create_design_system`
  - **Arguments**:
    ```json
    {
      "projectId": "3025252520653166800",
      "designSystem": {
        "displayName": "cyberpunk-neon",
        "theme": {
          "colorMode": "DARK",
          "headlineFont": "SPACE_GROTESK",
          "bodyFont": "INTER",
          "roundness": "ROUND_FOUR",
          "customColor": "#ff0055",
          "colorVariant": "VIBRANT",
          "overridePrimaryColor": "#ff0055",
          "overrideSecondaryColor": "#0effd0",
          "overrideTertiaryColor": "#e8a020",
          "overrideNeutralColor": "#09090f"
        }
      }
    }
    ```
  - **Result**:
    ```json
    {
      "name": "assets/1095390097661349488",
      "designSystem": {
        "displayName": "cyberpunk-neon",
        "theme": {
          "bodyFont": "INTER",
          "colorMode": "DARK",
          "colorVariant": "VIBRANT",
          "customColor": "#ff0055",
          "headlineFont": "SPACE_GROTESK",
          "overrideNeutralColor": "#09090f",
          "overridePrimaryColor": "#ff0055",
          "overrideSecondaryColor": "#0effd0",
          "overrideTertiaryColor": "#e8a020",
          "roundness": "ROUND_FOUR"
        }
      },
      "version": "1"
    }
    ```
    This established our design system **Asset ID**: `1095390097661349488`.
- **Updated Design Systems List**: Running `list_design_systems` again returned a list containing the newly created `cyberpunk-neon` asset.

### C. Screens (`list_screens`)
- **Initial State**: Querying `list_screens` with `projectId: "3025252520653166800"` returned `{}` (empty list), since it is a newly created design project with no screen mocks defined yet.

---

## 3. Analysis of Token Lifecycle (Creation, Update, Application)

### A. Creation
Design system tokens are established by calling either `create_design_system` (defining parameters programmatically) or `create_design_system_from_design_md` (defining styling via a Markdown file uploaded with `upload_design_md`).
The core tokens are contained in the `DesignTheme` schema:
1. **Typography**: Specified via Google Fonts enums for `headlineFont`, `bodyFont`, and `labelFont` (e.g. `SPACE_GROTESK`, `INTER`, `GEIST`, `JETBRAINS_MONO`).
2. **Colors**: Generated dynamically using Material You-like palette algorithms from:
   - `customColor`: A seed color hex string (e.g. `"#ff0055"`).
   - `colorMode`: `"LIGHT"` or `"DARK"`.
   - `colorVariant`: Presets like `"VIBRANT"`, `"MONOCHROME"`, `"NEUTRAL"`, `"TONAL_SPOT"`, etc.
   - **Overrides**: Precise color mappings can be forced using `overridePrimaryColor`, `overrideSecondaryColor`, `overrideTertiaryColor`, and `overrideNeutralColor`.
3. **Shapes**: Corner radius specified via `roundness` enum: `"ROUND_FOUR"`, `"ROUND_EIGHT"`, `"ROUND_TWELVE"`, `"ROUND_FULL"`.
4. **Spacing/Typography Scale**: Maps spacing and size key-values to CSS units.

### B. Update
Tokens are updated using `update_design_system` by passing the revised `DesignSystem` object. The server increments the design system `version` number (e.g., `version: "2"`).

### C. Application
Design systems are applied to screen instances using the `apply_design_system` tool:
- **Parameters**: Takes `projectId`, `assetId` (the design system ID), and an array of `selectedScreenInstances`.
- **Action**: The Stitch theme engine maps the color, typography, and shape tokens onto the elements of the selected screen instances, generating/compiling CSS variables and inline styles matching the theme tokens.

---

## 4. How to Generate/Apply a "cyberpunk-neon" Design System Theme
We can leverage the Stitch MCP to generate and apply this style by executing the following steps:

1. **Define Core Theme Properties**:
   For a cyberpunk-neon glassmorphism look, dark background base, and sharp neon accents:
   - **Background (`overrideNeutralColor`)**: `#09090f` (deep void dark blue/black)
   - **Primary Accent (`overridePrimaryColor`)**: `#ff0055` (neon pink/magenta)
   - **Secondary Accent (`overrideSecondaryColor`)**: `#0effd0` (neon teal/cyan)
   - **Tertiary Accent (`overrideTertiaryColor`)**: `#e8a020` (neon amber/yellow)
   - **Typography (`headlineFont` / `bodyFont`)**: `"SPACE_GROTESK"` (futuristic geometric geometric sans) and `"INTER"` or `"JETBRAINS_MONO"`.
   - **Corner Rounding (`roundness`)**: `"ROUND_FOUR"` (sharp, geometric high-tech edges).

2. **Execute Create**:
   Run `create_design_system` using the parameters defined above. This generates the dynamic tokens on the remote server and returns a design system Asset ID.

3. **Map Screens**:
   Call `get_project` with our Project ID (`3025252520653166800`) to retrieve the `screenInstances` present in the project.

4. **Apply Theme**:
   Execute `apply_design_system` passing the project ID, design system asset ID, and the list of screen instances. Stitch will automatically compile and apply these token values to modify the screens' styling.
