import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { theme } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted
      }}
    >
      <Tabs.Screen
        name="index"
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
        options={{
          title: "Loans",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="wallet-outline" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: "Archive",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="archive-outline" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="settings"
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
