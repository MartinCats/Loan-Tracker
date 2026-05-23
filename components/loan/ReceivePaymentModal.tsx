import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

import { PressableScale } from "@/components/ui/PressableScale";
import { t } from "@/services/i18n";
import { impactLight } from "@/utils/haptics";

type ReceivePaymentModalProps = {
  visible: boolean;
  amount: string;
  note: string;
  amountDue: string;
  isSubmitting: boolean;
  error?: string | null;
  canSubmit: boolean;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onUseFullAmount: () => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function ReceivePaymentModal({
  visible,
  amount,
  note,
  amountDue,
  isSubmitting,
  error,
  canSubmit,
  onAmountChange,
  onNoteChange,
  onUseFullAmount,
  onSubmit,
  onClose
}: ReceivePaymentModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/70 px-4 pb-5"
      >
        <View className="max-h-[88%] rounded-[28px] border border-border bg-surface shadow-2xl shadow-black/40">
          <ScrollView
            contentContainerClassName="gap-5 p-5 pb-8"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1 gap-1">
                <Text className="text-[22px] font-semibold text-white">{t("receivePayment.title")}</Text>
                <Text className="text-[13px] leading-5 text-muted">
                  {t("receivePayment.subtitle")}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/5"
              >
                <Text className="text-lg text-muted">x</Text>
              </Pressable>
            </View>

            <View className="gap-4">
              <View className="rounded-[20px] border border-mint/15 bg-mint/5 p-4">
                <Text className="text-[12px] text-muted">{t("receivePayment.currentAmountDue")}</Text>
                <Text className="mt-1 text-[26px] font-semibold text-white">{amountDue}</Text>
              </View>

              <View className="gap-2">
                <Text className="text-[13px] font-medium text-muted">{t("receivePayment.paymentAmount")}</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={onAmountChange}
                  placeholder="0"
                  placeholderTextColor="#747F7B"
                  className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-[24px] font-semibold text-white"
                />
              </View>

              <PressableScale
                accessibilityRole="button"
                onPress={() => {
                  impactLight();
                  onUseFullAmount();
                }}
                className="self-start rounded-full border border-mint/20 bg-mint/10 px-4 py-2"
                scaleTo={0.96}
              >
                <Text className="text-[13px] font-semibold text-mint">{t("receivePayment.useFullPayment")}</Text>
              </PressableScale>

              <View className="gap-2">
                <Text className="text-[13px] font-medium text-muted">{t("receivePayment.noteOptional")}</Text>
                <TextInput
                  value={note}
                  onChangeText={onNoteChange}
                  placeholder={t("receivePayment.notePlaceholder")}
                  placeholderTextColor="#747F7B"
                  className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-[15px] text-white"
                />
              </View>

              {error ? <Text className="text-[13px] text-danger">{error}</Text> : null}

              <PressableScale
                accessibilityRole="button"
                disabled={!canSubmit || isSubmitting}
                onPress={onSubmit}
                className={`items-center rounded-[18px] px-4 py-4 ${canSubmit ? "bg-mint" : "bg-white/10"}`}
                scaleTo={0.98}
              >
                <View className="h-5 flex-row items-center gap-2">
                  {isSubmitting ? <ActivityIndicator color="#8A9691" size="small" /> : null}
                  <Text className={`text-[15px] font-semibold ${canSubmit ? "text-background" : "text-muted"}`}>
                    {isSubmitting ? t("receivePayment.saving") : t("receivePayment.submitPayment")}
                  </Text>
                </View>
              </PressableScale>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
