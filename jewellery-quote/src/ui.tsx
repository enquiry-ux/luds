import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const colors = {
  bg: '#F6F3EE',
  card: '#FFFFFF',
  ink: '#1D1B18',
  muted: '#6F6A62',
  line: '#E4DED4',
  gold: '#A8812F',
  goldSoft: '#F3E9D2',
  danger: '#B3261E',
  dangerSoft: '#FBE9E7',
};

export function parseNumber(text: string): number {
  const n = Number(text.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  placeholder?: string;
};

// Keeps the raw text while typing so "0." or "" don't get reformatted mid-edit.
export function NumberField({ label, value, onChange, suffix, placeholder }: NumberFieldProps) {
  const [text, setText] = useState(value ? String(value) : '');
  useEffect(() => {
    if (parseNumber(text) !== value) setText(value ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          placeholder={placeholder ?? '0'}
          placeholderTextColor="#B7B0A5"
          keyboardType="decimal-pad"
          onChangeText={(t) => {
            setText(t);
            onChange(parseNumber(t));
          }}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, styles.inputRowLike]}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#B7B0A5"
        onChangeText={onChange}
      />
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ title, right, children }: { title?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        kind === 'secondary' && styles.buttonSecondary,
        kind === 'danger' && styles.buttonDanger,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.buttonText, kind !== 'primary' && styles.buttonTextAlt, kind === 'danger' && { color: colors.danger }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrong]}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  field: { flex: 1, marginBottom: 12 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 12,
  },
  inputRowLike: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 17, paddingVertical: 10, color: colors.ink },
  suffix: { fontSize: 15, color: colors.muted, marginLeft: 6 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#EFEAE2',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segmentText: { fontSize: 15, color: colors.muted, fontWeight: '500' },
  segmentTextActive: { color: colors.ink, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonSecondary: { backgroundColor: colors.goldSoft },
  buttonDanger: { backgroundColor: colors.dangerSoft },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  buttonTextAlt: { color: colors.gold },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rowLabel: { fontSize: 15, color: colors.muted, flexShrink: 1, paddingRight: 8 },
  rowValue: { fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  rowStrong: { fontWeight: '700', color: colors.ink, fontSize: 17 },
});
