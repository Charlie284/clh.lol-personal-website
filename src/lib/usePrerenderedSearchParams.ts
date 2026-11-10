import { useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";

const emptyParams = new URLSearchParams();
const subscribe = () => () => {};
const getServerSnapshot = () => emptyParams;

export function usePrerenderedSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Static HTML contains the unfiltered page. React Router supplies updates
  // after hydration, including immediate restoration on client navigation.
  const visibleParams = useSyncExternalStore(subscribe, () => searchParams, getServerSnapshot);
  // Keep controlled filters disabled until their URL state and handlers mount,
  // so input entered into static markup cannot be discarded by hydration.
  const filtersReady = visibleParams !== emptyParams;
  return [visibleParams, setSearchParams, filtersReady] as const;
}
