import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CloseLoanModal } from "@/components/loan/CloseLoanModal";
import { DeleteLoanModal } from "@/components/loan/DeleteLoanModal";
import { LoanHeroCard } from "@/components/loan/LoanHeroCard";
import { LoanOverviewCard } from "@/components/loan/LoanOverviewCard";
import { QuickActionButton } from "@/components/loan/QuickActionButton";
import { ReceivePaymentModal } from "@/components/loan/ReceivePaymentModal";
import { RescheduleLoanModal } from "@/components/loan/RescheduleLoanModal";
import { TimelineEventItem } from "@/components/loan/TimelineEventItem";
import { PressableScale } from "@/components/ui/PressableScale";
import { formatCurrency, formatDateOnly, formatShortDate, formatTimestamp } from "@/services/formatters";
import { t } from "@/services/i18n";
import type { CloseLoanSettlementResult } from "@/services/loanCalculator";
import { useLoanStore } from "@/store/loanStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { PaymentCycle } from "@/types/loan";
import type { PaymentHistory, PaymentHistoryType } from "@/types/payment";
import { isValidDateOnly } from "@/utils/dateOnly";
import { impactMedium, notifyError, notifySuccess } from "@/utils/haptics";
import { getReadableErrorMessage, getReadableErrorText } from "@/utils/readableError";
import { getDetailScreenInsets } from "@/utils/screenSpacing";

const mockLoanDetail = {
  borrowerName: "Mali",
  amountDue: 4600,
  statusText: "3 days overdue",
  nextDueDate: "May 18, 2026",
  urgency: "overdue" as const,
  principal: 92000,
  interestRate: "5%",
  unpaidInterest: 1600,
  creditBalance: 0,
  accumulatedProfit: 18400
};

function getMockTimeline() {
  return [
  {
    id: "mock-payment-april",
    title: t("timeline.receivedInterest"),
    subtitle: t("timeline.receivedSubtitle"),
    amount: "THB 4,600",
    date: "Apr 18",
    tone: "mint" as const,
    icon: "checkmark-circle-outline" as const
  },
  {
    id: "mock-overdue-may",
    title: t("countdown.daysOverdue"),
    subtitle: t("loanDetail.paymentDue"),
    date: "May 18",
    tone: "danger" as const,
    icon: "alert-circle-outline" as const
  },
  {
    id: "mock-rescheduled-march",
    title: t("loanDetail.reschedule"),
    subtitle: t("loanDetail.nextDue"),
    date: "Mar 28",
    tone: "cyan" as const,
    icon: "calendar-outline" as const
  },
  {
    id: "mock-partial-march",
    title: t("timeline.partialPayment"),
    subtitle: t("timeline.partialSubtitle"),
    amount: "THB 2,000",
    date: "Mar 10",
    tone: "gold" as const,
    icon: "remove-circle-outline" as const
  }
  ];
}

function formatPaymentCycle(paymentCycle: PaymentCycle) {
  return paymentCycle === "monthly" ? t("cycle.monthly") : t("cycle.every10Days");
}

function formatPaymentDate(date: string | null, language: "en" | "th") {
  if (!date) {
    return t("common.noDate");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return formatShortDate(date, language);
  }

  return formatShortDate(date, language);
}

function formatFullDate(date: string | null | undefined, language: "en" | "th") {
  if (!date) {
    return t("common.noDate");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return formatDateOnly(date, language);
  }

  return formatTimestamp(date, language) || t("common.noDate");
}

function getTimelineMeta(type: PaymentHistoryType) {
  if (type === "partial_payment") {
    return {
      title: t("timeline.partialPayment"),
      subtitle: t("timeline.partialSubtitle"),
      tone: "gold" as const,
      icon: "remove-circle-outline" as const
    };
  }

  if (type === "overpayment") {
    return {
      title: t("timeline.overpayment"),
      subtitle: t("timeline.overpaymentSubtitle"),
      tone: "cyan" as const,
      icon: "add-circle-outline" as const
    };
  }

  if (type === "loan_close") {
    return {
      title: t("timeline.loanClosed"),
      subtitle: t("timeline.loanClosedSubtitle"),
      tone: "danger" as const,
      icon: "lock-closed-outline" as const
    };
  }

  if (type === "reschedule") {
    return {
      title: t("timeline.rescheduled"),
      subtitle: t("timeline.rescheduledSubtitle"),
      tone: "cyan" as const,
      icon: "calendar-outline" as const
    };
  }

  return {
    title: t("timeline.receivedInterest"),
    subtitle: t("timeline.receivedSubtitle"),
    tone: "mint" as const,
    icon: "checkmark-circle-outline" as const
  };
}

export default function LoanDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((state) => state.language);
  const { id } = useLocalSearchParams<{ id: string }>();
  const loanId = id ?? "";
  const {
    selectedLoan,
    selectedPaymentHistories,
    selectedPaymentQuote,
    error,
    clearError,
    getCloseLoanSettlement,
    getPaymentQuote,
    loadLoanDetail,
    closeLoanWithSettlement,
    deleteArchivedLoan,
    deleteLoan,
    receivePayment,
    rescheduleLoan
  } = useLoanStore();
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [rescheduleDueDate, setRescheduleDueDate] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [closeSettlement, setCloseSettlement] = useState<CloseLoanSettlementResult | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [isClosingLoan, setIsClosingLoan] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingLoan, setIsDeletingLoan] = useState(false);
  const [isLoadingLoanDetail, setIsLoadingLoanDetail] = useState(false);

  useEffect(() => {
    if (loanId) {
      setIsLoadingLoanDetail(true);
      loadLoanDetail(loanId)
        .catch(() => {
          // Store error state handles display; mock fallback remains visible for the preview route only.
        })
        .finally(() => setIsLoadingLoanDetail(false));
    }
  }, [loadLoanDetail, loanId]);

  const matchedSelectedLoan = selectedLoan?.id === loanId ? selectedLoan : null;
  const isArchivedLoan = matchedSelectedLoan?.status === "closed" || matchedSelectedLoan?.status === "archived";
  const activeMatchedLoan = matchedSelectedLoan?.status === "active" ? matchedSelectedLoan : null;
  const archivedMatchedLoan = isArchivedLoan ? matchedSelectedLoan : null;
  const shouldUseMockPreview = !matchedSelectedLoan && loanId === "test-loan";
  const displayLoan = matchedSelectedLoan
    ? {
      borrowerName: matchedSelectedLoan.borrowerName,
      amountDue: isArchivedLoan ? matchedSelectedLoan.principal : selectedPaymentQuote?.amountDue ?? 0,
      amountLabel: isArchivedLoan ? t("loanDetail.principalClosed") : t("loanDetail.currentlyDue"),
      statusText: isArchivedLoan
        ? t("common.closed")
        : selectedPaymentQuote?.amountDue === 0 ? t("loanDetail.coveredByCredit") : t("loanDetail.paymentDue"),
      nextDueDate: isArchivedLoan
        ? formatFullDate(matchedSelectedLoan.closedAt, language)
        : formatDateOnly(matchedSelectedLoan.currentDueDate, language),
      nextDueLabel: isArchivedLoan ? t("loanDetail.closedDate") : t("loanDetail.nextDue"),
      paymentCycle: formatPaymentCycle(matchedSelectedLoan.paymentCycle),
      urgency: isArchivedLoan || selectedPaymentQuote?.amountDue === 0 ? "healthy" as const : "soon" as const,
      principal: matchedSelectedLoan.principal,
      interestRate: `${matchedSelectedLoan.interestRate}%`,
      unpaidInterest: matchedSelectedLoan.unpaidInterest,
      creditBalance: matchedSelectedLoan.creditBalance,
      accumulatedProfit: matchedSelectedLoan.accumulatedProfit
    }
    : shouldUseMockPreview
      ? {
        ...mockLoanDetail,
        amountLabel: t("loanDetail.currentlyDue"),
        nextDueLabel: t("loanDetail.nextDue"),
        paymentCycle: t("cycle.monthly")
      }
      : null;

  const timelineEvents = useMemo(() => {
    if (!matchedSelectedLoan) {
      return shouldUseMockPreview ? getMockTimeline() : [];
    }

    if (selectedPaymentHistories.length === 0) {
      return [];
    }

    return selectedPaymentHistories.map((history) => {
      const meta = getTimelineMeta(history.type);

      return {
        id: history.id,
        ...meta,
        amount: history.paidAmount > 0 ? formatCurrency(history.paidAmount, language) : undefined,
        note: history.note,
        date: formatPaymentDate(history.paymentDate ?? history.createdAt, language)
      };
    });
  }, [language, matchedSelectedLoan, selectedPaymentHistories, shouldUseMockPreview]);

  const amountDueText = formatCurrency(displayLoan?.amountDue ?? 0, language);
  function openPaymentModal() {
    if (!activeMatchedLoan) {
      notifyError();
      setPaymentError(t("errors.loadActivePayment"));
      return;
    }

    clearError();
    setPaymentError(null);
    setPaymentAmount("");
    setPaymentNote("");
    setIsPaymentModalVisible(true);
  }

  function closePaymentModal() {
    if (isSubmittingPayment) {
      return;
    }

    setIsPaymentModalVisible(false);
  }

  function openRescheduleModal() {
    if (!activeMatchedLoan) {
      notifyError();
      setRescheduleError(t("errors.loadActiveReschedule"));
      return;
    }

    setRescheduleError(null);
    setRescheduleDueDate(activeMatchedLoan.currentDueDate);
    setRescheduleNote("");
    setIsRescheduleModalVisible(true);
  }

  function closeRescheduleModal() {
    if (isSubmittingReschedule) {
      return;
    }

    setIsRescheduleModalVisible(false);
  }

  async function submitReschedule() {
    if (isSubmittingReschedule) {
      return;
    }

    const normalizedDueDate = rescheduleDueDate.trim();

    if (!activeMatchedLoan) {
      notifyError();
      setRescheduleError(t("errors.loadActiveReschedule"));
      return;
    }

    if (!isValidDateOnly(normalizedDueDate)) {
      notifyError();
      setRescheduleError(t("errors.rescheduleDate"));
      return;
    }

    try {
      setIsSubmittingReschedule(true);
      setRescheduleError(null);
      await rescheduleLoan({
        loanId: activeMatchedLoan.id,
        newDueDate: normalizedDueDate,
        note: rescheduleNote
      });
      await loadLoanDetail(activeMatchedLoan.id);
      setIsRescheduleModalVisible(false);
      setRescheduleDueDate("");
      setRescheduleNote("");
      notifySuccess();
    } catch (submitError) {
      notifyError();
      setRescheduleError(getReadableErrorMessage(submitError, t("errors.rescheduleSubmit")));
    } finally {
      setIsSubmittingReschedule(false);
    }
  }

  async function useFullPaymentAmount() {
    if (isSubmittingPayment) {
      return;
    }

    if (!activeMatchedLoan) {
      notifyError();
      setPaymentError(t("errors.loadActivePayment"));
      return;
    }

    try {
      const quote = await getPaymentQuote(activeMatchedLoan.id);
      setPaymentAmount(String(quote.amountDue));
    } catch (quoteError) {
      notifyError();
      setPaymentError(getReadableErrorMessage(quoteError, t("errors.paymentQuote")));
    }
  }

  async function submitPayment() {
    if (isSubmittingPayment) {
      return;
    }

    const parsedAmount = Number(paymentAmount);

    if (!activeMatchedLoan) {
      notifyError();
      setPaymentError(t("errors.loadActivePayment"));
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      notifyError();
      setPaymentError(t("errors.paymentPositive"));
      return;
    }

    try {
      setPaymentError(null);
      setIsSubmittingPayment(true);
      await receivePayment({
        loanId: activeMatchedLoan.id,
        paidAmount: parsedAmount,
        note: paymentNote
      });
      await loadLoanDetail(activeMatchedLoan.id);
      setIsPaymentModalVisible(false);
      setPaymentAmount("");
      setPaymentNote("");
      notifySuccess();
    } catch (paymentSubmitError) {
      notifyError();
      setPaymentError(getReadableErrorMessage(paymentSubmitError, t("errors.paymentSave")));
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  async function openCloseModal() {
    if (isClosingLoan) {
      return;
    }

    if (!activeMatchedLoan) {
      notifyError();
      setCloseError(t("errors.loadActiveClose"));
      return;
    }

    try {
      setCloseError(null);
      setCloseSettlement(null);
      const settlement = await getCloseLoanSettlement(activeMatchedLoan.id);
      setCloseSettlement(settlement);
      setIsCloseModalVisible(true);
    } catch (closeQuoteError) {
      notifyError();
      setCloseError(getReadableErrorMessage(closeQuoteError, t("errors.closeQuote")));
    }
  }

  async function confirmCloseLoan() {
    if (isClosingLoan) {
      return;
    }

    if (!activeMatchedLoan) {
      notifyError();
      setCloseError(t("errors.loadActiveClose"));
      return;
    }

    try {
      setCloseError(null);
      setIsClosingLoan(true);
      await closeLoanWithSettlement(activeMatchedLoan.id);
      await loadLoanDetail(activeMatchedLoan.id);
      setIsCloseModalVisible(false);
      setCloseSettlement(null);
      notifySuccess();
    } catch (closeSubmitError) {
      notifyError();
      setCloseError(getReadableErrorMessage(closeSubmitError, t("errors.closeSubmit")));
    } finally {
      setIsClosingLoan(false);
    }
  }

  function closeCloseModal() {
    if (isClosingLoan) {
      return;
    }

    setIsCloseModalVisible(false);
    setCloseSettlement(null);
  }

  function openDeleteModal() {
    if (!activeMatchedLoan && !archivedMatchedLoan) {
      notifyError();
      setDeleteError(t("errors.activeDeleteOnly"));
      return;
    }

    impactMedium();
    setDeleteError(null);
    setIsDeleteModalVisible(true);
  }

  function closeDeleteModal() {
    if (isDeletingLoan) {
      return;
    }

    setIsDeleteModalVisible(false);
    setDeleteError(null);
  }

  async function confirmDeleteLoan() {
    if (isDeletingLoan) {
      return;
    }

    if (!activeMatchedLoan && !archivedMatchedLoan) {
      notifyError();
      setDeleteError(t("errors.loadLoanDelete"));
      return;
    }

    try {
      setDeleteError(null);
      setIsDeletingLoan(true);
      if (archivedMatchedLoan) {
        await deleteArchivedLoan(archivedMatchedLoan.id);
        setIsDeleteModalVisible(false);
        notifySuccess();
        router.replace("/archive");
        return;
      }

      if (!activeMatchedLoan) {
        notifyError();
        setDeleteError(t("errors.loadActiveDelete"));
        return;
      }

      await deleteLoan(activeMatchedLoan.id);
      setIsDeleteModalVisible(false);
      notifySuccess();
      router.replace("/");
    } catch (deleteSubmitError) {
      notifyError();
      setDeleteError(getReadableErrorMessage(deleteSubmitError, t("errors.loanDelete")));
    } finally {
      setIsDeletingLoan(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="absolute left-0 right-0 top-0 h-72 bg-auraPurple opacity-25" />
      <View className="absolute left-0 right-0 top-72 h-80 bg-auraMint opacity-10" />
      <View className="absolute left-0 right-0 bottom-0 h-72 bg-auraBlue opacity-10" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-7 px-5"
        contentContainerStyle={{
          ...getDetailScreenInsets(insets)
        }}
        showsVerticalScrollIndicator={false}
      >
        {!displayLoan ? (
          <View className="rounded-[28px] border border-border bg-surface/90 p-6">
            <Text className="text-[24px] font-semibold text-white">
              {isLoadingLoanDetail ? t("loanDetail.loadingLoan") : t("loanDetail.loanNotFound")}
            </Text>
            <Text className="mt-2 text-[14px] leading-6 text-muted">
              {isLoadingLoanDetail
                ? t("loanDetail.loadingBody")
                : t("loanDetail.notFoundBody")}
            </Text>
            {error ? (
              <Text className="mt-4 text-[13px] text-danger">
                {getReadableErrorText(error, t("loanDetail.errorLoad"))}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
        <Animated.View entering={FadeInUp.duration(360)}>
          <View className="gap-1">
            <Text className="text-[12px] font-semibold uppercase tracking-[1.4px] text-mint">
              {t("loanDetail.title")}
            </Text>
            <Text className="text-[13px] text-muted">
              {shouldUseMockPreview ? t("loanDetail.previewLoan") : t("loanDetail.localRecord")}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(380)}>
          <LoanHeroCard
            borrowerName={displayLoan.borrowerName}
            amountDue={amountDueText}
            amountLabel={displayLoan.amountLabel}
            statusText={displayLoan.statusText}
            nextDueDate={displayLoan.nextDueDate}
            nextDueLabel={displayLoan.nextDueLabel}
            paymentCycle={displayLoan.paymentCycle}
            urgency={displayLoan.urgency}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(110).duration(380)}>
          <LoanOverviewCard
            title={t("loanDetail.overview")}
            rows={[
              { label: t("common.principal"), value: formatCurrency(displayLoan.principal, language) },
              { label: t("loanDetail.interestRate"), value: displayLoan.interestRate, tone: "gold" },
              { label: t("loanDetail.paymentCycle"), value: displayLoan.paymentCycle },
              {
                label: t("loanDetail.unpaidInterest"),
                value: formatCurrency(displayLoan.unpaidInterest, language),
                tone: "danger"
              },
              {
                label: t("loanDetail.creditBalance"),
                value: formatCurrency(displayLoan.creditBalance, language),
                tone: "cyan"
              },
              {
                label: t("loanDetail.accumulatedProfit"),
                value: formatCurrency(displayLoan.accumulatedProfit, language),
                tone: "mint"
              },
              ...(isArchivedLoan
                ? [{ label: t("loanDetail.closedDate"), value: formatFullDate(matchedSelectedLoan?.closedAt, language), tone: "cyan" as const }]
                : [])
            ]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(380)} className="gap-4">
          <View className="flex-row items-end justify-between">
            <View className="gap-1">
              <Text className="text-[24px] font-semibold text-white">{t("loanDetail.timeline")}</Text>
              <Text className="text-[13px] text-muted">
                {matchedSelectedLoan ? t("loanDetail.recentActivity") : t("loanDetail.sampleActivity")}
              </Text>
            </View>
            {shouldUseMockPreview ? (
              <Text className="text-[13px] font-semibold text-mutedSoft">{t("loanDetail.preview")}</Text>
            ) : null}
          </View>

          <View className="gap-3">
            {timelineEvents.length > 0 ? (
              timelineEvents.map((event, index) => (
                <Animated.View
                  key={event.id}
                  entering={FadeInUp.delay(200 + index * 45).duration(340)}
                >
                  <TimelineEventItem {...event} />
                </Animated.View>
              ))
            ) : (
              <View className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <Text className="text-[15px] font-semibold text-white">{t("loanDetail.noHistoryTitle")}</Text>
                <Text className="mt-1 text-[13px] leading-5 text-muted">
                  {t("loanDetail.noHistoryBody")}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {!isArchivedLoan ? (
        <Animated.View entering={FadeInUp.delay(300).duration(360)} className="gap-4">
          <View className="gap-1">
            <Text className="text-[24px] font-semibold text-white">{t("loanDetail.quickActions")}</Text>
            <Text className="text-[13px] text-muted">
              {activeMatchedLoan ? t("loanDetail.paymentActions") : t("loanDetail.loadActiveToSave")}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <QuickActionButton
              label={t("loanDetail.receiveInterest")}
              icon="cash-outline"
              tone="primary"
              disabled={!activeMatchedLoan}
              onPress={openPaymentModal}
            />
            <QuickActionButton
              disabled={!activeMatchedLoan}
              label={t("loanDetail.reschedule")}
              icon="calendar-outline"
              tone="neutral"
              onPress={openRescheduleModal}
            />
            <QuickActionButton
              disabled={!activeMatchedLoan}
              label={t("loanDetail.closeLoan")}
              icon="lock-closed-outline"
              tone="danger"
              onPress={openCloseModal}
            />
          </View>
          {activeMatchedLoan ? (
            <PressableScale
              accessibilityRole="button"
              onPress={openDeleteModal}
              className="self-start rounded-full border border-danger/20 bg-danger/10 px-4 py-2.5 active:opacity-80"
              scaleTo={0.97}
            >
              <Text className="text-[13px] font-semibold text-danger">{t("loanDetail.deleteMistakenLoan")}</Text>
            </PressableScale>
          ) : null}
          {closeError ? <Text className="text-[13px] text-danger">{closeError}</Text> : null}
          {error ? (
            <Text className="text-[13px] text-danger">
              {getReadableErrorText(error, t("loanDetail.errorAction"))}
            </Text>
          ) : null}
        </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(300).duration(360)}>
            <View className="rounded-[24px] border border-cyan/15 bg-cyan/10 p-5">
              <Text className="text-[18px] font-semibold text-white">{t("loanDetail.closedLoanTitle")}</Text>
              <Text className="mt-2 text-[13px] leading-5 text-muted">
                {t("loanDetail.closedLoanBody")}
              </Text>
              {archivedMatchedLoan ? (
                <PressableScale
                  accessibilityRole="button"
                  onPress={openDeleteModal}
                  className="mt-4 self-start rounded-full border border-danger/20 bg-danger/10 px-4 py-2.5 active:opacity-80"
                  scaleTo={0.97}
                >
                  <Text className="text-[13px] font-semibold text-danger">{t("archive.deleteAction")}</Text>
                </PressableScale>
              ) : null}
            </View>
          </Animated.View>
        )}
          </>
        )}
      </ScrollView>

      {displayLoan && activeMatchedLoan ? (
        <ReceivePaymentModal
          amount={paymentAmount}
          amountDue={amountDueText}
          canSubmit={Number(paymentAmount) > 0}
          error={paymentError}
          isSubmitting={isSubmittingPayment}
          note={paymentNote}
          visible={isPaymentModalVisible}
          onAmountChange={setPaymentAmount}
          onClose={closePaymentModal}
          onNoteChange={setPaymentNote}
          onSubmit={submitPayment}
          onUseFullAmount={useFullPaymentAmount}
        />
      ) : null}
      {displayLoan && activeMatchedLoan ? (
        <RescheduleLoanModal
          currentDueDate={activeMatchedLoan.currentDueDate}
          error={rescheduleError}
          isSubmitting={isSubmittingReschedule}
          newDueDate={rescheduleDueDate}
          note={rescheduleNote}
          visible={isRescheduleModalVisible}
          onClose={closeRescheduleModal}
          onNewDueDateChange={setRescheduleDueDate}
          onNoteChange={setRescheduleNote}
          onSubmit={submitReschedule}
        />
      ) : null}

      <CloseLoanModal
        error={closeError}
        isSubmitting={isClosingLoan}
        settlement={closeSettlement}
        visible={isCloseModalVisible}
        onClose={closeCloseModal}
        onConfirm={confirmCloseLoan}
      />
      <DeleteLoanModal
        borrowerName={matchedSelectedLoan?.borrowerName}
        error={deleteError}
        isSubmitting={isDeletingLoan}
        message={
          archivedMatchedLoan
            ? t("archive.deleteMessage")
            : undefined
        }
        title={archivedMatchedLoan ? t("archive.deleteTitle") : undefined}
        visible={isDeleteModalVisible}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteLoan}
      />
    </View>
  );
}
