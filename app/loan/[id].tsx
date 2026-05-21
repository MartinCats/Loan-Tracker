import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { LoanHeroCard } from "@/components/loan/LoanHeroCard";
import { LoanOverviewCard } from "@/components/loan/LoanOverviewCard";
import { QuickActionButton } from "@/components/loan/QuickActionButton";
import { TimelineEventItem } from "@/components/loan/TimelineEventItem";

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

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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
            borrowerName={mockLoanDetail.borrowerName}
            amountDue={formatCurrency(mockLoanDetail.amountDue)}
            statusText={mockLoanDetail.statusText}
            nextDueDate={mockLoanDetail.nextDueDate}
            paymentCycle={mockLoanDetail.paymentCycle}
            urgency={mockLoanDetail.urgency}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(110).duration(380)}>
          <LoanOverviewCard
            title="Loan overview"
            rows={[
              { label: "Principal", value: formatCurrency(mockLoanDetail.principal) },
              { label: "Interest rate", value: mockLoanDetail.interestRate, tone: "gold" },
              { label: "Payment cycle", value: mockLoanDetail.paymentCycle },
              {
                label: "Unpaid interest",
                value: formatCurrency(mockLoanDetail.unpaidInterest),
                tone: "danger"
              },
              {
                label: "Credit balance",
                value: formatCurrency(mockLoanDetail.creditBalance),
                tone: "cyan"
              },
              {
                label: "Accumulated profit",
                value: formatCurrency(mockLoanDetail.accumulatedProfit),
                tone: "mint"
              }
            ]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(380)} className="gap-4">
          <View className="flex-row items-end justify-between">
            <View className="gap-1">
              <Text className="text-[24px] font-semibold text-white">Timeline</Text>
              <Text className="text-[13px] text-muted">Recent mock activity</Text>
            </View>
            <Text className="text-[13px] font-semibold text-mutedSoft">Preview</Text>
          </View>

          <View className="gap-3">
            {mockTimeline.map((event, index) => (
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
            <Text className="text-[13px] text-muted">Mock controls only</Text>
          </View>

          <View className="flex-row gap-3">
            <QuickActionButton label="Receive Interest" icon="cash-outline" tone="primary" />
            <QuickActionButton label="Reschedule" icon="calendar-outline" tone="neutral" />
            <QuickActionButton label="Close Loan" icon="lock-closed-outline" tone="danger" />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
