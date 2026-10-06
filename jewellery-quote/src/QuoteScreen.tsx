import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import {
  calculateQuote,
  DiamondOrigin,
  METAL_OPTIONS,
  money,
  QuoteInput,
  Settings,
  Stone,
} from './pricing';
import { SpotSnapshot } from './spot';
import { Button, Card, colors, NumberField, Row, Segmented, TextField } from './ui';

let nextKey = 1;
const newStone = (): Stone => ({
  key: String(nextKey++),
  origin: null,
  caratEach: 0,
  quantity: 1,
  pricePerCaratOverride: null,
});

const EMPTY_QUOTE: QuoteInput = { metalId: '18k', metalGrams: 0, stones: [], labour: 0, otherCosts: 0 };

type Props = {
  settings: Settings;
  spot: SpotSnapshot | null;
  refreshing: boolean;
  spotError: string | null;
  onRefresh: () => void;
};

export function QuoteScreen({ settings, spot, refreshing, spotError, onRefresh }: Props) {
  const [customer, setCustomer] = useState('');
  const [piece, setPiece] = useState('');
  const [quote, setQuote] = useState<QuoteInput>(EMPTY_QUOTE);

  const cur = settings.currency;
  const fmt = (v: number) => money(v, cur);
  const result = useMemo(() => calculateQuote(quote, spot?.prices ?? {}, settings), [quote, spot, settings]);

  const update = (patch: Partial<QuoteInput>) => setQuote((q) => ({ ...q, ...patch }));
  const updateStone = (key: string, patch: Partial<Stone>) =>
    setQuote((q) => ({ ...q, stones: q.stones.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));

  const reset = () => {
    setCustomer('');
    setPiece('');
    setQuote(EMPTY_QUOTE);
  };

  const share = () => {
    const lines = [
      `Quote${piece ? ` – ${piece}` : ''}`,
      customer ? `For: ${customer}` : null,
      `Date: ${new Date().toLocaleDateString('en-AU')}`,
      '',
      `${result.metal.label}, ${quote.metalGrams} g`,
      ...result.stoneLines.map(
        (l, i) =>
          `Diamond ${i + 1}: ${l.stone.quantity} × ${l.stone.caratEach}ct ${l.stone.origin === 'lab' ? 'lab-grown' : 'natural'}`,
      ),
      '',
      `Price: ${fmt(result.recommendedRetail)} (inc. GST)`,
    ].filter((l) => l !== null);
    Share.share({ message: lines.join('\n') });
  };

  const goldSpot = spot?.prices.XAU;
  const fetched = spot ? new Date(spot.fetchedAt) : null;

  return (
    <View>
      <Card
        title="Spot prices"
        right={
          <Pressable onPress={onRefresh} disabled={refreshing} hitSlop={10}>
            <Text style={local.link}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
          </Pressable>
        }
      >
        <Row label="Gold (per oz)" value={goldSpot != null ? fmt(goldSpot) : '—'} />
        <Row
          label={`${result.metal.label} (per g, before loss)`}
          value={result.pricePerGramPure != null ? fmt(result.pricePerGramPure * result.metal.purity) : '—'}
        />
        <Text style={local.small}>
          {fetched
            ? `${spot?.source === 'manual' ? 'Entered manually' : 'Updated'} ${fetched.toLocaleString('en-AU', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })} · ${spot?.currency}`
            : 'No prices loaded yet.'}
        </Text>
        {spotError ? <Text style={local.error}>{spotError}</Text> : null}
      </Card>

      <Card title="Piece">
        <TextField label="Customer" value={customer} onChange={setCustomer} placeholder="Optional" />
        <TextField label="Description" value={piece} onChange={setPiece} placeholder="e.g. Solitaire engagement ring" />
      </Card>

      <Card title="Metal">
        <View style={local.chips}>
          {METAL_OPTIONS.map((m) => {
            const active = m.id === quote.metalId;
            return (
              <Pressable key={m.id} onPress={() => update({ metalId: m.id })} style={[local.chip, active && local.chipActive]}>
                <Text style={[local.chipText, active && local.chipTextActive]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <NumberField label="Finished weight" value={quote.metalGrams} onChange={(v) => update({ metalGrams: v })} suffix="g" />
        <Row label={`Metal cost (incl. ${settings.metalLossPercent}% loss)`} value={fmt(result.metalCost)} />
      </Card>

      <Card title="Diamonds">
        {quote.stones.length === 0 ? <Text style={local.small}>No diamonds on this piece.</Text> : null}
        {quote.stones.map((stone, i) => {
          const line = result.stoneLines[i];
          return (
            <View key={stone.key} style={local.stone}>
              <View style={local.stoneHeader}>
                <Text style={local.stoneTitle}>Diamond {i + 1}</Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => setQuote((q) => ({ ...q, stones: q.stones.filter((s) => s.key !== stone.key) }))}
                >
                  <Text style={[local.link, { color: colors.danger }]}>Remove</Text>
                </Pressable>
              </View>
              <Text style={local.question}>Is this diamond lab-grown or natural?</Text>
              <Segmented<DiamondOrigin>
                options={[
                  { value: 'lab', label: 'Lab-grown' },
                  { value: 'natural', label: 'Natural' },
                ]}
                value={stone.origin}
                onChange={(origin) => updateStone(stone.key, { origin })}
              />
              <View style={local.pair}>
                <NumberField
                  label="Carat (each)"
                  value={stone.caratEach}
                  onChange={(v) => updateStone(stone.key, { caratEach: v })}
                  suffix="ct"
                />
                <View style={{ width: 10 }} />
                <NumberField label="Quantity" value={stone.quantity} onChange={(v) => updateStone(stone.key, { quantity: Math.round(v) })} />
              </View>
              <NumberField
                label={`Price per carat (blank = standard: ${stone.origin ? fmt(line.pricePerCarat) : 'choose type'})`}
                value={stone.pricePerCaratOverride ?? 0}
                onChange={(v) => updateStone(stone.key, { pricePerCaratOverride: v > 0 ? v : null })}
                placeholder="Use standard price"
              />
              <Row label={`${line.totalCarat.toFixed(2)}ct total`} value={fmt(line.cost)} />
            </View>
          );
        })}
        <Button label="+ Add diamond" kind="secondary" onPress={() => update({ stones: [...quote.stones, newStone()] })} />
      </Card>

      <Card title="Labour & extras">
        <NumberField label="Labour / manufacturing" value={quote.labour} onChange={(v) => update({ labour: v })} suffix={cur} />
        <NumberField label="Other costs (findings, engraving, freight…)" value={quote.otherCosts} onChange={(v) => update({ otherCosts: v })} suffix={cur} />
        <Row label={`Setting (${settings.settingCostPerStone} × stones)`} value={fmt(result.settingCost)} />
      </Card>

      <Card title="Quote">
        {result.problems.map((p) => (
          <Text key={p} style={local.error}>
            {p}
          </Text>
        ))}
        <Row label="Metal" value={fmt(result.metalCost)} />
        {result.naturalCost > 0 ? <Row label="Natural diamonds" value={fmt(result.naturalCost)} /> : null}
        {result.labCost > 0 ? <Row label="Lab-grown diamonds" value={fmt(result.labCost)} /> : null}
        <Row label="Setting, labour & extras" value={fmt(result.settingCost + result.labour + result.otherCosts)} />
        <View style={local.divider} />
        <Row label="Cost price" value={fmt(result.costPrice)} strong />
        <View style={local.divider} />
        <Row label="Retail ex GST" value={fmt(result.retailExGst)} />
        <Row label={`GST ${settings.gstPercent}%`} value={fmt(result.gst)} />
        <View style={local.retailBox}>
          <Text style={local.retailLabel}>Recommended retail (inc. GST)</Text>
          <Text style={local.retailValue}>{fmt(result.recommendedRetail)}</Text>
          <Text style={local.small}>Margin {result.marginPercent.toFixed(0)}% of ex-GST price</Text>
        </View>
        <View style={local.pair}>
          <View style={{ flex: 1 }}>
            <Button label="Share quote" onPress={share} disabled={result.problems.length > 0} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button label="New quote" kind="secondary" onPress={reset} />
          </View>
        </View>
      </Card>
    </View>
  );
}

const local = StyleSheet.create({
  link: { color: colors.gold, fontWeight: '600', fontSize: 15 },
  small: { fontSize: 13, color: colors.muted, marginTop: 6 },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 14,
    overflow: 'hidden',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingVertical: 7, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.ink, fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  stone: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 12, marginBottom: 12 },
  stoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stoneTitle: { fontWeight: '700', fontSize: 15, color: colors.ink },
  question: { fontSize: 14, color: colors.ink, marginBottom: 8 },
  pair: { flexDirection: 'row' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  retailBox: { backgroundColor: colors.goldSoft, borderRadius: 12, padding: 14, marginVertical: 12, alignItems: 'center' },
  retailLabel: { fontSize: 14, color: colors.muted },
  retailValue: { fontSize: 32, fontWeight: '800', color: colors.ink, marginTop: 4, fontVariant: ['tabular-nums'] },
});
