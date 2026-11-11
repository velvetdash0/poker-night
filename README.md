# Poker Night

A one-phone ledger for a home poker game. Track buy-ins and rebuys, what each player has at the end, and cash already handed over mid-game. The settle-up list updates as you type, and the whole game stays on the device.

No accounts, no server, no sync. Closing the app does not drop the current game.

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

`vercel.json` already sets the build command to `expo export -p web` and publishes the `dist` folder. From this directory:

```bash
npm install -g vercel
vercel
```

Or connect the git repository in the Vercel dashboard and leave the framework preset empty. The config file supplies the build command, output directory, and the rewrite that serves the single-page app.

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
