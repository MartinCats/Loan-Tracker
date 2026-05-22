import { Modal, Pressable, Text, View } from "react-native";

import type { CloseLoanSettlementResult } from "@/services/loanCalculator";

type CloseLoanModalProps = {
  visible: boolean;
  settlement: CloseLoanSettlementResult | null;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

export function CloseLoanModal({
  visible,
  settlement,
  isSubmitting,
  error,
  onClose,
  onConfirm
}: CloseLoanModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70 px-4 pb-5">
        <View className="rounded-[28px] border border-border bg-surface p-5 shadow-2xl shadow-black/40">
          <View className="mb-5 flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-1">
              <Text className="text-[22px] font-semibold text-white">Close loan</Text>
              <Text className="text-[13px] leading-5 text-muted">
                Confirm final settlement and move this loan to archive.
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

          {settlement ? (
            <View className="gap-3">
              <SettlementRow label="Principal" value={formatCurrency(settlement.principal)} />
              <SettlementRow label="Current interest" value={formatCurrency(settlement.currentInterest)} />
              <SettlementRow label="Unpaid interest" value={formatCurrency(settlement.unpaidInterest)} />
              <SettlementRow label="Credit applied" value={`-${formatCurrency(settlement.creditApplied)}`} tone="cyan" />
              <View className="mt-2 border-t border-white/10 pt-4">
                <SettlementRow
                  label="Total required to close"
                  value={formatCurrency(settlement.totalRequiredToClose)}
                  tone="mint"
                  large
                />
              </View>
              <Text className="text-[12px] leading-5 text-muted">
                Principal repayment is not counted as profit. Only interest received during close increases profit.
              </Text>
            </View>
          ) : null}

          {error ? <Text className="mt-4 text-[13px] leading-5 text-danger">{error}</Text> : null}

          <View className="mt-5 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="flex-1 items-center rounded-[18px] border border-white/10 bg-white/5 px-4 py-4"
            >
              <Text className="text-[15px] font-semibold text-white">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!settlement || isSubmitting}
              onPress={onConfirm}
              className={`flex-1 items-center rounded-[18px] px-4 py-4 ${
                settlement && !isSubmitting ? "bg-danger" : "bg-white/10"
              }`}
            >
              <Text className={`text-[15px] font-semibold ${settlement && !isSubmitting ? "text-background" : "text-muted"}`}>
                {isSubmitting ? "Closing..." : "Close loan"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type SettlementRowProps = {
  label: string;
  value: string;
  tone?: "default" | "mint" | "cyan";
  large?: boolean;
};

function SettlementRow({ label, value, tone = "default", large = false }: SettlementRowProps) {
  const valueClassName = tone === "mint"
    ? "text-mint"
    : tone === "cyan"
      ? "text-cyan"
      : "text-white";

  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-[13px] text-muted">{label}</Text>
      <Text className={`${large ? "text-[22px]" : "text-[15px]"} font-semibold ${valueClassName}`}>
        {value}
      </Text>
    </View>
  );
}
