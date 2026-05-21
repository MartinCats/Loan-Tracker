import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LoanFocusCard } from "@/components/dashboard/LoanFocusCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";

type MockFocusLoan = {
  id: string;
  borrowerName: string;
  amountDue: number;
  dueDate: string;
  paymentCycle: "Monthly" | "Every 10 days";
  urgency: "overdue" | "today" | "soon";
  daysUntilDue: number;
};

const mockSummary = {
  accumulatedProfit: 48200,
  activePrincipal: 420000,
  expectedMonthlyInterest: 31500
};

const mockFocusLoans: MockFocusLoan[] = [
  {
    id: "loan-1",
    borrowerName: "Mali",
    amountDue: 4600,
    dueDate: "May 18, 2026",
    paymentCycle: "Monthly",
    urgency: "overdue",
    daysUntilDue: -3
  },
  {
    id: "loan-2",
    borrowerName: "Arun",
    amountDue: 2500,
    dueDate: "May 21, 2026",
    paymentCycle: "Every 10 days",
    urgency: "today",
    daysUntilDue: 0
  },
  {
    id: "loan-3",
    borrowerName: "Nicha",
    amountDue: 7200,
    dueDate: "May 24, 2026",
    paymentCycle: "Monthly",
    urgency: "soon",
    daysUntilDue: 3
  }
];

const urgencyRank: Record<MockFocusLoan["urgency"], number> = {
  overdue: 0,
  today: 1,
  soon: 2
};

const focusLoans = [...mockFocusLoans].sort((a, b) => {
  const urgencyDifference = urgencyRank[a.urgency] - urgencyRank[b.urgency];

  if (urgencyDifference !== 0) {
    return urgencyDifference;
  }

  return a.daysUntilDue - b.daysUntilDue;
});

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function getCountdownText(loan: MockFocusLoan) {
  if (loan.urgency === "overdue") {
    return `${Math.abs(loan.daysUntilDue)} days overdue`;
  }

  if (loan.urgency === "today") {
    return "Due today";
  }

  return `Due in ${loan.daysUntilDue} days`;
}

export default function DashboardScreen() {
  return (
    <View className="flex-1 bg-background">
      <View className="absolute left-0 right-0 top-0 h-64 bg-auraPurple opacity-35" />
      <View className="absolute left-0 right-0 top-48 h-64 bg-auraPurple opacity-18" />
      <View className="absolute left-0 right-0 top-96 h-72 bg-auraBlue opacity-16" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-5 pb-12 pt-8"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(450).springify()}>
          <DashboardHeader
            title="Dashboard"
            subtitle={`${focusLoans.length} borrowers need attention`}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(80).duration(450).springify()}
          className="gap-3.5"
        >
          <View className="flex-row gap-3.5">
            <SummaryCard
              label="Profit received"
              value={formatCurrency(mockSummary.accumulatedProfit)}
              accent="mint"
            />
            <SummaryCard
              label="Principal active"
              value={formatCurrency(mockSummary.activePrincipal)}
              accent="gold"
            />
          </View>
          <SummaryCard
            label="Expected monthly interest"
            value={formatCurrency(mockSummary.expectedMonthlyInterest)}
            accent="cyan"
          />
        </Animated.View>

        <View className="gap-4">
          <View className="flex-row items-end justify-between">
            <View className="gap-1">
              <Text className="text-[26px] font-semibold leading-8 text-white">Focus</Text>
              <Text className="text-[13px] text-muted">Overdue and upcoming interest</Text>
            </View>
            <Text className="text-[13px] font-semibold text-mint">{focusLoans.length} active</Text>
          </View>

          {focusLoans.length > 0 ? (
            focusLoans.map((loan, index) => (
              <Animated.View
                key={loan.id}
                entering={FadeInUp.delay(140 + index * 70).duration(420).springify()}
              >
                <LoanFocusCard
                  borrowerName={loan.borrowerName}
                  amountDue={formatCurrency(loan.amountDue)}
                  countdownText={getCountdownText(loan)}
                  dueDate={loan.dueDate}
                  paymentCycle={loan.paymentCycle}
                  urgency={loan.urgency}
                />
              </Animated.View>
            ))
          ) : (
            <View className="items-center justify-center rounded-[28px] border border-mint/20 bg-surface/80 p-8">
              <Text className="text-lg font-semibold text-white">All clear</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-muted">
                No loans need attention in the next 7 days.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
