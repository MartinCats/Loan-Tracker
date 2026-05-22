import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { registerTabScrollHandler } from "@/utils/tabScrollRegistry";

export default function SettingsScreen() {
  const rootRef = useRef<View>(null);

  useEffect(() => {
    return registerTabScrollHandler("settings", () => {
      rootRef.current?.setNativeProps({});
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <View ref={rootRef} className="flex-1 items-center justify-center px-6 pb-24">
        <Text className="text-xl font-semibold text-white">Settings placeholder</Text>
      </View>
    </SafeAreaView>
  );
}
