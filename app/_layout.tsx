import "../global.css";

import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";
import { t } from "@/services/i18n";
import { useSettingsStore } from "@/store/settingsStore";

export default function RootLayout() {
  const initializeLanguage = useSettingsStore((state) => state.initializeLanguage);
  const language = useSettingsStore((state) => state.language);

  useEffect(() => {
    initializeLanguage().catch(() => {
      // Thai is the default visible language if persisted/device locale cannot load.
    });
  }, [initializeLanguage]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="loan/[id]" options={{ title: t("loanDetail.title") }} key={language} />
      </Stack>
    </SafeAreaProvider>
  );
}
