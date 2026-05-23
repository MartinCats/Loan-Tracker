import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLoanStore } from "@/store/loanStore";
import type { Loan } from "@/types/loan";
import { formatTimestampForDisplay } from "@/utils/dateOnly";
import { getReadableErrorText } from "@/utils/readableError";
import { registerTabScrollHandler } from "@/utils/tabScrollRegistry";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatClosedDate(date: string | null | undefined) {
  if (!date) {
    return "No close date";
  }

  return formatTimestampForDisplay(date);
}

export default function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    archivedLoans,
    error,
    isLoading,
    loadArchivedLoans
  } = useLoanStore();

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

  return (
    <View className="flex-1 bg-background">
      <View className="absolute left-0 right-0 top-0 h-72 bg-auraPurple opacity-25" />
      <View className="absolute left-0 right-0 bottom-0 h-72 bg-auraBlue opacity-10" />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="gap-6 px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 104
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(360)}>
          <View className="gap-3">
            <View className="self-start rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-cyan">
                Archive
              </Text>
            </View>
            <View className="gap-1.5">
              <Text className="text-[40px] font-semibold leading-[46px] text-white">Closed loans</Text>
              <Text className="text-[15px] leading-6 text-muted">
                {archivedLoans.length > 0
                  ? `${archivedLoans.length} closed borrower${archivedLoans.length === 1 ? "" : "s"}`
                  : "Loans you close will appear here"}
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
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/loan/${encodeURIComponent(loan.id)}`)}
                >
                  <ArchivedLoanCard loan={loan} />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeInUp.delay(90).duration(360)}>
            <View className="items-center justify-center rounded-[28px] border border-cyan/20 bg-surface/90 p-8 shadow-lg shadow-cyan/5">
              <Text className="text-[22px] font-semibold text-white">No closed loans yet</Text>
              <Text className="mt-2 text-center text-[14px] leading-6 text-muted">
                Close a loan from its detail screen to preserve it here.
              </Text>
              {error && !isLoading ? (
                <Text className="mt-4 text-center text-[13px] text-danger">
                  {getReadableErrorText(error, "Archive could not load. Please try again.")}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function ArchivedLoanCard({ loan }: { loan: Loan }) {
  return (
    <View className="overflow-hidden rounded-[24px] border border-white/10 bg-surface/90 p-5 shadow-lg shadow-black/20">
      <View className="absolute left-0 right-0 top-0 h-10 bg-cyan opacity-5" />
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-[18px] font-semibold leading-6 text-white">{loan.borrowerName}</Text>
          <Text className="text-[13px] text-mutedSoft">Closed {formatClosedDate(loan.closedAt)}</Text>
        </View>
        <View className="rounded-full border border-cyan/15 bg-cyan/10 px-3 py-1">
          <Text className="text-[12px] font-semibold text-cyan">Closed</Text>
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <ArchiveMetric label="Principal" value={formatCurrency(loan.principal)} />
        <ArchiveMetric label="Profit" value={formatCurrency(loan.accumulatedProfit)} />
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
