import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { theme } from "@/constants/theme";
import { scrollTabToTop } from "@/utils/tabScrollRegistry";

const doubleTapThresholdMs = 350;
const lastTabPressByRoute: Record<string, number> = {};

function handleTabPress(routeName: string) {
  const now = Date.now();
  const lastPressAt = lastTabPressByRoute[routeName] ?? 0;

  if (now - lastPressAt <= doubleTapThresholdMs) {
    scrollTabToTop(routeName);
  }

  lastTabPressByRoute[routeName] = now;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: "rgba(13, 20, 29, 0.94)",
          borderTopColor: theme.colors.borderSoft
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.mutedSoft,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500"
        },
        tabBarItemStyle: {
          paddingVertical: 2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: () => handleTabPress("index")
        }}
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="pie-chart-outline" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="loans"
        listeners={{
          tabPress: () => handleTabPress("loans")
        }}
        options={{
          title: "Loans",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="wallet-outline" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="archive"
        listeners={{
          tabPress: () => handleTabPress("archive")
        }}
        options={{
          title: "Archive",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="archive-outline" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={{
          tabPress: () => handleTabPress("settings")
        }}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="settings-outline" size={size} />
          )
        }}
      />
    </Tabs>
  );
}
