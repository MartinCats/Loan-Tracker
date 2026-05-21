import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type QuickActionTone = "primary" | "neutral" | "danger";

type QuickActionButtonProps = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: QuickActionTone;
};

const toneClassNames: Record<QuickActionTone, { shell: string; icon: string; text: string }> = {
  primary: {
    shell: "border-mint/20 bg-mint/10",
    icon: "text-mint",
    text: "text-white"
  },
  neutral: {
    shell: "border-white/10 bg-white/5",
    icon: "text-gold",
    text: "text-white"
  },
  danger: {
    shell: "border-danger/20 bg-danger/10",
    icon: "text-danger",
    text: "text-white"
  }
};

export function QuickActionButton({ label, icon, tone }: QuickActionButtonProps) {
  const styles = toneClassNames[tone];

  return (
    <Pressable
      accessibilityRole="button"
      disabled
      className={`flex-1 items-center gap-2 rounded-[20px] border px-3 py-4 ${styles.shell}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/5">
        <Ionicons name={icon} size={18} className={styles.icon} />
      </View>
      <Text className={`text-center text-[13px] font-semibold ${styles.text}`}>{label}</Text>
    </Pressable>
  );
}
