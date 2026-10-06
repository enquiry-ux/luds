import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_SETTINGS, Settings } from './src/pricing';
import { QuoteScreen } from './src/QuoteScreen';
import { SettingsScreen } from './src/SettingsScreen';
import { fetchLiveSpot, isFromToday, loadSettings, loadSpot, saveSettings, saveSpot, SpotSnapshot } from './src/spot';
import { colors } from './src/ui';

type Tab = 'quote' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('quote');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [spot, setSpot] = useState<SpotSnapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [spotError, setSpotError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const state = useRef({ settings, spot });
  state.current = { settings, spot };

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setSpotError(null);
    try {
      const snapshot = await fetchLiveSpot(state.current.settings.currency);
      setSpot(snapshot);
      await saveSpot(snapshot);
    } catch (e) {
      setSpotError(
        `Couldn't update spot prices (${e instanceof Error ? e.message : 'network error'}). ` +
          (state.current.spot ? 'Using the last saved prices.' : 'Enter them manually in Settings.'),
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh once per day: on launch and whenever the app comes back to the foreground.
  const refreshIfStale = useCallback(() => {
    const { spot: s, settings: st } = state.current;
    if (!isFromToday(s) || s?.currency !== st.currency) refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      const [savedSettings, savedSpot] = await Promise.all([loadSettings(), loadSpot()]);
      state.current = { settings: savedSettings, spot: savedSpot };
      setSettings(savedSettings);
      setSpot(savedSpot);
      setLoaded(true);
      refreshIfStale();
    })();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshIfStale();
    });
    return () => sub.remove();
  }, [refreshIfStale]);

  const changeSettings = (next: Settings) => {
    const currencyChanged = next.currency !== settings.currency && next.currency.length === 3;
    state.current = { ...state.current, settings: next };
    setSettings(next);
    saveSettings(next);
    if (currencyChanged) refresh();
  };

  const manualSpot = (snapshot: SpotSnapshot) => {
    setSpot(snapshot);
    setSpotError(null);
    saveSpot(snapshot);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.title}>Jewellery Quote</Text>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {!loaded ? null : tab === 'quote' ? (
              <QuoteScreen settings={settings} spot={spot} refreshing={refreshing} spotError={spotError} onRefresh={refresh} />
            ) : (
              <SettingsScreen settings={settings} onChange={changeSettings} spot={spot} onManualSpot={manualSpot} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {(['quote', 'settings'] as Tab[]).map((t) => (
            <Pressable key={t} style={styles.tab} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'quote' ? 'Quote' : 'Settings'}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  tabBarWrap: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 16, color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: colors.gold },
});
