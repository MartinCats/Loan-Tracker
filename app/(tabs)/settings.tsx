import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/ui/PressableScale";
import { t } from "@/services/i18n";
import { useLoanStore } from "@/store/loanStore";
import { useSettingsStore } from "@/store/settingsStore";
import { impactLight, notifyError, notifySuccess } from "@/utils/haptics";
import { getReadableErrorMessage } from "@/utils/readableError";
import { getTabScreenInsets } from "@/utils/screenSpacing";
import { registerTabScrollHandler } from "@/utils/tabScrollRegistry";

type ExportType = "json" | "csv";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    exportBackupCsv,
    exportBackupJson
  } = useLoanStore();
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
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

      notifySuccess();
      setExportStatus(t("settings.exportReady", { fileName: result.fileName }));
    } catch (error) {
      notifyError();
      setExportError(getReadableErrorMessage(error, t("settings.exportError")));
    } finally {
      setExportingType(null);
    }
  }

  async function changeLanguage(nextLanguage: "en" | "th") {
    if (nextLanguage === language) {
      return;
    }

    impactLight();
    await setLanguage(nextLanguage);
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
          ...getTabScreenInsets(insets)
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(360)}>
          <View className="gap-3">
            <View className="self-start rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-cyan">
                {t("common.settings")}
              </Text>
            </View>
            <View className="gap-1.5">
              <Text className="text-[40px] font-semibold leading-[46px] text-white">{t("settings.title")}</Text>
              <Text className="text-[15px] leading-6 text-muted">
                {t("settings.subtitle")}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(360)}>
          <SettingsSection title={t("settings.app")}>
            <InfoRow
              icon="phone-portrait-outline"
              label={t("settings.haptics")}
              value={t("settings.hapticsValue")}
            />
            <InfoRow
              icon="cash-outline"
              label={t("settings.currencyDisplay")}
              value={t("settings.currencyValue")}
            />
            <InfoRow
              icon="moon-outline"
              label={t("settings.appearance")}
              value={t("settings.appearanceValue")}
            />
            <View className="gap-2 rounded-[18px] bg-white/5 p-3">
              <Text className="text-[13px] text-muted">{t("settings.language")}</Text>
              <View className="flex-row gap-2">
                <LanguageButton label={t("settings.languageEnglish")} selected={language === "en"} onPress={() => changeLanguage("en")} />
                <LanguageButton label={t("settings.languageThai")} selected={language === "th"} onPress={() => changeLanguage("th")} />
              </View>
            </View>
          </SettingsSection>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(110).duration(360)}>
          <SettingsSection
            title={t("settings.data")}
            description={t("settings.dataDescription")}
          >
            <ExportButton
              description={t("settings.exportJsonDescription")}
              disabled={exportingType !== null}
              icon="document-text-outline"
              isLoading={exportingType === "json"}
              label={t("settings.exportJson")}
              onPress={() => exportData("json")}
            />
            <ExportButton
              description={t("settings.exportCsvDescription")}
              disabled={exportingType !== null}
              icon="grid-outline"
              isLoading={exportingType === "csv"}
              label={t("settings.exportCsv")}
              onPress={() => exportData("csv")}
            />
            <View className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[13px] font-semibold text-muted">{t("settings.restoreBackup")}</Text>
              <Text className="mt-1 text-[13px] leading-5 text-mutedSoft">
                {t("settings.restoreBackupDescription")}
              </Text>
            </View>
            {exportStatus ? <Text className="text-[13px] leading-5 text-mint">{exportStatus}</Text> : null}
            {exportError ? <Text className="text-[13px] leading-5 text-danger">{exportError}</Text> : null}
          </SettingsSection>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(360)}>
          <SettingsSection title={t("settings.about")}>
            <InfoRow
              icon="wallet-outline"
              label={t("settings.app")}
              value={t("common.appName")}
            />
            <InfoRow
              icon="pricetag-outline"
              label={t("settings.version")}
              value="1.0.0"
            />
            <InfoRow
              icon="cloud-offline-outline"
              label={t("settings.storage")}
              value={t("settings.storageValue")}
            />
            <InfoRow
              icon="server-outline"
              label={t("settings.database")}
              value={t("settings.databaseValue")}
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
    <PressableScale
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        impactLight();
        onPress();
      }}
      className={`flex-row items-center gap-3 rounded-[20px] border p-4 ${
        disabled ? "border-white/10 bg-white/5 opacity-70" : "border-mint/20 bg-mint/10 active:opacity-80"
      }`}
      contentClassName="flex-row items-center gap-3"
      scaleTo={0.985}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-white/5">
        <Ionicons color="#8EE6C1" name={icon} size={20} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold text-white">
          {isLoading ? t("settings.preparing") : label}
        </Text>
        <Text className="mt-1 text-[12px] leading-5 text-muted">
          {description}
        </Text>
      </View>
      {isLoading ? <ActivityIndicator color="#8EE6C1" size="small" /> : null}
    </PressableScale>
  );
}

function LanguageButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`flex-1 rounded-[15px] border px-3 py-3 ${
        selected ? "border-mint bg-mint" : "border-white/10 bg-white/5"
      }`}
      scaleTo={0.97}
    >
      <Text className={`text-center text-[13px] font-semibold ${selected ? "text-background" : "text-muted"}`}>
        {label}
      </Text>
    </PressableScale>
  );
}
