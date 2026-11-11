# Poker Night

A one-phone ledger for a home poker game. Track buy-ins and rebuys, what each player has at the end, and cash already handed over mid-game. The settle-up list updates as you type, and the whole game stays on the device.

No accounts, no server, no sync. Closing the app does not drop the current game.

The hosted app is [https://velvetdash0.github.io/poker-night/](https://velvetdash0.github.io/poker-night/).

## GitHub Pages

Every push to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml):

1. `npm ci`
2. `npm test`
3. `npx expo export -p web`
4. Copy `dist/index.html` to `dist/404.html` (so a missing path still loads the app) and add `dist/.nojekyll`
5. Upload `dist` and deploy it with GitHub Pages

The site is a project page, so it is served under `/poker-night`, not at the domain root. `experiments.baseUrl` in `app.json` is `/poker-night`, and the web manifest, icons, and bundle URLs use that prefix. `npx expo start --web` uses the same base path: open `http://localhost:8081/poker-night/`.

The workflow calls `actions/configure-pages` with `enablement: true`, which tries to turn Pages on and set the source to GitHub Actions. That call needs a token that can administer the repository. The default `GITHUB_TOKEN` often cannot, and the job then fails before the deploy. If that happens, open the repo on GitHub, go to **Settings → Pages → Build and deployment**, and set **Source** to **GitHub Actions**. The next push deploys.

## Run it

Install dependencies, then start Expo:

```bash
npm install
npx expo start
```

### Expo Go

1. Install the current Expo Go from the Play Store or App Store. This project is Expo SDK 58, so Expo Go needs to be new enough to open that SDK.
2. Phone and computer on the same Wi-Fi.
3. `npx expo start`
4. Android: scan the QR code in the terminal with Expo Go. iPhone: scan with the Camera app.

If the phone cannot see your computer, start a tunnel instead:

```bash
npx expo start --tunnel
```

### In the browser

```bash
npx expo start --web
```

A production web bundle is the same app, exported to static files:

```bash
npx expo export -p web
npx expo serve
```

## Android APK

`eas.json` has a `preview` profile that builds an installable `.apk` (`android.buildType` is `apk`), not a Play Store bundle. You need a free Expo account.

```bash
npm install -g eas-cli
npx eas login
npx eas build -p android --profile preview
```

When the build finishes, open the build page from the link in the terminal and download the `.apk`. On the Android phone, open that file and allow install from the browser if Android asks. The package name is `com.pokernight.app`.

`npx eas build -p android --profile production` builds an `.aab` for the Play Store instead.

## Deploy the web app to Vercel

The export is set up for GitHub Pages at `/poker-night`. A Vercel site at the root of a domain will request assets from `/poker-night/...` and miss them. To host at a domain root, set `experiments.baseUrl` in `app.json` to `"/"` (and point the manifest `start_url`, `scope`, and icon URLs at `/`), then export again.

`vercel.json` sets the build command to `expo export -p web` and publishes the `dist` folder:

```bash
npm install -g vercel
vercel
```

## Tests

Settlement is a pure function in `src/settle.ts` (no React Native). Stats, shared editing, or a PayNow handoff can call it later without touching the screen.

```bash
npm test
```

The suite includes the table from the product example: Ann in 100 out 40, Ben in 100 out 190, Cal in 100 out 70, Ann paid Ben 20 during the game. That settles as “Ann pays Ben $40” and “Cal pays Ben $30”. It also covers an unbalanced count, an all-zero table, and a larger set of players.

## How a game is scored

- **In** is money bought in. The green plus adds a buy-in or rebuy. Tap the number itself to correct the total.
- **Out** is the chip or cash stack at the end.
- Long-press a name, or tap **Paid during game**, to record cash handed from one player to another before the end. Undo is on that sheet.
- Net for each player is `Out − In + paid − received`. Positive means the table owes them.
- **Balanced** means those nets sum to zero (cash-outs match buy-ins). Otherwise the screen says **Off by $X**.
- Transfers repeatedly match the largest debtor with the largest creditor.
- **History** is every change, timestamped in Singapore time, and it is saved with the game.
- **Share** sends a plain-text summary through the system share sheet (WhatsApp, Telegram, and the rest). In a desktop browser it copies the summary instead.
- **New game** wipes the ledger on this phone after a confirmation.

Everything is stored locally with AsyncStorage.
