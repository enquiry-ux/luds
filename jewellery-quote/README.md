# Jewellery Quote

An iPhone app (built with Expo / React Native) for quoting jewellery pieces.

- **Updates spot prices every day.** Gold, platinum and silver refresh when the app opens and again when it comes back to the foreground on a new day. There is also a Refresh button. Prices come from gold-api.com (USD per troy ounce) and are converted to AUD with the ECB rate from frankfurter.app. Neither needs an API key. If the feed is down, enter prices manually under Settings → Manual spot price.
- **Metal cost:** finished weight (g) × spot price per gram × purity (9ct, 10ct, 14ct, 18ct, 22ct, 24ct, Pt950, Ag925) × (1 + loss %).
- **Diamonds:** asks for each stone whether it is **lab-grown or natural**, then takes the carat and quantity. The price per carat comes from your price table by size band, or you can type a price for that stone. The quote can't be shared until every stone has been marked lab or natural.
- **Cost price:** metal + diamonds + setting (per stone) + labour + other costs.
- **Recommended retail:** cost × markup (separate markups for metal/labour, natural and lab), plus 10% GST, rounded up to the nearest $10. These can all be changed in Settings.
- **Share quote:** sends a short summary by text, email or AirDrop.

> The diamond price table starts with placeholder values. Before using quotes with customers, open **Settings → Diamond price table** and enter your own supplier prices. Do the same for the markups.

## Try it on your iPhone now (Expo Go)

1. Install **Expo Go** from the App Store.
2. On a computer with Node 20+:
   ```bash
   cd jewellery-quote
   npm install
   npx expo start
   ```
3. Scan the QR code with the iPhone camera.

## Install it on the team's iPhones (TestFlight)

This needs an Apple Developer account (about A$149/yr).

```bash
npm install -g eas-cli
eas login
eas build --platform ios       # builds in the cloud, no Mac/Xcode needed
eas submit --platform ios      # uploads to App Store Connect
```

Then add your team as testers in App Store Connect → TestFlight. They install it through the TestFlight app. You don't need public App Store review for internal testers.

The bundle ID is `au.com.ernestobuono.jewelleryquote`, set in `app.json`. Change it if you want a different one.

## Code

| File | What it does |
| --- | --- |
| `src/pricing.ts` | All the quote maths and the default settings |
| `src/spot.ts` | Fetches live spot prices and saves prices and settings on the device |
| `src/QuoteScreen.tsx` | Quote builder |
| `src/SettingsScreen.tsx` | Markups, costs, diamond price table and manual spot prices |

Checks: `npx tsc --noEmit`
