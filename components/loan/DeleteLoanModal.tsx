import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

type DeleteLoanModalProps = {
  borrowerName?: string;
  error?: string | null;
  isSubmitting?: boolean;
  message?: string;
  title?: string;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteLoanModal({
  borrowerName,
  error,
  isSubmitting = false,
  message = "This will permanently delete this loan and its payment history.",
  title = "Delete loan?",
  visible,
  onClose,
  onConfirm
}: DeleteLoanModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70 px-5" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="rounded-[28px] border border-danger/20 bg-surface p-5 shadow-lg shadow-danger/10">
          <View className="gap-2">
            <Text className="text-[22px] font-semibold text-white">{title}</Text>
            <Text className="text-[14px] leading-6 text-muted">
              {message}
            </Text>
            {borrowerName ? (
              <Text className="text-[13px] font-semibold text-danger">{borrowerName}</Text>
            ) : null}
          </View>

          {error ? <Text className="mt-4 text-[13px] text-danger">{error}</Text> : null}

          <View className="mt-6 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              className="flex-1 items-center rounded-full border border-white/10 bg-white/5 px-4 py-3 active:opacity-80"
            >
              <Text className="text-[14px] font-semibold text-white">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={async () => {
                if (isSubmitting) return;

                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning
                );

                onConfirm();
              }}
              className="flex-1 items-center rounded-full bg-danger px-4 py-3 active:opacity-80 disabled:opacity-60"
            >
              <Text className="text-[14px] font-semibold text-white">
                {isSubmitting ? "Deleting..." : "Delete"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
