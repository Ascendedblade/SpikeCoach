# Copilot Instructions for SpikeCoach

## Project Overview
SpikeCoach is a static web application consisting of HTML, CSS, and image assets. It does not use a build system, frameworks, or external dependencies. All logic and styling are handled directly in the provided files.

## Key Files
- `index.html`: Main entry point. Contains all markup and any embedded scripts.
- `style.css`: Contains all styles for the application. No CSS frameworks detected.
- `manifest.json`: Web app manifest for PWA support (icons, name, etc.).
- `*.png`: Image assets for UI and branding.

## Architecture & Patterns
- **Single-page static site**: No routing, backend, or dynamic data sources.
- **Direct file editing**: Changes are made by editing HTML and CSS files directly. No transpilation or bundling.
- **Asset referencing**: Images are referenced by relative paths in HTML/CSS.
- **Manifest usage**: `manifest.json` configures icons and PWA metadata; update icons here for branding changes.

## Developer Workflow
- **Preview**: Open `index.html` in a browser to view changes. No build or serve step required.
- **Debugging**: Use browser dev tools for inspecting layout, styles, and assets.
- **Adding assets**: Place new images in the root directory and reference them in HTML/CSS.
- **Updating styles**: Edit `style.css` directly. Follow existing class/id naming conventions.

## Project-Specific Conventions
- All assets are stored in the project root.
- No JavaScript files detected; all interactivity (if any) is inline in `index.html`.
- Use descriptive filenames for images and icons (e.g., `spikecoach_icon.png`).
- Manifest icons should match those referenced in HTML for consistency.

## Example Patterns
- To add a new icon: Place the PNG in the root, update `manifest.json`, and reference it in `index.html`.
- To change styles: Edit or add CSS rules in `style.css`, then reload `index.html` in the browser.

## Integration Points
- No external APIs or libraries detected.
- PWA support is enabled via `manifest.json` (ensure icons and metadata are up to date).

## References
- `index.html`, `style.css`, `manifest.json` in the project root.
- All image assets in the project root.

---
For questions about project structure or conventions, review the above files for examples. If adding new features, maintain the static, asset-driven approach unless requirements change.
