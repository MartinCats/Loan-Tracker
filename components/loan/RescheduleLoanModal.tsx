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
import { formatDateOnly } from "@/services/formatters";
import { t } from "@/services/i18n";
import { useSettingsStore } from "@/store/settingsStore";
import { formatLocalDateOnly } from "@/utils/dateOnly";
import { impactLight } from "@/utils/haptics";

type RescheduleLoanModalProps = {
  currentDueDate: string;
  error?: string | null;
  isSubmitting: boolean;
  newDueDate: string;
  note: string;
  visible: boolean;
  onClose: () => void;
  onNewDueDateChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
};

const quickDateOptions = [
  { label: "addLoan.tomorrow", daysToAdd: 1 },
  { label: "rescheduleLoan.plus7Days", daysToAdd: 7 },
  { label: "addLoan.plus10Days", daysToAdd: 10 },
  { label: "addLoan.nextMonth", monthsToAdd: 1 }
];

export function RescheduleLoanModal({
  currentDueDate,
  error,
  isSubmitting,
  newDueDate,
  note,
  visible,
  onClose,
  onNewDueDateChange,
  onNoteChange,
  onSubmit
}: RescheduleLoanModalProps) {
  const language = useSettingsStore((state) => state.language);
  const quickDates = quickDateOptions.map((option) => ({
    ...option,
    value: formatLocalDateOnly(addDateOffset(new Date(), option.daysToAdd ?? 0, option.monthsToAdd ?? 0))
  }));

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
                <Text className="text-[22px] font-semibold text-white">{t("rescheduleLoan.title")}</Text>
                <Text className="text-[13px] leading-5 text-muted">
                  {t("rescheduleLoan.subtitle")}
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

            <View className="rounded-[20px] border border-cyan/15 bg-cyan/5 p-4">
              <Text className="text-[12px] text-muted">{t("rescheduleLoan.currentDueDate")}</Text>
              <Text className="mt-1 text-[20px] font-semibold text-white">
                {formatDateOnly(currentDueDate, language)}
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-[13px] font-medium text-muted">{t("rescheduleLoan.newDueDate")}</Text>
              <TextInput
                value={newDueDate}
                onChangeText={onNewDueDateChange}
                placeholder={t("addLoan.datePlaceholder")}
                placeholderTextColor="#747F7B"
                className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-[16px] font-semibold text-white"
              />
            </View>

            <View className="gap-2">
              <Text className="text-[13px] font-medium text-muted">{t("addLoan.quickDate")}</Text>
              <View className="flex-row flex-wrap gap-2">
                {quickDates.map((option) => {
                  const isSelected = newDueDate === option.value;

                  return (
                    <PressableScale
                      accessibilityRole="button"
                      key={option.label}
                      onPress={() => {
                        impactLight();
                        onNewDueDateChange(option.value);
                      }}
                      className={`rounded-full border px-3 py-2 ${
                        isSelected ? "border-mint bg-mint" : "border-white/10 bg-white/5"
                      }`}
                      scaleTo={0.96}
                    >
                      <Text className={`text-[12px] font-semibold ${isSelected ? "text-background" : "text-muted"}`}>
                        {t(option.label)}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

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

            {error ? <Text className="text-[13px] leading-5 text-danger">{error}</Text> : null}

            <PressableScale
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onSubmit}
              className={`items-center rounded-[18px] px-4 py-4 ${isSubmitting ? "bg-white/10" : "bg-mint"}`}
              scaleTo={0.98}
            >
              <View className="h-5 flex-row items-center gap-2">
                {isSubmitting ? <ActivityIndicator color="#8A9691" size="small" /> : null}
                <Text className={`text-[15px] font-semibold ${isSubmitting ? "text-muted" : "text-background"}`}>
                  {isSubmitting ? t("rescheduleLoan.saving") : t("rescheduleLoan.save")}
                </Text>
              </View>
            </PressableScale>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function addDateOffset(date: Date, daysToAdd: number, monthsToAdd: number) {
  const nextDate = new Date(date);

  if (monthsToAdd) {
    nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
  }

  if (daysToAdd) {
    nextDate.setDate(nextDate.getDate() + daysToAdd);
  }

  return nextDate;
}
