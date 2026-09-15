# Midnight BSH — landing page & Android wrapper

A static, backend-free page describing the Midnight BSH project. It is
built and deployed by two workflows in `../.github/workflows/`:

- `pages.yml` → GitHub Pages
- `apk.yml` → a signed Android APK, wrapping this same page in a Capacitor
  WebView, published to a rolling `apk` GitHub Release

The main app (`../`) is not static — it needs Postgres and a Node server —
so this page is a description of the project, not the project itself.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # -> dist/index.html (single self-contained file)
npx cap sync android   # after a build, to refresh the wrapped Android app
```

To try the Android build locally you need the Android SDK + a JDK; CI
(`../.github/workflows/apk.yml`) has both preinstalled on `ubuntu-latest`
runners, so pushing to `main` is the easiest way to get an APK without
setting any of that up yourself:

```bash
cd android
./gradlew assembleRelease   # -> android/app/build/outputs/apk/release/
```

## Regenerating icons

`assets/icon.png` (1024×1024) and `assets/splash.png` (2732×2732) are the
source images; regenerate the actual Android resources from them with:

```bash
npx capacitor-assets generate --android
```
