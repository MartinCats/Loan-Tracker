import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CloseLoanModal } from "@/components/loan/CloseLoanModal";
import { DeleteLoanModal } from "@/components/loan/DeleteLoanModal";
import { LoanHeroCard } from "@/components/loan/LoanHeroCard";
import { LoanOverviewCard } from "@/components/loan/LoanOverviewCard";
import { QuickActionButton } from "@/components/loan/QuickActionButton";
import { ReceivePaymentModal } from "@/components/loan/ReceivePaymentModal";
import { TimelineEventItem } from "@/components/loan/TimelineEventItem";
import type { CloseLoanSettlementResult } from "@/services/loanCalculator";
import { useLoanStore } from "@/store/loanStore";
import type { PaymentCycle } from "@/types/loan";
import type { PaymentHistory, PaymentHistoryType } from "@/types/payment";

const mockLoanDetail = {
  borrowerName: "Mali",
  amountDue: 4600,
  amountLabel: "Currently due",
  statusText: "3 days overdue",
  nextDueDate: "May 18, 2026",
  nextDueLabel: "Next due",
  paymentCycle: "Monthly",
  urgency: "overdue" as const,
  principal: 92000,
  interestRate: "5%",
  unpaidInterest: 1600,
  creditBalance: 0,
  accumulatedProfit: 18400
};

const mockTimeline = [
  {
    id: "mock-payment-april",
    title: "Received interest",
    subtitle: "Interest payment recorded for the April cycle.",
    amount: "$4,600",
    date: "Apr 18",
    tone: "mint" as const,
    icon: "checkmark-circle-outline" as const
  },
  {
    id: "mock-overdue-may",
    title: "Cycle overdue",
    subtitle: "Current cycle passed its expected due date.",
    date: "May 18",
    tone: "danger" as const,
    icon: "alert-circle-outline" as const
  },
  {
    id: "mock-rescheduled-march",
    title: "Cycle rescheduled",
    subtitle: "Due date moved for this cycle only.",
    date: "Mar 28",
    tone: "cyan" as const,
    icon: "calendar-outline" as const
  },
  {
    id: "mock-partial-march",
    title: "Partial payment",
    subtitle: "A partial interest payment was received.",
    amount: "$2,000",
    date: "Mar 10",
    tone: "gold" as const,
    icon: "remove-circle-outline" as const
  }
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatPaymentCycle(paymentCycle: PaymentCycle) {
  return paymentCycle === "monthly" ? "Monthly" : "Every 10 days";
}

function formatPaymentDate(date: string | null) {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

function formatFullDate(date: string | null | undefined) {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function getTimelineMeta(type: PaymentHistoryType) {
  if (type === "partial_payment") {
    return {
      title: "Partial payment",
      subtitle: "Remaining interest rolled into the next cycle.",
      tone: "gold" as const,
      icon: "remove-circle-outline" as const
    };
  }

  if (type === "overpayment") {
    return {
      title: "Overpayment",
      subtitle: "Extra payment was saved as credit balance.",
      tone: "cyan" as const,
      icon: "add-circle-outline" as const
    };
  }

  if (type === "loan_close") {
    return {
      title: "Loan closed",
      subtitle: "Final settlement recorded and loan moved to archive.",
      tone: "danger" as const,
      icon: "lock-closed-outline" as const
    };
  }

  return {
    title: "Received interest",
    subtitle: "Interest payment recorded for this cycle.",
    tone: "mint" as const,
    icon: "checkmark-circle-outline" as const
  };
}

export default function LoanDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    deleteLoan,
    receivePayment
  } = useLoanStore();
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
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
  const shouldUseMockPreview = !matchedSelectedLoan && loanId === "test-loan";
  const displayLoan = matchedSelectedLoan
    ? {
      borrowerName: matchedSelectedLoan.borrowerName,
      amountDue: isArchivedLoan ? matchedSelectedLoan.principal : selectedPaymentQuote?.amountDue ?? 0,
      amountLabel: isArchivedLoan ? "Principal closed" : "Currently due",
      statusText: isArchivedLoan
        ? "Closed"
        : selectedPaymentQuote?.amountDue === 0 ? "Covered by credit" : "Payment due",
      nextDueDate: isArchivedLoan ? formatFullDate(matchedSelectedLoan.closedAt) : matchedSelectedLoan.currentDueDate,
      nextDueLabel: isArchivedLoan ? "Closed date" : "Next due",
      paymentCycle: formatPaymentCycle(matchedSelectedLoan.paymentCycle),
      urgency: isArchivedLoan || selectedPaymentQuote?.amountDue === 0 ? "healthy" as const : "soon" as const,
      principal: matchedSelectedLoan.principal,
      interestRate: `${matchedSelectedLoan.interestRate}%`,
      unpaidInterest: matchedSelectedLoan.unpaidInterest,
      creditBalance: matchedSelectedLoan.creditBalance,
      accumulatedProfit: matchedSelectedLoan.accumulatedProfit
    }
    : shouldUseMockPreview
      ? mockLoanDetail
      : null;

  const timelineEvents = useMemo(() => {
    if (selectedPaymentHistories.length === 0) {
      return shouldUseMockPreview ? mockTimeline : [];
    }

    return selectedPaymentHistories.map((history) => {
      const meta = getTimelineMeta(history.type);

      return {
        id: history.id,
        ...meta,
        amount: formatCurrency(history.paidAmount),
        note: history.note,
        date: formatPaymentDate(history.paymentDate ?? history.createdAt)
      };
    });
  }, [selectedPaymentHistories, shouldUseMockPreview]);

  const amountDueText = formatCurrency(displayLoan?.amountDue ?? 0);
  function openPaymentModal() {
    clearError();
    setPaymentError(null);
    setPaymentAmount("");
    setPaymentNote("");
    setIsPaymentModalVisible(true);
  }

  async function useFullPaymentAmount() {
    if (!selectedLoan) {
      setPaymentError("Load a database loan before receiving payment.");
      return;
    }

    try {
      const quote = await getPaymentQuote(selectedLoan.id);
      setPaymentAmount(String(quote.amountDue));
    } catch (quoteError) {
      setPaymentError(quoteError instanceof Error ? quoteError.message : "Could not load payment amount.");
    }
  }

  async function submitPayment() {
    const parsedAmount = Number(paymentAmount);

    if (!selectedLoan) {
      setPaymentError("Load a database loan before receiving payment.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setPaymentError("Enter a payment amount greater than 0.");
      return;
    }

    try {
      setPaymentError(null);
      setIsSubmittingPayment(true);
      await receivePayment({
        loanId: selectedLoan.id,
        paidAmount: parsedAmount,
        note: paymentNote
      });
      await loadLoanDetail(selectedLoan.id);
      setIsPaymentModalVisible(false);
      setPaymentAmount("");
      setPaymentNote("");
    } catch (paymentSubmitError) {
      setPaymentError(
        paymentSubmitError instanceof Error
          ? paymentSubmitError.message
          : "Payment could not be saved."
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  async function openCloseModal() {
    if (!matchedSelectedLoan) {
      setCloseError("Load a database loan before closing.");
      return;
    }

    try {
      setCloseError(null);
      setCloseSettlement(null);
      const settlement = await getCloseLoanSettlement(matchedSelectedLoan.id);
      setCloseSettlement(settlement);
      setIsCloseModalVisible(true);
    } catch (closeQuoteError) {
      setCloseError(
        closeQuoteError instanceof Error
          ? closeQuoteError.message
          : "Close settlement could not be loaded."
      );
    }
  }

  async function confirmCloseLoan() {
    if (!matchedSelectedLoan) {
      setCloseError("Load a database loan before closing.");
      return;
    }

    try {
      setCloseError(null);
      setIsClosingLoan(true);
      await closeLoanWithSettlement(matchedSelectedLoan.id);
      await loadLoanDetail(matchedSelectedLoan.id);
      setIsCloseModalVisible(false);
      setCloseSettlement(null);
    } catch (closeSubmitError) {
      setCloseError(
        closeSubmitError instanceof Error
          ? closeSubmitError.message
          : "Loan could not be closed."
      );
    } finally {
      setIsClosingLoan(false);
    }
  }

  function openDeleteModal() {
    if (!matchedSelectedLoan || matchedSelectedLoan.status !== "active") {
      setDeleteError("Only active loans can be deleted.");
      return;
    }

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
    if (!matchedSelectedLoan) {
      setDeleteError("Load a database loan before deleting.");
      return;
    }

    try {
      setDeleteError(null);
      setIsDeletingLoan(true);
      await deleteLoan(matchedSelectedLoan.id);
      setIsDeleteModalVisible(false);
      router.replace("/");
    } catch (deleteSubmitError) {
      setDeleteError(
        deleteSubmitError instanceof Error
          ? deleteSubmitError.message
          : "Loan could not be deleted."
      );
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
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 48
        }}
        showsVerticalScrollIndicator={false}
      >
        {!displayLoan ? (
          <View className="rounded-[28px] border border-border bg-surface/90 p-6">
            <Text className="text-[24px] font-semibold text-white">
              {isLoadingLoanDetail ? "Loading loan" : "Loan not found"}
            </Text>
            <Text className="mt-2 text-[14px] leading-6 text-muted">
              {isLoadingLoanDetail
                ? "Loading this borrower from local storage."
                : "This loan could not be found on this device."}
            </Text>
            {error ? <Text className="mt-4 text-[13px] text-danger">{error}</Text> : null}
          </View>
        ) : (
          <>
        <Animated.View entering={FadeInUp.duration(360)}>
          <View className="gap-1">
            <Text className="text-[12px] font-semibold uppercase tracking-[1.4px] text-mint">
              Loan detail
            </Text>
            <Text className="text-[13px] text-muted">
              {shouldUseMockPreview ? "Preview loan" : "Local loan record"}
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
            title="Loan overview"
            rows={[
              { label: "Principal", value: formatCurrency(displayLoan.principal) },
              { label: "Interest rate", value: displayLoan.interestRate, tone: "gold" },
              { label: "Payment cycle", value: displayLoan.paymentCycle },
              {
                label: "Unpaid interest",
                value: formatCurrency(displayLoan.unpaidInterest),
                tone: "danger"
              },
              {
                label: "Credit balance",
                value: formatCurrency(displayLoan.creditBalance),
                tone: "cyan"
              },
              {
                label: "Accumulated profit",
                value: formatCurrency(displayLoan.accumulatedProfit),
                tone: "mint"
              },
              ...(isArchivedLoan
                ? [{ label: "Closed date", value: formatFullDate(matchedSelectedLoan?.closedAt), tone: "cyan" as const }]
                : [])
            ]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(380)} className="gap-4">
          <View className="flex-row items-end justify-between">
            <View className="gap-1">
              <Text className="text-[24px] font-semibold text-white">Timeline</Text>
              <Text className="text-[13px] text-muted">
                {matchedSelectedLoan ? "Recent payment activity" : "Sample activity"}
              </Text>
            </View>
            {shouldUseMockPreview ? (
              <Text className="text-[13px] font-semibold text-mutedSoft">Preview</Text>
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
                <Text className="text-[15px] font-semibold text-white">No payment history yet</Text>
                <Text className="mt-1 text-[13px] leading-5 text-muted">
                  Received interest records will appear here.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {!isArchivedLoan ? (
        <Animated.View entering={FadeInUp.delay(300).duration(360)} className="gap-4">
          <View className="gap-1">
            <Text className="text-[24px] font-semibold text-white">Quick actions</Text>
            <Text className="text-[13px] text-muted">
              {selectedLoan ? "Payment actions" : "Create or load a database loan to save payment"}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <QuickActionButton
              label="Receive Interest"
              icon="cash-outline"
              tone="primary"
              onPress={openPaymentModal}
            />
            <QuickActionButton disabled label="Reschedule" icon="calendar-outline" tone="neutral" />
            <QuickActionButton
              disabled={!matchedSelectedLoan || matchedSelectedLoan.status !== "active"}
              label="Close Loan"
              icon="lock-closed-outline"
              tone="danger"
              onPress={openCloseModal}
            />
          </View>
          {matchedSelectedLoan?.status === "active" ? (
            <Pressable
              accessibilityRole="button"
              onPress={openDeleteModal}
              className="self-start rounded-full border border-danger/20 bg-danger/10 px-4 py-2.5 active:opacity-80"
            >
              <Text className="text-[13px] font-semibold text-danger">Delete mistaken loan</Text>
            </Pressable>
          ) : null}
          {closeError ? <Text className="text-[13px] text-danger">{closeError}</Text> : null}
          {error ? <Text className="text-[13px] text-danger">{error}</Text> : null}
        </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(300).duration(360)}>
            <View className="rounded-[24px] border border-cyan/15 bg-cyan/10 p-5">
              <Text className="text-[18px] font-semibold text-white">Closed loan</Text>
              <Text className="mt-2 text-[13px] leading-5 text-muted">
                This archived loan is read-only. Payment actions are disabled.
              </Text>
            </View>
          </Animated.View>
        )}
          </>
        )}
      </ScrollView>

      {displayLoan && !isArchivedLoan ? (
        <ReceivePaymentModal
          amount={paymentAmount}
          amountDue={amountDueText}
          canSubmit={Number(paymentAmount) > 0}
          error={paymentError}
          isSubmitting={isSubmittingPayment}
          note={paymentNote}
          visible={isPaymentModalVisible}
          onAmountChange={setPaymentAmount}
          onClose={() => setIsPaymentModalVisible(false)}
          onNoteChange={setPaymentNote}
          onSubmit={submitPayment}
          onUseFullAmount={useFullPaymentAmount}
        />
      ) : null}

      <CloseLoanModal
        error={closeError}
        isSubmitting={isClosingLoan}
        settlement={closeSettlement}
        visible={isCloseModalVisible}
        onClose={() => {
          setIsCloseModalVisible(false);
          setCloseSettlement(null);
        }}
        onConfirm={confirmCloseLoan}
      />
      <DeleteLoanModal
        borrowerName={matchedSelectedLoan?.borrowerName}
        error={deleteError}
        isSubmitting={isDeletingLoan}
        visible={isDeleteModalVisible}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteLoan}
      />
    </View>
  );
}
