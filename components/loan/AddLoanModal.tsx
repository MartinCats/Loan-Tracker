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
import type { PaymentCycle } from "@/types/loan";
import { formatLocalDateOnly } from "@/utils/dateOnly";
import { impactLight } from "@/utils/haptics";

type AddLoanModalProps = {
  visible: boolean;
  borrowerName: string;
  principal: string;
  interestRate: string;
  paymentCycle: PaymentCycle;
  firstDueDate: string;
  error?: string | null;
  isSubmitting: boolean;
  onBorrowerNameChange: (value: string) => void;
  onPrincipalChange: (value: string) => void;
  onInterestRateChange: (value: string) => void;
  onPaymentCycleChange: (value: PaymentCycle) => void;
  onFirstDueDateChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const cycleOptions: Array<{ label: string; value: PaymentCycle }> = [
  { label: "cycle.monthly", value: "monthly" },
  { label: "cycle.every10Days", value: "every_10_days" }
];

const quickDateOptions = [
  { label: "common.today", daysToAdd: 0 },
  { label: "addLoan.tomorrow", daysToAdd: 1 },
  { label: "addLoan.plus10Days", daysToAdd: 10 },
  { label: "addLoan.nextMonth", monthsToAdd: 1 }
];

export function AddLoanModal({
  visible,
  borrowerName,
  principal,
  interestRate,
  paymentCycle,
  firstDueDate,
  error,
  isSubmitting,
  onBorrowerNameChange,
  onPrincipalChange,
  onInterestRateChange,
  onPaymentCycleChange,
  onFirstDueDateChange,
  onClose,
  onSubmit
}: AddLoanModalProps) {
  const quickDates = quickDateOptions.map((option) => ({
    ...option,
    value: formatIsoDate(addDateOffset(new Date(), option.daysToAdd ?? 0, option.monthsToAdd ?? 0))
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
                <Text className="text-[22px] font-semibold text-white">{t("addLoan.title")}</Text>
                <Text className="text-[13px] leading-5 text-muted">
                  {t("addLoan.subtitle")}
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
              <LabeledInput
                label={t("addLoan.borrowerName")}
                value={borrowerName}
                placeholder={t("addLoan.namePlaceholder")}
                onChangeText={onBorrowerNameChange}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <LabeledInput
                    keyboardType="decimal-pad"
                    label={t("common.principal")}
                    value={principal}
                    placeholder="0"
                    onChangeText={onPrincipalChange}
                  />
                </View>
                <View className="flex-1">
                  <LabeledInput
                    keyboardType="decimal-pad"
                    label={t("addLoan.interest")}
                    value={interestRate}
                    placeholder="0"
                    onChangeText={onInterestRateChange}
                  />
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-[13px] font-medium text-muted">{t("addLoan.paymentCycle")}</Text>
                <View className="flex-row gap-2 rounded-[18px] bg-white/5 p-1">
                  {cycleOptions.map((option) => {
                    const isSelected = paymentCycle === option.value;

                    return (
                      <PressableScale
                        accessibilityRole="button"
                        key={option.value}
                        onPress={() => {
                          impactLight();
                          onPaymentCycleChange(option.value);
                        }}
                        className={`flex-1 rounded-[15px] px-3 py-3 ${isSelected ? "bg-mint" : "bg-transparent"}`}
                        scaleTo={0.97}
                      >
                        <Text
                          className={`text-center text-[13px] font-semibold ${
                            isSelected ? "text-background" : "text-muted"
                          }`}
                        >
                          {t(option.label)}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>

              <LabeledInput
                label={t("addLoan.firstDueDate")}
                value={firstDueDate}
                placeholder={t("addLoan.datePlaceholder")}
                onChangeText={onFirstDueDateChange}
              />

              <View className="gap-2">
                <Text className="text-[13px] font-medium text-muted">{t("addLoan.quickDate")}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {quickDates.map((option) => {
                    const isSelected = firstDueDate === option.value;

                    return (
                      <PressableScale
                        accessibilityRole="button"
                        key={option.label}
                        onPress={() => {
                          impactLight();
                          onFirstDueDateChange(option.value);
                        }}
                        className={`rounded-full border px-3 py-2 ${
                          isSelected
                            ? "border-mint bg-mint"
                            : "border-white/10 bg-white/5"
                        }`}
                        scaleTo={0.96}
                      >
                        <Text
                          className={`text-[12px] font-semibold ${
                            isSelected ? "text-background" : "text-muted"
                          }`}
                        >
                          {t(option.label)}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
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
                    {isSubmitting ? t("addLoan.creating") : t("addLoan.createLoan")}
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

function formatIsoDate(date: Date) {
  return formatLocalDateOnly(date);
}

type LabeledInputProps = {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
  onChangeText: (value: string) => void;
};

function LabeledInput({
  label,
  value,
  placeholder,
  keyboardType = "default",
  onChangeText
}: LabeledInputProps) {
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-medium text-muted">{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#747F7B"
        className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-[16px] font-semibold text-white"
      />
    </View>
  );
}
