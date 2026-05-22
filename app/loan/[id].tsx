import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { LoanHeroCard } from "@/components/loan/LoanHeroCard";
import { LoanOverviewCard } from "@/components/loan/LoanOverviewCard";
import { QuickActionButton } from "@/components/loan/QuickActionButton";
import { ReceivePaymentModal } from "@/components/loan/ReceivePaymentModal";
import { TimelineEventItem } from "@/components/loan/TimelineEventItem";
import { useLoanStore } from "@/store/loanStore";
import type { PaymentCycle } from "@/types/loan";
import type { PaymentHistory, PaymentHistoryType } from "@/types/payment";

const mockLoanDetail = {
  borrowerName: "Mali",
  amountDue: 4600,
  statusText: "3 days overdue",
  nextDueDate: "May 18, 2026",
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
    title: "Received interest",
    subtitle: "Interest payment recorded for the April cycle.",
    amount: "$4,600",
    date: "Apr 18",
    tone: "mint" as const,
    icon: "checkmark-circle-outline" as const
  },
  {
    title: "Cycle overdue",
    subtitle: "Current cycle passed its expected due date.",
    date: "May 18",
    tone: "danger" as const,
    icon: "alert-circle-outline" as const
  },
  {
    title: "Cycle rescheduled",
    subtitle: "Due date moved for this cycle only.",
    date: "Mar 28",
    tone: "cyan" as const,
    icon: "calendar-outline" as const
  },
  {
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

  return {
    title: "Received interest",
    subtitle: "Interest payment recorded for this cycle.",
    tone: "mint" as const,
    icon: "checkmark-circle-outline" as const
  };
}

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loanId = id ?? "";
  const {
    selectedLoan,
    selectedPaymentHistories,
    selectedPaymentQuote,
    error,
    clearError,
    getPaymentQuote,
    loadLoanDetail,
    receivePayment
  } = useLoanStore();
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    if (loanId) {
      loadLoanDetail(loanId).catch(() => {
        // Store error state handles display; mock fallback remains visible.
      });
    }
  }, [loadLoanDetail, loanId]);

  const displayLoan = selectedLoan
    ? {
      borrowerName: selectedLoan.borrowerName,
      amountDue: selectedPaymentQuote?.amountDue ?? 0,
      statusText: selectedPaymentQuote?.amountDue === 0 ? "Covered by credit" : "Payment due",
      nextDueDate: selectedLoan.currentDueDate,
      paymentCycle: formatPaymentCycle(selectedLoan.paymentCycle),
      urgency: selectedPaymentQuote?.amountDue === 0 ? "healthy" as const : "soon" as const,
      principal: selectedLoan.principal,
      interestRate: `${selectedLoan.interestRate}%`,
      unpaidInterest: selectedLoan.unpaidInterest,
      creditBalance: selectedLoan.creditBalance,
      accumulatedProfit: selectedLoan.accumulatedProfit
    }
    : mockLoanDetail;

  const timelineEvents = useMemo(() => {
    if (selectedPaymentHistories.length === 0) {
      return mockTimeline;
    }

    return selectedPaymentHistories.map((history) => {
      const meta = getTimelineMeta(history.type);

      return {
        ...meta,
        amount: formatCurrency(history.paidAmount),
        date: formatPaymentDate(history.paymentDate ?? history.createdAt)
      };
    });
  }, [selectedPaymentHistories]);

  const amountDueText = formatCurrency(displayLoan.amountDue);

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

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="absolute left-0 right-0 top-0 h-72 bg-auraPurple opacity-25" />
      <View className="absolute left-0 right-0 top-72 h-80 bg-auraMint opacity-10" />
      <View className="absolute left-0 right-0 bottom-0 h-72 bg-auraBlue opacity-10" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-7 px-5 pb-12 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(360)}>
          <View className="gap-1">
            <Text className="text-[12px] font-semibold uppercase tracking-[1.4px] text-mint">
              Loan detail
            </Text>
            <Text className="text-[13px] text-muted">Mock loan ID: {id}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(380)}>
          <LoanHeroCard
            borrowerName={displayLoan.borrowerName}
            amountDue={amountDueText}
            statusText={displayLoan.statusText}
            nextDueDate={displayLoan.nextDueDate}
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
              }
            ]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(380)} className="gap-4">
          <View className="flex-row items-end justify-between">
            <View className="gap-1">
              <Text className="text-[24px] font-semibold text-white">Timeline</Text>
              <Text className="text-[13px] text-muted">
                {selectedLoan ? "Recent payment activity" : "Recent mock activity"}
              </Text>
            </View>
            <Text className="text-[13px] font-semibold text-mutedSoft">Preview</Text>
          </View>

          <View className="gap-3">
            {timelineEvents.map((event, index) => (
              <Animated.View
                key={`${event.title}-${event.date}`}
                entering={FadeInUp.delay(200 + index * 45).duration(340)}
              >
                <TimelineEventItem {...event} />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

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
            <QuickActionButton disabled label="Close Loan" icon="lock-closed-outline" tone="danger" />
          </View>
          {error ? <Text className="text-[13px] text-danger">{error}</Text> : null}
        </Animated.View>
      </ScrollView>

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
    </View>
  );
}
