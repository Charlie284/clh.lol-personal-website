import { createContext } from "react";

// A lazy page's parent can hydrate before the page's own handlers are attached.
export const RouteReadinessContext = createContext<(() => void) | null>(null);
