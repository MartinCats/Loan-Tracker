import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { theme } from "@/constants/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="loan/[id]" options={{ title: "Loan Detail" }} />
      </Stack>
    </>
  );
}
