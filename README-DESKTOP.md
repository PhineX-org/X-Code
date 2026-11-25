# Publishing the X Code desktop app

## What goes where (repo: github.com/PhineX-org/X-Code)

```
index.html        ← the new download page          (replace the old one)
embed.html        ← docs for the embeddable widget (new)
XCode.html        ← the editor: runs in the browser AND inside the desktop app
XCode.js          ← the embeddable widget
X-Code.png
desktop/          ← the Electron app (package.json, main.js, preload.js, build/ icons)
.github/workflows/release.yml   ← builds the installers for you
```

## Get the installers (about 10 minutes, no tools to install)

1. Copy everything above into the repo and push to `main`.
2. Create a version tag and push it:
   ```
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. Open the repo's **Actions** tab. A "Build installers" run builds Windows, macOS and Linux on
   GitHub's own machines.
4. When it finishes, the **Releases** page has these files — the download buttons on index.html
   point at exactly these names:

   | File | Platform |
   |---|---|
   | `X-Code-Setup.exe` | Windows |
   | `X-Code-mac-arm64.dmg` / `X-Code-mac-x64.dmg` | macOS (Apple Silicon / Intel) |
   | `X-Code-linux.AppImage` / `X-Code-linux.deb` | Linux |

The buttons use `releases/latest/download/<file>`, so every future release (`v1.0.1`, …) is picked up
automatically with no change to index.html.

`installers/` holds the Linux builds made while developing, cut into parts of 24 MB or less so they pass GitHub's
25 MB web-upload limit (join them with `join.bat` on Windows or `./join.sh` on Linux/Mac; `SHA256SUMS.txt` lets you verify the result).
End users should get whole files from the Releases page instead — GitHub Releases accepts files up to 2 GB.

## Try the desktop app locally
```
cd desktop
npm install
npm start          # copies ../XCode.html in, then opens the app
npm run build:linux   # or build:win on Windows, build:mac on a Mac
```

## Things to know
- **Not code-signed yet.** Windows shows "Windows protected your PC" (More info → Run anyway) and
  macOS needs right-click → Open the first time. Removing the warnings needs a paid Windows
  code-signing certificate and an Apple Developer account; index.html already explains this to users.
- The maintainer email in `desktop/package.json` (`PhineX-org@users.noreply.github.com`) is a
  placeholder — set your real one before publishing the .deb.
