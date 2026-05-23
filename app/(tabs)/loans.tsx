import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoanFilterChip } from "@/components/loans/LoanFilterChip";
import { LoanCompactCard } from "@/components/loans/LoanCompactCard";
import { PressableScale } from "@/components/ui/PressableScale";
import {
  formatCountdownDisplay,
  formatCurrency,
  formatDateOnly
} from "@/services/formatters";
import { t } from "@/services/i18n";
import {
  calculateAmountDue,
  calculateExpectedInterest,
  getLoanCountdownDisplay,
  type LoanCountdownDisplay
} from "@/services/loanCalculator";
import { useLoanStore } from "@/store/loanStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { Loan, PaymentCycle } from "@/types/loan";
import {
  compareDateOnly,
  getLocalTodayDateOnly
} from "@/utils/dateOnly";
import { impactLight } from "@/utils/haptics";
import { getReadableErrorText } from "@/utils/readableError";
import { getTabScreenInsets } from "@/utils/screenSpacing";
import { registerTabScrollHandler } from "@/utils/tabScrollRegistry";

type LoanFilter = "all" | "overdue" | "today" | "upcoming";
type LoanSort = "urgency" | "name" | "principal";

type LoanListItem = {
  amountDue: number;
  countdown: LoanCountdownDisplay;
  dueDate: string;
  loan: Loan;
  paymentCycle: string;
};

const filterOptions: Array<{ label: string; value: LoanFilter }> = [
  { label: "loans.filterAll", value: "all" },
  { label: "loans.filterOverdue", value: "overdue" },
  { label: "loans.filterToday", value: "today" },
  { label: "loans.filterUpcoming", value: "upcoming" }
];

const sortOptions: Array<{ label: string; value: LoanSort }> = [
  { label: "loans.sortUrgency", value: "urgency" },
  { label: "loans.sortName", value: "name" },
  { label: "loans.sortPrincipal", value: "principal" }
];

function formatPaymentCycle(paymentCycle: PaymentCycle) {
  return paymentCycle === "monthly" ? t("cycle.monthly") : t("cycle.every10Days");
}

function toLoanListItem(loan: Loan): LoanListItem {
  const expectedInterest = calculateExpectedInterest(loan.principal, loan.interestRate);
  const amountDue = calculateAmountDue({
    expectedInterest,
    unpaidInterest: loan.unpaidInterest,
    creditBalance: loan.creditBalance
  }).amountDue;

  return {
    amountDue,
    countdown: getLoanCountdownDisplay(loan.currentDueDate, getLocalTodayDateOnly()),
    dueDate: loan.currentDueDate,
    loan,
    paymentCycle: formatPaymentCycle(loan.paymentCycle)
  };
}

function getCardUrgency(status: LoanCountdownDisplay["status"]) {
  if (status === "overdue") {
    return "overdue";
  }

  if (status === "due_today") {
    return "today";
  }

  return "upcoming";
}

function getFilterMatch(item: LoanListItem, filter: LoanFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "overdue") {
    return item.countdown.status === "overdue";
  }

  if (filter === "today") {
    return item.countdown.status === "due_today";
  }

  return item.countdown.status === "due_soon" || item.countdown.status === "upcoming";
}

function sortLoanItems(left: LoanListItem, right: LoanListItem, sort: LoanSort) {
  if (sort === "name") {
    return left.loan.borrowerName.localeCompare(right.loan.borrowerName);
  }

  if (sort === "principal") {
    return right.loan.principal - left.loan.principal ||
      left.loan.borrowerName.localeCompare(right.loan.borrowerName);
  }

  const rank: Record<LoanCountdownDisplay["status"], number> = {
    overdue: 0,
    due_today: 1,
    due_soon: 2,
    upcoming: 3
  };
  const urgencyDifference = rank[left.countdown.status] - rank[right.countdown.status];

  if (urgencyDifference !== 0) {
    return urgencyDifference;
  }

  const dateDifference = compareDateOnly(left.dueDate, right.dueDate);

  if (dateDifference !== 0) {
    return dateDifference;
  }

  return left.loan.borrowerName.localeCompare(right.loan.borrowerName);
}

export default function LoansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    activeLoans,
    error,
    isLoading,
    loadActiveLoans
  } = useLoanStore();
  const language = useSettingsStore((state) => state.language);
  const [filter, setFilter] = useState<LoanFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState<LoanSort>("urgency");

  useEffect(() => {
    loadActiveLoans().catch(() => {
      // Store error is displayed in the empty/error state.
    });
  }, [loadActiveLoans]);

  useEffect(() => {
    return registerTabScrollHandler("loans", () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  const loanItems = useMemo(() => activeLoans.map(toLoanListItem), [activeLoans, language]);
  const visibleLoans = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return loanItems
      .filter((item) => {
        const matchesSearch = normalizedSearch.length === 0 ||
          item.loan.borrowerName.toLowerCase().includes(normalizedSearch);

        return matchesSearch && getFilterMatch(item, filter);
      })
      .sort((left, right) => sortLoanItems(left, right, sort));
  }, [filter, loanItems, searchText, sort]);

  async function refreshLoans() {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      await loadActiveLoans();
    } finally {
      setIsRefreshing(false);
    }
  }

  const hasActiveLoans = activeLoans.length > 0;
  const hasQuery = searchText.trim().length > 0 || filter !== "all";

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
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor="#8EE6C1"
            onRefresh={refreshLoans}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(360)}>
          <View className="gap-3">
            <View className="self-start rounded-full border border-mint/20 bg-mint/10 px-3 py-1.5">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-mint">
                {t("common.loans")}
              </Text>
            </View>
            <View className="gap-1.5">
              <Text className="text-[40px] font-semibold leading-[46px] text-white">{t("loans.title")}</Text>
              <Text className="text-[15px] leading-6 text-muted">
                {hasActiveLoans
                  ? t("loans.subtitleActive", {
                    count: activeLoans.length,
                    plural: activeLoans.length === 1 ? "" : "s"
                  })
                  : t("loans.subtitleEmpty")}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(360)} className="gap-4">
          <View className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("loans.searchPlaceholder")}
              placeholderTextColor="#747F7B"
              value={searchText}
              onChangeText={setSearchText}
              className="text-[16px] font-medium text-white"
            />
          </View>

          <ScrollView
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
          >
            <View className="flex-row gap-2 pr-5">
              {filterOptions.map((option) => (
                <LoanFilterChip
                  key={option.value}
                  label={t(option.label)}
                  selected={filter === option.value}
                  onPress={() => setFilter(option.value)}
                />
              ))}
            </View>
          </ScrollView>

          <View className="gap-2">
            <Text className="text-[12px] font-medium uppercase tracking-[1.2px] text-muted">
              {t("common.sort")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {sortOptions.map((option) => (
                <LoanFilterChip
                  key={option.value}
                  label={t(option.label)}
                  selected={sort === option.value}
                  onPress={() => setSort(option.value)}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {visibleLoans.length > 0 ? (
          <View className="gap-3">
            {visibleLoans.map((item, index) => (
              <Animated.View
                key={item.loan.id}
                entering={FadeInUp.delay(90 + index * 35).duration(320)}
              >
                <PressableScale
                  accessibilityRole="button"
                  onPress={() => {
                    impactLight();
                    router.push(`/loan/${encodeURIComponent(item.loan.id)}`);
                  }}
                  scaleTo={0.985}
                >
                  <LoanCompactCard
                    amountDue={formatCurrency(item.amountDue, language)}
                    borrowerName={item.loan.borrowerName}
                    countdownLabel={formatCountdownDisplay(item.countdown).label}
                    countdownValue={formatCountdownDisplay(item.countdown).value}
                    dueDate={formatDateOnly(item.dueDate, language)}
                    paymentCycle={item.paymentCycle}
                    principal={formatCurrency(item.loan.principal, language)}
                    urgency={getCardUrgency(item.countdown.status)}
                  />
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeInUp.delay(90).duration(360)}>
            <View className="items-center justify-center rounded-[28px] border border-mint/20 bg-surface/90 p-8 shadow-lg shadow-mint/5">
              <Text className="text-center text-[22px] font-semibold text-white">
                {hasActiveLoans ? t("loans.noMatchesTitle") : t("loans.noActiveTitle")}
              </Text>
              <Text className="mt-2 text-center text-[14px] leading-6 text-muted">
                {hasQuery
                  ? t("loans.noMatchesBody")
                  : t("loans.noActiveBody")}
              </Text>
              {error && !isLoading ? (
                <Text className="mt-4 text-center text-[13px] text-danger">
                  {getReadableErrorText(error, t("loans.errorLoad"))}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
