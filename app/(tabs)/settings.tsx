import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLoanStore } from "@/store/loanStore";
import { getReadableErrorMessage } from "@/utils/readableError";
import { registerTabScrollHandler } from "@/utils/tabScrollRegistry";

type ExportType = "json" | "csv";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    exportBackupCsv,
    exportBackupJson
  } = useLoanStore();
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<ExportType | null>(null);

  useEffect(() => {
    return registerTabScrollHandler("settings", () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  async function exportData(type: ExportType) {
    if (exportingType) {
      return;
    }

    try {
      setExportingType(type);
      setExportError(null);
      setExportStatus(null);
      const result = type === "json"
        ? await exportBackupJson()
        : await exportBackupCsv();

      setExportStatus(`${result.fileName} is ready to share.`);
    } catch (error) {
      setExportError(getReadableErrorMessage(error, "Data could not be exported. Please try again."));
    } finally {
      setExportingType(null);
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
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 104
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(360)}>
          <View className="gap-3">
            <View className="self-start rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-cyan">
                Settings
              </Text>
            </View>
            <View className="gap-1.5">
              <Text className="text-[40px] font-semibold leading-[46px] text-white">Preferences</Text>
              <Text className="text-[15px] leading-6 text-muted">
                App info and local device backup.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(360)}>
          <SettingsSection title="App">
            <InfoRow
              icon="phone-portrait-outline"
              label="Haptics"
              value="Enabled where supported"
            />
            <InfoRow
              icon="cash-outline"
              label="Currency display"
              value="THB default"
            />
            <InfoRow
              icon="moon-outline"
              label="Appearance"
              value="Dark mode only"
            />
          </SettingsSection>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(110).duration(360)}>
          <SettingsSection
            title="Data"
            description="Your loans are stored locally on this device. Export a backup before changing devices or reinstalling."
          >
            <ExportButton
              description="Full backup with active loans, archived loans, and payment histories."
              disabled={exportingType !== null}
              icon="document-text-outline"
              isLoading={exportingType === "json"}
              label="Export data as JSON"
              onPress={() => exportData("json")}
            />
            <ExportButton
              description="Simple loans summary for spreadsheets."
              disabled={exportingType !== null}
              icon="grid-outline"
              isLoading={exportingType === "csv"}
              label="Export loans as CSV"
              onPress={() => exportData("csv")}
            />
            <View className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[13px] font-semibold text-muted">Restore backup</Text>
              <Text className="mt-1 text-[13px] leading-5 text-mutedSoft">
                Import and restore will be added in a later phase.
              </Text>
            </View>
            {exportStatus ? <Text className="text-[13px] leading-5 text-mint">{exportStatus}</Text> : null}
            {exportError ? <Text className="text-[13px] leading-5 text-danger">{exportError}</Text> : null}
          </SettingsSection>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(360)}>
          <SettingsSection title="About">
            <InfoRow
              icon="wallet-outline"
              label="App"
              value="Loan Tracker"
            />
            <InfoRow
              icon="pricetag-outline"
              label="Version"
              value="1.0.0"
            />
            <InfoRow
              icon="cloud-offline-outline"
              label="Storage"
              value="Offline-first"
            />
            <InfoRow
              icon="server-outline"
              label="Database"
              value="Local SQLite"
            />
          </SettingsSection>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SettingsSection({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-[22px] font-semibold text-white">{title}</Text>
        {description ? <Text className="text-[13px] leading-5 text-muted">{description}</Text> : null}
      </View>
      <View className="gap-3 rounded-[26px] border border-white/10 bg-surface/90 p-4 shadow-lg shadow-black/15">
        {children}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-[18px] bg-white/5 p-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
        <Ionicons color="#8EE6C1" name={icon} size={18} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] text-muted">{label}</Text>
        <Text numberOfLines={1} className="mt-0.5 text-[15px] font-semibold text-white">
          {value}
        </Text>
      </View>
    </View>
  );
}

function ExportButton({
  description,
  disabled,
  icon,
  isLoading,
  label,
  onPress
}: {
  description: string;
  disabled: boolean;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  isLoading: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-[20px] border p-4 ${
        disabled ? "border-white/10 bg-white/5 opacity-70" : "border-mint/20 bg-mint/10 active:opacity-80"
      }`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-white/5">
        <Ionicons color="#8EE6C1" name={icon} size={20} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold text-white">
          {isLoading ? "Preparing..." : label}
        </Text>
        <Text className="mt-1 text-[12px] leading-5 text-muted">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
