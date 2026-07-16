# Seek Consciousness

GitHub-ready website build.

## Structure

- `index.html` — page markup
- `assets/css/styles.css` — all website styling
- `assets/js/site.js` — all website interactions
- `assets/media/` — images and hero video

## Uploading to GitHub

Upload the complete folder structure, not only `index.html`.

For GitHub Pages:

1. Commit all files to the repository.
2. Open **Settings → Pages**.
3. Select the branch containing `index.html`.
4. Use the repository root as the publishing folder.

All asset paths are relative, so the site works on GitHub Pages and most
standard static hosting platforms.

## Why the previous file was difficult to commit

The standalone HTML embedded every image and the MP4 as Base64. This made one
HTML file approximately 18 MB and created extremely long lines. This version
stores each asset once as a normal file and keeps the HTML small and readable.
