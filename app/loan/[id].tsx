import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-xl font-semibold text-white">Loan detail placeholder</Text>
      <Text className="mt-2 text-sm text-muted">Loan ID: {id}</Text>
    </View>
  );
}
