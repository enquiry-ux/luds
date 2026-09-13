# Midsleep — installable build

Everything needed to install Midsleep as a real app: its own icon, its own
window, no address bar, and it opens with no connection at all.

    index.html              the app
    manifest.webmanifest    name, icons, standalone display
    sw.js                   service worker — caches the shell, and fonts once seen
    icon-*.png              192, 512 and a maskable 512
    apple-touch-icon.png    iOS home screen

All paths are relative, so this folder installs correctly from any sub-directory.

## It has to be served over HTTPS

Installation requires a secure context served at the top level. `localhost`
counts as secure, so any of these work:

**Try it locally**

    cd dist && python3 -m http.server 8000

then open `http://localhost:8000`. Chrome shows an install icon in the address
bar; the app's own Download tab also grows an **Install** button.

**Put it online** — drop this folder on Netlify Drop, Cloudflare Pages, Vercel,
or any static host. Or enable GitHub Pages for this repository and visit
`/apps/midsleep/dist/`.

**iPhone / iPad** — Safari does not offer an install prompt. Open the page,
tap Share, then *Add to Home Screen*. The manifest and apple-touch-icon give it
the right name and icon, and it opens without Safari's chrome.

## Opening index.html directly

Double-clicking works and the app runs, but a `file://` page cannot register a
service worker, so there is no install and no offline caching of fonts — the
page falls back to system fonts. Everything else, including saving your diary,
works the same.

## Where the data goes

Into this browser's `localStorage`, on this device. Nothing is uploaded and
nothing syncs. The Download tab's **Export** writes a JSON file; **Import**
reads it back, which is how you move between an installed copy and the hosted
one. Clearing site data clears the diary, so export occasionally if it matters.

## Rebuilding

`index.html` here is the app source from the parent directory wrapped in a head
with the PWA tags and the service-worker registration. Regenerate it after
changing the app rather than editing it in place.
