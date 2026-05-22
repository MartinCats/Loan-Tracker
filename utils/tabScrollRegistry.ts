type ScrollToTopHandler = () => void;

const scrollHandlers = new Map<string, ScrollToTopHandler>();

export function registerTabScrollHandler(tabName: string, handler: ScrollToTopHandler) {
  scrollHandlers.set(tabName, handler);

  return () => {
    scrollHandlers.delete(tabName);
  };
}

export function scrollTabToTop(tabName: string) {
  scrollHandlers.get(tabName)?.();
}
