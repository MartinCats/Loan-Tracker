import * as Haptics from "expo-haptics";

export function impactLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(noop);
}

export function impactMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(noop);
}

export function notifySuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(noop);
}

export function notifyWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(noop);
}

export function notifyError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(noop);
}

function noop() {}
