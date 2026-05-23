import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

import type { PaymentCycle } from "@/types/loan";
import { formatLocalDateOnly } from "@/utils/dateOnly";

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
  { label: "Monthly", value: "monthly" },
  { label: "Every 10 days", value: "every_10_days" }
];

const quickDateOptions = [
  { label: "Today", daysToAdd: 0 },
  { label: "Tomorrow", daysToAdd: 1 },
  { label: "+10 days", daysToAdd: 10 },
  { label: "Next month", monthsToAdd: 1 }
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
                <Text className="text-[22px] font-semibold text-white">Add loan</Text>
                <Text className="text-[13px] leading-5 text-muted">
                  Create a real local loan record on this device.
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
                label="Borrower name"
                value={borrowerName}
                placeholder="Name"
                onChangeText={onBorrowerNameChange}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <LabeledInput
                    keyboardType="decimal-pad"
                    label="Principal"
                    value={principal}
                    placeholder="0"
                    onChangeText={onPrincipalChange}
                  />
                </View>
                <View className="flex-1">
                  <LabeledInput
                    keyboardType="decimal-pad"
                    label="Interest %"
                    value={interestRate}
                    placeholder="0"
                    onChangeText={onInterestRateChange}
                  />
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-[13px] font-medium text-muted">Payment cycle</Text>
                <View className="flex-row gap-2 rounded-[18px] bg-white/5 p-1">
                  {cycleOptions.map((option) => {
                    const isSelected = paymentCycle === option.value;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={option.value}
                        onPress={() => onPaymentCycleChange(option.value)}
                        className={`flex-1 rounded-[15px] px-3 py-3 ${isSelected ? "bg-mint" : "bg-transparent"}`}
                      >
                        <Text
                          className={`text-center text-[13px] font-semibold ${
                            isSelected ? "text-background" : "text-muted"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <LabeledInput
                label="First due date"
                value={firstDueDate}
                placeholder="YYYY-MM-DD"
                onChangeText={onFirstDueDateChange}
              />

              <View className="gap-2">
                <Text className="text-[13px] font-medium text-muted">Quick date</Text>
                <View className="flex-row flex-wrap gap-2">
                  {quickDates.map((option) => {
                    const isSelected = firstDueDate === option.value;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={option.label}
                        onPress={() => onFirstDueDateChange(option.value)}
                        className={`rounded-full border px-3 py-2 ${
                          isSelected
                            ? "border-mint bg-mint"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-semibold ${
                            isSelected ? "text-background" : "text-muted"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {error ? <Text className="text-[13px] leading-5 text-danger">{error}</Text> : null}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={onSubmit}
                className={`items-center rounded-[18px] px-4 py-4 ${isSubmitting ? "bg-white/10" : "bg-mint"}`}
              >
                <Text className={`text-[15px] font-semibold ${isSubmitting ? "text-muted" : "text-background"}`}>
                  {isSubmitting ? "Creating..." : "Create loan"}
                </Text>
              </Pressable>
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
