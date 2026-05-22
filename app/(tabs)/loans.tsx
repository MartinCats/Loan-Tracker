import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoansScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <View className="flex-1 items-center justify-center px-6 pb-24">
      <Text className="text-xl font-semibold text-white">Loans placeholder</Text>
      </View>
    </SafeAreaView>
  );
}
