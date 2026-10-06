import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS, MetalSymbol, Settings, SpotPrices } from './pricing';

// Free, no-key sources. Metal prices come back in USD per troy ounce and are
// converted with the European Central Bank reference rate via Frankfurter.
const METAL_URL = (symbol: MetalSymbol) => `https://api.gold-api.com/price/${symbol}`;
const FX_URL = (to: string) => `https://api.frankfurter.app/latest?from=USD&to=${to}`;

const SYMBOLS: MetalSymbol[] = ['XAU', 'XPT', 'XAG'];

export type SpotSnapshot = {
  prices: SpotPrices; // per troy ounce in `currency`
  currency: string;
  fetchedAt: string; // ISO timestamp
  source: 'live' | 'manual';
};

const SPOT_KEY = 'spot-snapshot-v1';
const SETTINGS_KEY = 'settings-v1';

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

export async function fetchLiveSpot(currency: string): Promise<SpotSnapshot> {
  const fx = currency === 'USD' ? 1 : Number((await getJson(FX_URL(currency))).rates?.[currency]);
  if (!Number.isFinite(fx) || fx <= 0) throw new Error(`No USD→${currency} exchange rate`);

  const prices: SpotPrices = {};
  const results = await Promise.allSettled(SYMBOLS.map((s) => getJson(METAL_URL(s))));
  results.forEach((r, i) => {
    const usd = r.status === 'fulfilled' ? Number(r.value?.price) : NaN;
    if (Number.isFinite(usd) && usd > 0) prices[SYMBOLS[i]] = usd * fx;
  });
  if (prices.XAU == null) throw new Error('Gold price unavailable');

  return { prices, currency, fetchedAt: new Date().toISOString(), source: 'live' };
}

export function isFromToday(snapshot: SpotSnapshot | null): boolean {
  if (!snapshot) return false;
  return new Date(snapshot.fetchedAt).toDateString() === new Date().toDateString();
}

export async function loadSpot(): Promise<SpotSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(SPOT_KEY);
    return raw ? (JSON.parse(raw) as SpotSnapshot) : null;
  } catch {
    return null;
  }
}

export async function saveSpot(snapshot: SpotSnapshot): Promise<void> {
  await AsyncStorage.setItem(SPOT_KEY, JSON.stringify(snapshot));
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      priceTable: { ...DEFAULT_SETTINGS.priceTable, ...saved.priceTable },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
