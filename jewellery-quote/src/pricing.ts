// Pure pricing logic: no React, no network. Everything the quote screen shows
// is derived from these functions so the maths lives in one place.

export const GRAMS_PER_TROY_OUNCE = 31.1034768;

export type MetalSymbol = 'XAU' | 'XAG' | 'XPT';

export type MetalOption = {
  id: string;
  label: string;
  symbol: MetalSymbol;
  purity: number; // fraction of pure metal, e.g. 18ct = 0.75
};

export const METAL_OPTIONS: MetalOption[] = [
  { id: '9k', label: '9ct gold', symbol: 'XAU', purity: 0.375 },
  { id: '18k', label: '18ct gold', symbol: 'XAU', purity: 0.75 },
  { id: 'pt950', label: 'Platinum 950', symbol: 'XPT', purity: 0.95 },
  { id: 'ag925', label: 'Sterling silver 925', symbol: 'XAG', purity: 0.925 },
];

export type DiamondOrigin = 'lab' | 'natural';

export type Stone = {
  key: string;
  origin: DiamondOrigin | null; // null until the user has answered lab or natural
  caratEach: number;
  quantity: number;
  pricePerCaratOverride: number | null; // null = use the price table in settings
};

// Price-per-carat table, keyed by the lower bound of each size band (carats).
export const SIZE_BANDS = [0, 0.1, 0.3, 0.5, 1, 1.5, 2, 3] as const;

export type PriceTable = Record<DiamondOrigin, number[]>; // one entry per SIZE_BANDS

export function bandLabel(index: number): string {
  const lo = SIZE_BANDS[index];
  const hi = SIZE_BANDS[index + 1];
  if (hi === undefined) return `${lo.toFixed(2)}ct +`;
  return `${lo.toFixed(2)}–${(hi - 0.01).toFixed(2)}ct`;
}

export function bandIndexFor(caratEach: number): number {
  let idx = 0;
  SIZE_BANDS.forEach((lo, i) => {
    if (caratEach >= lo) idx = i;
  });
  return idx;
}

export type Settings = {
  currency: string;
  metalLossPercent: number; // casting / alloy loss added on top of the metal weight
  settingCostPerStone: number;
  markupMetalLabour: number; // multiplier, e.g. 2.5 = cost × 2.5
  markupNatural: number;
  markupLab: number;
  gstPercent: number;
  roundTo: number; // round the retail price up to the nearest N
  priceTable: PriceTable;
};

// Starting values only. Diamond prices swing widely with colour, clarity and cut,
// so the team should replace these with their own supplier prices in Settings.
export const DEFAULT_SETTINGS: Settings = {
  currency: 'AUD',
  metalLossPercent: 8,
  settingCostPerStone: 15,
  markupMetalLabour: 2.2,
  markupNatural: 1.8,
  markupLab: 2.5,
  gstPercent: 10,
  roundTo: 10,
  priceTable: {
    natural: [900, 1600, 2800, 4200, 9000, 13000, 18000, 26000],
    lab: [250, 350, 450, 550, 700, 800, 900, 1000],
  },
};

export type SpotPrices = Partial<Record<MetalSymbol, number>>; // per troy ounce, in settings.currency

export type QuoteInput = {
  metalId: string;
  metalGrams: number;
  stones: Stone[];
  labour: number;
  otherCosts: number;
};

export type StoneLine = {
  stone: Stone;
  pricePerCarat: number;
  totalCarat: number;
  cost: number;
};

export type QuoteResult = {
  metal: MetalOption;
  spotPerOunce: number | null;
  pricePerGramPure: number | null;
  metalCost: number;
  stoneLines: StoneLine[];
  naturalCost: number;
  labCost: number;
  settingCost: number;
  labour: number;
  otherCosts: number;
  costPrice: number;
  retailExGst: number;
  gst: number;
  retailIncGst: number;
  recommendedRetail: number; // GST-inclusive, rounded up
  marginPercent: number; // on the ex-GST rounded price
  problems: string[];
};

export function pricePerCaratFor(stone: Stone, table: PriceTable): number {
  if (stone.pricePerCaratOverride != null) return stone.pricePerCaratOverride;
  if (!stone.origin) return 0;
  return table[stone.origin][bandIndexFor(stone.caratEach)] ?? 0;
}

export function roundUp(value: number, step: number): number {
  if (step <= 0) return Math.round(value * 100) / 100;
  return Math.ceil(value / step - 1e-9) * step;
}

export function calculateQuote(input: QuoteInput, spot: SpotPrices, settings: Settings): QuoteResult {
  const problems: string[] = [];
  const metal = METAL_OPTIONS.find((m) => m.id === input.metalId) ?? METAL_OPTIONS[1];

  const spotPerOunce = spot[metal.symbol] ?? null;
  const pricePerGramPure = spotPerOunce != null ? spotPerOunce / GRAMS_PER_TROY_OUNCE : null;
  if (pricePerGramPure == null && input.metalGrams > 0) {
    problems.push(`No ${metal.symbol === 'XAU' ? 'gold' : metal.label} spot price yet. Refresh or enter it in Settings.`);
  }
  const metalCost =
    (pricePerGramPure ?? 0) * metal.purity * input.metalGrams * (1 + settings.metalLossPercent / 100);

  const stoneLines: StoneLine[] = input.stones.map((stone) => {
    const pricePerCarat = pricePerCaratFor(stone, settings.priceTable);
    const totalCarat = stone.caratEach * stone.quantity;
    return { stone, pricePerCarat, totalCarat, cost: pricePerCarat * totalCarat };
  });
  input.stones.forEach((s, i) => {
    if (!s.origin && s.quantity > 0) problems.push(`Diamond ${i + 1}: choose Lab or Natural.`);
  });

  const naturalCost = sum(stoneLines.filter((l) => l.stone.origin === 'natural').map((l) => l.cost));
  const labCost = sum(stoneLines.filter((l) => l.stone.origin === 'lab').map((l) => l.cost));
  const stoneCount = sum(input.stones.map((s) => s.quantity));
  const settingCost = stoneCount * settings.settingCostPerStone;

  const metalAndLabour = metalCost + settingCost + input.labour + input.otherCosts;
  const costPrice = metalAndLabour + naturalCost + labCost;

  const retailExGst =
    metalAndLabour * settings.markupMetalLabour +
    naturalCost * settings.markupNatural +
    labCost * settings.markupLab;
  const gst = retailExGst * (settings.gstPercent / 100);
  const retailIncGst = retailExGst + gst;
  const recommendedRetail = roundUp(retailIncGst, settings.roundTo);
  const recommendedExGst = recommendedRetail / (1 + settings.gstPercent / 100);
  const marginPercent = recommendedExGst > 0 ? ((recommendedExGst - costPrice) / recommendedExGst) * 100 : 0;

  return {
    metal,
    spotPerOunce,
    pricePerGramPure,
    metalCost,
    stoneLines,
    naturalCost,
    labCost,
    settingCost,
    labour: input.labour,
    otherCosts: input.otherCosts,
    costPrice,
    retailExGst,
    gst,
    retailIncGst,
    recommendedRetail,
    marginPercent,
    problems,
  };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
