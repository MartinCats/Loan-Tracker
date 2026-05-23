import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { PressableScale } from "@/components/ui/PressableScale";
import { impactLight } from "@/utils/haptics";

type QuickActionTone = "primary" | "neutral" | "danger";

type QuickActionButtonProps = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: QuickActionTone;
  disabled?: boolean;
  onPress?: () => void;
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

export function QuickActionButton({
  label,
  icon,
  tone,
  disabled = false,
  onPress
}: QuickActionButtonProps) {
  const styles = toneClassNames[tone];

  return (
    <PressableScale
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        impactLight();
        onPress?.();
      }}
      className={`flex-1 items-center gap-2 rounded-[20px] border px-3 py-4 ${disabled ? "opacity-70" : "active:opacity-80"} ${styles.shell}`}
      contentClassName="items-center gap-2"
      scaleTo={0.97}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/5">
        <Ionicons name={icon} size={18} className={styles.icon} />
      </View>
      <Text className={`text-center text-[13px] font-semibold ${styles.text}`}>{label}</Text>
    </PressableScale>
  );
}
