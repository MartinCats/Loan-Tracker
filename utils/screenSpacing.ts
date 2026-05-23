export const screenSpacing = {
  horizontal: 20,
  topOffset: 16,
  tabBottom: 104,
  detailBottom: 48
};

export function getTabScreenInsets(insets: { top: number; bottom: number }) {
  return {
    paddingTop: insets.top + screenSpacing.topOffset,
    paddingBottom: insets.bottom + screenSpacing.tabBottom
  };
}

export function getDetailScreenInsets(insets: { top: number; bottom: number }) {
  return {
    paddingTop: insets.top + screenSpacing.topOffset,
    paddingBottom: insets.bottom + screenSpacing.detailBottom
  };
}
