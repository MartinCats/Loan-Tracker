import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LoanFocusCard } from "@/components/dashboard/LoanFocusCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { AddLoanModal } from "@/components/loan/AddLoanModal";
import { getLoanUrgencyStatus, type LoanUrgencyStatus } from "@/services/loanCalculator";
import { useLoanStore } from "@/store/loanStore";
import type { Loan, PaymentCycle } from "@/types/loan";

type DashboardLoan = {
  id: string;
  borrowerName: string;
  principal: number;
  dueDate: string;
  paymentCycle: string;
  urgency: LoanUrgencyStatus;
  countdownText: string;
};

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

function formatDueDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function getCountdownText(status: LoanUrgencyStatus) {
  if (status === "overdue") {
    return "Overdue";
  }

  if (status === "due_today") {
    return "Due today";
  }

  if (status === "due_soon") {
    return "Due soon";
  }

  return "Upcoming";
}

function getCardUrgency(status: LoanUrgencyStatus) {
  if (status === "due_today") {
    return "today";
  }

  if (status === "due_soon") {
    return "soon";
  }

  return status;
}

function compareLoanUrgency(a: DashboardLoan, b: DashboardLoan) {
  const rank: Record<LoanUrgencyStatus, number> = {
    overdue: 0,
    due_today: 1,
    due_soon: 2,
    upcoming: 3
  };
  const urgencyDifference = rank[a.urgency] - rank[b.urgency];

  if (urgencyDifference !== 0) {
    return urgencyDifference;
  }

  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

function toDashboardLoan(loan: Loan): DashboardLoan {
  const urgency = getLoanUrgencyStatus(loan.currentDueDate, new Date().toISOString());

  return {
    id: loan.id,
    borrowerName: loan.borrowerName,
    principal: loan.principal,
    dueDate: loan.currentDueDate,
    paymentCycle: formatPaymentCycle(loan.paymentCycle),
    urgency,
    countdownText: getCountdownText(urgency)
  };
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeLoans,
    createLoan,
    error,
    isLoading,
    loadActiveLoans
  } = useLoanStore();
  const [isAddLoanVisible, setIsAddLoanVisible] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [paymentCycle, setPaymentCycle] = useState<PaymentCycle>("monthly");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);

  useEffect(() => {
    loadActiveLoans().catch(() => {
      // Store error is displayed below the action area.
    });
  }, [loadActiveLoans]);

  const dashboardLoans = useMemo(
    () => activeLoans.map(toDashboardLoan).sort(compareLoanUrgency),
    [activeLoans]
  );
  const summary = useMemo(() => {
    return activeLoans.reduce(
      (totals, loan) => ({
        accumulatedProfit: totals.accumulatedProfit + loan.accumulatedProfit,
        activePrincipal: totals.activePrincipal + loan.principal
      }),
      {
        accumulatedProfit: 0,
        activePrincipal: 0
      }
    );
  }, [activeLoans]);
  const hasRealLoans = activeLoans.length > 0;

  function openAddLoan() {
    setFormError(null);
    setIsAddLoanVisible(true);
  }

  function resetAddLoanForm() {
    setBorrowerName("");
    setPrincipal("");
    setInterestRate("");
    setPaymentCycle("monthly");
    setFirstDueDate("");
    setFormError(null);
  }

  function closeAddLoan() {
    setIsAddLoanVisible(false);
    resetAddLoanForm();
  }

  async function submitAddLoan() {
    const parsedPrincipal = Number(principal);
    const parsedInterestRate = Number(interestRate);
    const normalizedDueDate = firstDueDate.trim();

    if (!borrowerName.trim()) {
      setFormError("Borrower name is required.");
      return;
    }

    if (!Number.isFinite(parsedPrincipal) || parsedPrincipal <= 0) {
      setFormError("Principal must be greater than 0.");
      return;
    }

    if (!Number.isFinite(parsedInterestRate) || parsedInterestRate < 0) {
      setFormError("Interest rate must be greater than or equal to 0.");
      return;
    }

    if (!isValidIsoDate(normalizedDueDate)) {
      setFormError("First due date must use YYYY-MM-DD.");
      return;
    }

    try {
      setIsCreatingLoan(true);
      setFormError(null);
      await withOperationTimeout(
        createLoan({
          id: createLocalId("loan"),
          borrowerName: borrowerName.trim(),
          principal: parsedPrincipal,
          interestRate: parsedInterestRate,
          paymentCycle,
          currentDueDate: normalizedDueDate,
          unpaidInterest: 0,
          creditBalance: 0,
          accumulatedProfit: 0,
          status: "active"
        }),
        "Loan creation is taking too long. Please try again."
      );
      await withOperationTimeout(
        loadActiveLoans(),
        "Loan was created, but the dashboard could not refresh."
      );
      closeAddLoan();
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : "Loan could not be created.");
    } finally {
      setIsCreatingLoan(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="absolute left-0 right-0 top-0 h-72 bg-auraPurple opacity-30" />
      <View className="absolute left-0 right-0 top-64 h-80 bg-auraMint opacity-10" />
      <View className="absolute left-0 right-0 bottom-0 h-72 bg-auraBlue opacity-10" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 104
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(380)}>
          <View className="gap-4">
            <DashboardHeader
              title="Dashboard"
              subtitle={
                hasRealLoans
                  ? `${activeLoans.length} active borrower${activeLoans.length === 1 ? "" : "s"}`
                  : "No active loans yet"
              }
            />
            {hasRealLoans ? (
              <Pressable
                accessibilityRole="button"
                onPress={openAddLoan}
                className="self-start rounded-full bg-mint px-5 py-3"
              >
                <Text className="text-[14px] font-semibold text-background">Add Loan</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {hasRealLoans ? (
          <>
            <Animated.View
              entering={FadeInUp.delay(70).duration(380)}
              className="gap-3"
            >
              <View className="flex-row gap-3">
                <SummaryCard
                  label="Profit received"
                  value={formatCurrency(summary.accumulatedProfit)}
                  accent="mint"
                  emphasis="primary"
                />
                <SummaryCard
                  label="Principal active"
                  value={formatCurrency(summary.activePrincipal)}
                  accent="gold"
                  emphasis="secondary"
                />
              </View>
              <SummaryCard
                label="Active loans"
                value={String(activeLoans.length)}
                accent="cyan"
                emphasis="quiet"
              />
            </Animated.View>

            <View className="gap-4 pt-1">
              <View className="flex-row items-end justify-between">
                <View className="gap-1">
                  <Text className="text-[26px] font-semibold leading-8 text-white">Active loans</Text>
                  <Text className="text-[13px] text-muted">Real loans saved on this device</Text>
                </View>
                <Text className="text-[13px] font-semibold text-mint">{activeLoans.length} active</Text>
              </View>

              {dashboardLoans.map((loan, index) => (
                <Animated.View
                  key={loan.id}
                  entering={FadeInUp.delay(130 + index * 55).duration(360)}
                >
                  <LoanFocusCard
                    borrowerName={loan.borrowerName}
                    amountDue={formatCurrency(loan.principal)}
                    amountLabel="Principal"
                    countdownText={loan.countdownText}
                    dueDate={formatDueDate(loan.dueDate)}
                    paymentCycle={loan.paymentCycle}
                    urgency={getCardUrgency(loan.urgency)}
                  />
                </Animated.View>
              ))}
            </View>
          </>
        ) : (
          <Animated.View entering={FadeInUp.delay(90).duration(380)}>
            <View className="items-center justify-center rounded-[28px] border border-mint/20 bg-surface/90 p-8 shadow-lg shadow-mint/5">
              <Text className="text-[22px] font-semibold text-white">No loans yet</Text>
              <Text className="mt-2 text-center text-[14px] leading-6 text-muted">
                Add your first borrower to start tracking real local loans.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={openAddLoan}
                className="mt-6 rounded-full bg-mint px-5 py-3"
              >
                <Text className="text-[14px] font-semibold text-background">Add Loan</Text>
              </Pressable>
              {error && !isLoading ? <Text className="mt-4 text-center text-[13px] text-danger">{error}</Text> : null}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <AddLoanModal
        borrowerName={borrowerName}
        error={formError}
        firstDueDate={firstDueDate}
        interestRate={interestRate}
        isSubmitting={isCreatingLoan}
        paymentCycle={paymentCycle}
        principal={principal}
        visible={isAddLoanVisible}
        onBorrowerNameChange={setBorrowerName}
        onClose={closeAddLoan}
        onFirstDueDateChange={setFirstDueDate}
        onInterestRateChange={setInterestRate}
        onPaymentCycleChange={setPaymentCycle}
        onPrincipalChange={setPrincipal}
        onSubmit={submitAddLoan}
      />
    </View>
  );
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function withOperationTimeout<T>(operation: Promise<T>, message: string) {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), 10000);
    })
  ]);
}
