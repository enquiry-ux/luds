import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { DEFAULT_SETTINGS, DiamondPricing, MetalSymbol, Settings } from './pricing';
import { SpotSnapshot } from './spot';
import { Button, Card, colors, NumberField, TextField } from './ui';

type Props = {
  settings: Settings;
  onChange: (settings: Settings) => void;
  spot: SpotSnapshot | null;
  onManualSpot: (snapshot: SpotSnapshot) => void;
};

const METAL_NAMES: Record<MetalSymbol, string> = { XAU: 'Gold', XPT: 'Platinum', XAG: 'Silver' };

export function SettingsScreen({ settings, onChange, spot, onManualSpot }: Props) {
  const [manual, setManual] = useState<Partial<Record<MetalSymbol, number>>>({});
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });
  const cur = settings.currency;

  const setDiamonds = (patch: Partial<DiamondPricing>) => set({ diamonds: { ...settings.diamonds, ...patch } });
  const d = settings.diamonds;

  const saveManual = () => {
    const prices = { ...(spot?.currency === cur ? spot.prices : {}) };
    (Object.keys(manual) as MetalSymbol[]).forEach((k) => {
      if (manual[k]) prices[k] = manual[k];
    });
    if (!prices.XAU) {
      Alert.alert('Enter a gold price', 'Gold price per troy ounce is required.');
      return;
    }
    onManualSpot({ prices, currency: cur, fetchedAt: new Date().toISOString(), source: 'manual' });
    setManual({});
    Alert.alert('Saved', 'Manual prices will be used until the next refresh.');
  };

  return (
    <View>
      <Card title="Markups">
        <Text style={local.help}>Retail = cost × markup, then GST is added and rounded up.</Text>
        <NumberField label="Metal, setting & labour" value={settings.markupMetalLabour} onChange={(v) => set({ markupMetalLabour: v })} suffix="×" />
        <NumberField label="Natural diamonds" value={settings.markupNatural} onChange={(v) => set({ markupNatural: v })} suffix="×" />
        <NumberField label="Lab-grown diamonds" value={settings.markupLab} onChange={(v) => set({ markupLab: v })} suffix="×" />
        <View style={local.pair}>
          <NumberField label="GST" value={settings.gstPercent} onChange={(v) => set({ gstPercent: v })} suffix="%" />
          <View style={{ width: 10 }} />
          <NumberField label="Round retail up to" value={settings.roundTo} onChange={(v) => set({ roundTo: v })} suffix={cur} />
        </View>
      </Card>

      <Card title="Costs">
        <NumberField label="Metal loss / wastage" value={settings.metalLossPercent} onChange={(v) => set({ metalLossPercent: v })} suffix="%" />
        <NumberField label="Setting cost per stone" value={settings.settingCostPerStone} onChange={(v) => set({ settingCostPerStone: v })} suffix={cur} />
        <TextField label="Currency (3-letter code)" value={settings.currency} onChange={(v) => set({ currency: v.toUpperCase().slice(0, 3) })} />
      </Card>

      <Card title="Lab-grown diamonds">
        <Text style={local.help}>One price per carat for all small lab-grown stones.</Text>
        <View style={local.pair}>
          <NumberField label="Price per carat" value={d.labPricePerCarat} onChange={(v) => setDiamonds({ labPricePerCarat: v })} suffix={cur} />
          <View style={{ width: 10 }} />
          <NumberField label="Up to size" value={d.labMaxCarat} onChange={(v) => setDiamonds({ labMaxCarat: v })} suffix="ct" />
        </View>
      </Card>

      <Card title="Natural diamonds">
        <Text style={local.help}>
          Price per carat rises evenly from the smallest size to the largest. Stones in between are priced on that scale.
        </Text>
        <View style={local.pair}>
          <NumberField label="Smallest size" value={d.naturalMinCarat} onChange={(v) => setDiamonds({ naturalMinCarat: v })} suffix="ct" />
          <View style={{ width: 10 }} />
          <NumberField label="Price per carat" value={d.naturalMinPrice} onChange={(v) => setDiamonds({ naturalMinPrice: v })} suffix={cur} />
        </View>
        <View style={local.pair}>
          <NumberField label="Largest size" value={d.naturalMaxCarat} onChange={(v) => setDiamonds({ naturalMaxCarat: v })} suffix="ct" />
          <View style={{ width: 10 }} />
          <NumberField label="Price per carat" value={d.naturalMaxPrice} onChange={(v) => setDiamonds({ naturalMaxPrice: v })} suffix={cur} />
        </View>
      </Card>

      <Card title="Manual spot price">
        <Text style={local.help}>
          Prices refresh automatically each day. If the feed is down, enter today's price per troy ounce in {cur}.
        </Text>
        {(['XAU', 'XPT', 'XAG'] as MetalSymbol[]).map((s) => (
          <NumberField
            key={s}
            label={`${METAL_NAMES[s]} per oz`}
            value={manual[s] ?? 0}
            onChange={(v) => setManual((m) => ({ ...m, [s]: v }))}
            placeholder={spot?.prices[s] ? spot.prices[s]!.toFixed(2) : '0'}
            suffix={cur}
          />
        ))}
        <Button label="Use these prices" onPress={saveManual} />
      </Card>

      <Button
        label="Reset all settings to defaults"
        kind="danger"
        onPress={() =>
          Alert.alert('Reset settings?', 'Markups, costs and diamond prices go back to the defaults.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => onChange(DEFAULT_SETTINGS) },
          ])
        }
      />
    </View>
  );
}

const local = StyleSheet.create({
  help: { fontSize: 13, color: colors.muted, marginBottom: 12 },
  pair: { flexDirection: 'row' },
});
