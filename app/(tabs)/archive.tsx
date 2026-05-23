import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DeleteLoanModal } from "@/components/loan/DeleteLoanModal";
import { PressableScale } from "@/components/ui/PressableScale";
import { formatCurrency, formatTimestamp } from "@/services/formatters";
import { t } from "@/services/i18n";
import { useLoanStore } from "@/store/loanStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { Loan } from "@/types/loan";
import { impactLight, impactMedium, notifyError, notifySuccess } from "@/utils/haptics";
import { getReadableErrorMessage, getReadableErrorText } from "@/utils/readableError";
import { getTabScreenInsets } from "@/utils/screenSpacing";
import { registerTabScrollHandler } from "@/utils/tabScrollRegistry";


export default function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    archivedLoans,
    deleteArchivedLoan,
    error,
    isLoading,
    loadArchivedLoans
  } = useLoanStore();
  const language = useSettingsStore((state) => state.language);
  const [deleteTargetLoan, setDeleteTargetLoan] = useState<Loan | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingLoan, setIsDeletingLoan] = useState(false);

  useEffect(() => {
    loadArchivedLoans().catch(() => {
      // Store error is displayed in the archive empty state.
    });
  }, [loadArchivedLoans]);

  useEffect(() => {
    return registerTabScrollHandler("archive", () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  function openDeleteLoan(loan: Loan) {
    impactMedium();
    setDeleteError(null);
    setDeleteTargetLoan(loan);
  }

  function closeDeleteLoan() {
    if (isDeletingLoan) {
      return;
    }

    setDeleteTargetLoan(null);
    setDeleteError(null);
  }

  async function confirmDeleteLoan() {
    if (isDeletingLoan || !deleteTargetLoan) {
      return;
    }

    try {
      setIsDeletingLoan(true);
      setDeleteError(null);
      await deleteArchivedLoan(deleteTargetLoan.id);
      await loadArchivedLoans();
      notifySuccess();
      setDeleteTargetLoan(null);
    } catch (deleteSubmitError) {
      notifyError();
      setDeleteError(getReadableErrorMessage(deleteSubmitError, t("errors.archivedDelete")));
    } finally {
      setIsDeletingLoan(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="absolute left-0 right-0 top-0 h-72 bg-auraPurple opacity-25" />
      <View className="absolute left-0 right-0 bottom-0 h-72 bg-auraBlue opacity-10" />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="gap-6 px-5"
        contentContainerStyle={{
          ...getTabScreenInsets(insets)
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(360)}>
          <View className="gap-3">
            <View className="self-start rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-cyan">
                {t("common.archive")}
              </Text>
            </View>
            <View className="gap-1.5">
              <Text className="text-[40px] font-semibold leading-[46px] text-white">{t("archive.title")}</Text>
              <Text className="text-[15px] leading-6 text-muted">
                {archivedLoans.length > 0
                  ? t("archive.subtitleActive", {
                    count: archivedLoans.length,
                    plural: archivedLoans.length === 1 ? "" : "s"
                  })
                  : t("archive.subtitleEmpty")}
              </Text>
            </View>
          </View>
        </Animated.View>

        {archivedLoans.length > 0 ? (
          <View className="gap-3">
            {archivedLoans.map((loan, index) => (
              <Animated.View
                key={loan.id}
                entering={FadeInUp.delay(90 + index * 45).duration(340)}
              >
                <PressableScale
                  accessibilityRole="button"
                  delayLongPress={360}
                  onLongPress={() => openDeleteLoan(loan)}
                  onPress={() => {
                    impactLight();
                    router.push(`/loan/${encodeURIComponent(loan.id)}`);
                  }}
                  scaleTo={0.985}
                >
                  <ArchivedLoanCard loan={loan} language={language} />
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeInUp.delay(90).duration(360)}>
            <View className="items-center justify-center rounded-[28px] border border-cyan/20 bg-surface/90 p-8 shadow-lg shadow-cyan/5">
              <Text className="text-[22px] font-semibold text-white">{t("archive.noClosedTitle")}</Text>
              <Text className="mt-2 text-center text-[14px] leading-6 text-muted">
                {t("archive.noClosedBody")}
              </Text>
              {error && !isLoading ? (
                <Text className="mt-4 text-center text-[13px] text-danger">
                  {getReadableErrorText(error, t("archive.errorLoad"))}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <DeleteLoanModal
        borrowerName={deleteTargetLoan?.borrowerName}
        error={deleteError}
        isSubmitting={isDeletingLoan}
        message={t("archive.deleteMessage")}
        title={t("archive.deleteTitle")}
        visible={deleteTargetLoan !== null}
        onClose={closeDeleteLoan}
        onConfirm={confirmDeleteLoan}
      />
    </View>
  );
}


function ArchivedLoanCard({ loan, language }: { loan: Loan; language: "en" | "th" }) {
  return (
    <View className="overflow-hidden rounded-[24px] border border-white/10 bg-surface/90 p-5 shadow-lg shadow-black/20">
      <View className="absolute left-0 right-0 top-0 h-10 bg-cyan opacity-5" />
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-[18px] font-semibold leading-6 text-white">{loan.borrowerName}</Text>
          <Text className="text-[13px] text-mutedSoft">
            {t("archive.closedPrefix")} {formatTimestamp(loan.closedAt, language) || t("common.noDate")}
          </Text>
        </View>
        <View className="rounded-full border border-cyan/15 bg-cyan/10 px-3 py-1">
          <Text className="text-[12px] font-semibold text-cyan">{t("common.closed")}</Text>
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <ArchiveMetric label={t("common.principal")} value={formatCurrency(loan.principal, language)} />
        <ArchiveMetric label={t("common.profit")} value={formatCurrency(loan.accumulatedProfit, language)} />
      </View>
    </View>
  );
}

function ArchiveMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-[18px] border border-white/10 bg-white/5 p-3">
      <Text className="text-[12px] text-muted">{label}</Text>
      <Text className="mt-1 text-[16px] font-semibold text-white">{value}</Text>
    </View>
  );
}
