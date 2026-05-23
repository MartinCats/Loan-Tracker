import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LoanFocusCard } from "@/components/dashboard/LoanFocusCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { AddLoanModal } from "@/components/loan/AddLoanModal";
import { DeleteLoanModal } from "@/components/loan/DeleteLoanModal";
import { PressableScale } from "@/components/ui/PressableScale";
import {
  formatCountdownDisplay,
  formatCurrency,
  formatDateOnly
} from "@/services/formatters";
import { t } from "@/services/i18n";
import {
  calculateExpectedProfit,
  getLoanCountdownDisplay,
  type LoanCountdownDisplay
} from "@/services/loanCalculator";
import { useLoanStore } from "@/store/loanStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { Loan, PaymentCycle } from "@/types/loan";
import {
  compareDateOnly,
  getLocalTodayDateOnly,
  isValidDateOnly
} from "@/utils/dateOnly";
import { impactLight, impactMedium, notifyError, notifySuccess } from "@/utils/haptics";
import { getReadableErrorMessage, getReadableErrorText } from "@/utils/readableError";
import { getTabScreenInsets } from "@/utils/screenSpacing";
import { registerTabScrollHandler } from "@/utils/tabScrollRegistry";

type DashboardLoan = {
  id: string;
  borrowerName: string;
  principal: number;
  dueDate: string;
  paymentCycle: string;
  countdown: LoanCountdownDisplay;
};

function formatPaymentCycle(paymentCycle: PaymentCycle) {
  return paymentCycle === "monthly" ? t("cycle.monthly") : t("cycle.every10Days");
}

function getCardUrgency(status: LoanCountdownDisplay["status"]) {
  if (status === "due_today") {
    return "today";
  }

  if (status === "due_soon") {
    return "soon";
  }

  return status;
}

function compareLoanUrgency(a: DashboardLoan, b: DashboardLoan) {
  const rank: Record<LoanCountdownDisplay["status"], number> = {
    overdue: 0,
    due_today: 1,
    due_soon: 2,
    upcoming: 3
  };
  const urgencyDifference = rank[a.countdown.status] - rank[b.countdown.status];

  if (urgencyDifference !== 0) {
    return urgencyDifference;
  }

  return compareDateOnly(a.dueDate, b.dueDate);
}

function toDashboardLoan(loan: Loan): DashboardLoan {
  const countdown = getLoanCountdownDisplay(loan.currentDueDate, getLocalTodayDateOnly());

  return {
    id: loan.id,
    borrowerName: loan.borrowerName,
    principal: loan.principal,
    dueDate: loan.currentDueDate,
    paymentCycle: formatPaymentCycle(loan.paymentCycle),
    countdown
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    activeLoans,
    archivedLoans,
    createLoan,
    deleteLoan,
    error,
    isLoading,
    loadLoans
  } = useLoanStore();
  const language = useSettingsStore((state) => state.language);
  const [isAddLoanVisible, setIsAddLoanVisible] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [paymentCycle, setPaymentCycle] = useState<PaymentCycle>("monthly");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  const [deleteTargetLoan, setDeleteTargetLoan] = useState<DashboardLoan | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingLoan, setIsDeletingLoan] = useState(false);

  useEffect(() => {
    loadLoans().catch(() => {
      // Store error is displayed below the action area.
    });
  }, [loadLoans]);

  useEffect(() => {
    return registerTabScrollHandler("index", () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  const dashboardLoans = useMemo(
    () => activeLoans.map(toDashboardLoan).sort(compareLoanUrgency),
    [activeLoans, language]
  );
  const summary = useMemo(() => {
    const activeSummary = activeLoans.reduce(
      (totals, loan) => ({
        activePrincipal: totals.activePrincipal + loan.principal
      }),
      {
        activePrincipal: 0
      }
    );
    const lifetimeProfit = [...activeLoans, ...archivedLoans].reduce(
      (total, loan) => total + loan.accumulatedProfit,
      0
    );
    const expectedProfit = activeLoans.reduce(
      (total, loan) => total + calculateExpectedProfit({
        accumulatedProfit: loan.accumulatedProfit,
        interestRate: loan.interestRate,
        principal: loan.principal
      }),
      0
    );

    return {
      activePrincipal: activeSummary.activePrincipal,
      expectedProfit,
      lifetimeProfit
    };
  }, [activeLoans, archivedLoans]);
  const hasRealLoans = activeLoans.length > 0;
  const hasLifetimeProfit = summary.lifetimeProfit > 0;

  function openAddLoan() {
    impactLight();
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
    if (isCreatingLoan) {
      return;
    }

    setIsAddLoanVisible(false);
    resetAddLoanForm();
  }

  async function submitAddLoan() {
    if (isCreatingLoan) {
      return;
    }

    const parsedPrincipal = Number(principal);
    const parsedInterestRate = Number(interestRate);
    const normalizedDueDate = firstDueDate.trim();

    if (!borrowerName.trim()) {
      notifyError();
      setFormError(t("errors.borrowerRequired"));
      return;
    }

    if (!Number.isFinite(parsedPrincipal) || parsedPrincipal <= 0) {
      notifyError();
      setFormError(t("errors.principalPositive"));
      return;
    }

    if (!Number.isFinite(parsedInterestRate) || parsedInterestRate < 0) {
      notifyError();
      setFormError(t("errors.interestNonNegative"));
      return;
    }

    if (!isValidDateOnly(normalizedDueDate)) {
      notifyError();
      setFormError(t("errors.dateFormat"));
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
        t("errors.loanCreate")
      );
      await withOperationTimeout(loadLoans(), t("dashboard.errorLoad"));
      notifySuccess();
      closeAddLoan();
    } catch (createError) {
      notifyError();
      setFormError(getReadableErrorMessage(createError, t("errors.loanCreate")));
    } finally {
      setIsCreatingLoan(false);
    }
  }

  function openDeleteLoan(loan: DashboardLoan) {
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
      await deleteLoan(deleteTargetLoan.id);
      notifySuccess();
      setDeleteTargetLoan(null);
    } catch (deleteSubmitError) {
      notifyError();
      setDeleteError(getReadableErrorMessage(deleteSubmitError, t("errors.loanDelete")));
    } finally {
      setIsDeletingLoan(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="absolute left-0 right-0 top-0 h-72 bg-auraPurple opacity-30" />
      <View className="absolute left-0 right-0 top-64 h-80 bg-auraMint opacity-10" />
      <View className="absolute left-0 right-0 bottom-0 h-72 bg-auraBlue opacity-10" />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="gap-8 px-5"
        contentContainerStyle={{
          ...getTabScreenInsets(insets)
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(380)}>
          <View className="gap-4">
            <DashboardHeader
              title={t("common.dashboard")}
              subtitle={
                hasRealLoans
                  ? t("dashboard.subtitleActive", {
                    count: activeLoans.length,
                    plural: activeLoans.length === 1 ? "" : "s"
                  })
                  : t("dashboard.subtitleEmpty")
              }
            />
            {hasRealLoans ? (
              <PressableScale
                accessibilityRole="button"
                onPress={openAddLoan}
                className="self-start rounded-full bg-mint px-5 py-3"
                scaleTo={0.97}
              >
                <Text className="text-[14px] font-semibold text-background">{t("common.addLoan")}</Text>
              </PressableScale>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(70).duration(380)}
          className="gap-3"
        >
          <View className="flex-row gap-3">
            <SummaryCard
              label={t("dashboard.lifetimeProfit")}
              value={formatCurrency(summary.lifetimeProfit, language)}
              accent="mint"
              emphasis="primary"
            />
            <SummaryCard
              label={t("dashboard.expectedProfit")}
              value={formatCurrency(summary.expectedProfit, language)}
              accent="cyan"
              emphasis="secondary"
            />
          </View>
          <View className="flex-row gap-3">
            <SummaryCard
              label={t("dashboard.principalActive")}
              value={formatCurrency(summary.activePrincipal, language)}
              accent="gold"
              emphasis="secondary"
            />
            <SummaryCard
              label={t("dashboard.activeLoans")}
              value={String(activeLoans.length)}
              accent="cyan"
              emphasis="quiet"
            />
          </View>
        </Animated.View>

        {hasRealLoans ? (
          <>
            <View className="gap-4 pt-1">
              <View className="flex-row items-end justify-between">
                <View className="gap-1">
                  <Text className="text-[26px] font-semibold leading-8 text-white">{t("dashboard.activeLoans")}</Text>
                  <Text className="text-[13px] text-muted">{t("dashboard.realLoansSaved")}</Text>
                </View>
                <Text className="text-[13px] font-semibold text-mint">
                  {t("dashboard.activeCount", { count: activeLoans.length })}
                </Text>
              </View>

              {dashboardLoans.map((loan, index) => (
                <Animated.View
                  key={loan.id}
                  entering={FadeInUp.delay(130 + index * 55).duration(360)}
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
                    <LoanFocusCard
                      borrowerName={loan.borrowerName}
                      amountDue={formatCurrency(loan.principal, language)}
                      amountLabel={t("common.principal")}
                      countdownValue={formatCountdownDisplay(loan.countdown).value}
                      countdownLabel={formatCountdownDisplay(loan.countdown).label}
                      countdownAccessibilityLabel={loan.countdown.accessibilityLabel}
                      dueDate={formatDateOnly(loan.dueDate, language)}
                      paymentCycle={loan.paymentCycle}
                      urgency={getCardUrgency(loan.countdown.status)}
                    />
                  </PressableScale>
                </Animated.View>
              ))}
            </View>
          </>
        ) : (
          <Animated.View entering={FadeInUp.delay(90).duration(380)}>
            <View className="items-center justify-center rounded-[28px] border border-mint/20 bg-surface/90 p-8 shadow-lg shadow-mint/5">
              <Text className="text-center text-[22px] font-semibold text-white">
                {hasLifetimeProfit ? t("dashboard.noActiveTitle") : t("dashboard.noLoansTitle")}
              </Text>
              <Text className="mt-2 text-center text-[14px] leading-6 text-muted">
                {hasLifetimeProfit
                  ? t("dashboard.noActiveWithProfitBody", {
                    amount: formatCurrency(summary.lifetimeProfit, language)
                  })
                  : t("dashboard.noLoansBody")}
              </Text>
              <PressableScale
                accessibilityRole="button"
                onPress={openAddLoan}
                className="mt-6 rounded-full bg-mint px-5 py-3"
                scaleTo={0.97}
              >
                <Text className="text-[14px] font-semibold text-background">{t("common.addLoan")}</Text>
              </PressableScale>
              {error && !isLoading ? (
                <Text className="mt-4 text-center text-[13px] text-danger">
                  {getReadableErrorText(error, t("dashboard.errorLoad"))}
                </Text>
              ) : null}
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
      <DeleteLoanModal
        borrowerName={deleteTargetLoan?.borrowerName}
        error={deleteError}
        isSubmitting={isDeletingLoan}
        visible={deleteTargetLoan !== null}
        onClose={closeDeleteLoan}
        onConfirm={confirmDeleteLoan}
      />
    </View>
  );
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
