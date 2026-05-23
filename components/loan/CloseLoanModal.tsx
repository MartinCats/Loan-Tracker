import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { PressableScale } from "@/components/ui/PressableScale";
import { formatCurrency } from "@/services/formatters";
import { t } from "@/services/i18n";
import type { CloseLoanSettlementResult } from "@/services/loanCalculator";
import { useSettingsStore } from "@/store/settingsStore";

type CloseLoanModalProps = {
  visible: boolean;
  settlement: CloseLoanSettlementResult | null;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function CloseLoanModal({
  visible,
  settlement,
  isSubmitting,
  error,
  onClose,
  onConfirm
}: CloseLoanModalProps) {
  const language = useSettingsStore((state) => state.language);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70 px-4 pb-5">
        <View className="rounded-[28px] border border-border bg-surface p-5 shadow-2xl shadow-black/40">
          <View className="mb-5 flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-1">
              <Text className="text-[22px] font-semibold text-white">{t("closeLoan.title")}</Text>
              <Text className="text-[13px] leading-5 text-muted">
                {t("closeLoan.subtitle")}
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
              <SettlementRow label={t("common.principal")} value={formatCurrency(settlement.principal, language)} />
              <SettlementRow label={t("closeLoan.currentInterest")} value={formatCurrency(settlement.currentInterest, language)} />
              <SettlementRow label={t("loanDetail.unpaidInterest")} value={formatCurrency(settlement.unpaidInterest, language)} />
              <SettlementRow label={t("closeLoan.creditApplied")} value={`-${formatCurrency(settlement.creditApplied, language)}`} tone="cyan" />
              <View className="mt-2 border-t border-white/10 pt-4">
                <SettlementRow
                  label={t("closeLoan.totalRequired")}
                  value={formatCurrency(settlement.totalRequiredToClose, language)}
                  tone="mint"
                  large
                />
              </View>
              <Text className="text-[12px] leading-5 text-muted">
                {t("closeLoan.profitNote")}
              </Text>
            </View>
          ) : null}

          {error ? <Text className="mt-4 text-[13px] leading-5 text-danger">{error}</Text> : null}

          <View className="mt-5 flex-row gap-3">
            <PressableScale
              accessibilityRole="button"
              onPress={onClose}
              className="flex-1 items-center rounded-[18px] border border-white/10 bg-white/5 px-4 py-4"
              scaleTo={0.97}
            >
              <Text className="text-[15px] font-semibold text-white">{t("common.cancel")}</Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              disabled={!settlement || isSubmitting}
              onPress={onConfirm}
              className={`flex-1 items-center rounded-[18px] px-4 py-4 ${
                settlement && !isSubmitting ? "bg-danger" : "bg-white/10"
              }`}
              scaleTo={0.97}
            >
              <View className="h-5 flex-row items-center gap-2">
                {isSubmitting ? <ActivityIndicator color="#8A9691" size="small" /> : null}
                <Text className={`text-[15px] font-semibold ${settlement && !isSubmitting ? "text-background" : "text-muted"}`}>
                  {isSubmitting ? t("closeLoan.closing") : t("loanDetail.closeLoan")}
                </Text>
              </View>
            </PressableScale>
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
