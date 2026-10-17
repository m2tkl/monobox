export type SearchOpenDestination = 'active-tab' | 'new-tab';

export type SearchLaunchOptions = {
  destination?: SearchOpenDestination;
};

let openSearchHandler: ((options: SearchLaunchOptions) => void) | null = null;

export function registerSearchLauncher(handler: (options: SearchLaunchOptions) => void) {
  openSearchHandler = handler;

  return () => {
    if (openSearchHandler === handler) {
      openSearchHandler = null;
    }
  };
}

export function openSearchLauncher(options: SearchLaunchOptions = {}) {
  openSearchHandler?.(options);
}
