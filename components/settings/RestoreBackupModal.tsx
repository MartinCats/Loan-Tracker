import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { PressableScale } from "@/components/ui/PressableScale";
import { t } from "@/services/i18n";

type RestoreBackupModalProps = {
  error?: string | null;
  isSubmitting: boolean;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function RestoreBackupModal({
  error,
  isSubmitting,
  visible,
  onClose,
  onConfirm
}: RestoreBackupModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70 px-4 pb-5">
        <View className="rounded-[28px] border border-border bg-surface p-5 shadow-2xl shadow-black/40">
          <View className="mb-5 flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-1">
              <Text className="text-[22px] font-semibold text-white">{t("settings.restoreConfirmTitle")}</Text>
              <Text className="text-[13px] leading-5 text-muted">
                {t("settings.restoreConfirmDescription")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/5"
            >
              <Text className="text-lg text-muted">x</Text>
            </Pressable>
          </View>

          {error ? <Text className="mb-4 text-[13px] leading-5 text-danger">{error}</Text> : null}

          <View className="flex-row gap-3">
            <PressableScale
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              className="flex-1 items-center rounded-[18px] border border-white/10 bg-white/5 px-4 py-4"
              scaleTo={0.97}
            >
              <Text className="text-[15px] font-semibold text-white">{t("common.cancel")}</Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onConfirm}
              className={`flex-1 items-center rounded-[18px] px-4 py-4 ${
                isSubmitting ? "bg-white/10" : "bg-danger"
              }`}
              scaleTo={0.97}
            >
              <View className="h-5 flex-row items-center gap-2">
                {isSubmitting ? <ActivityIndicator color="#8A9691" size="small" /> : null}
                <Text className={`text-[15px] font-semibold ${isSubmitting ? "text-muted" : "text-background"}`}>
                  {isSubmitting ? t("settings.restoring") : t("settings.restoreAction")}
                </Text>
              </View>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}
