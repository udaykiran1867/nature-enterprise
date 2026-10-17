import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** False during SSR/hydration so persisted cart content never causes a mismatch. */
export const useCartReady = () => useSyncExternalStore(subscribe, () => true, () => false);
