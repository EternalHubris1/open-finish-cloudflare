import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const VISUAL_EFFECTS_STORAGE_KEY = "open-finish:visual-effects";

type VisualEffectsContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

const VisualEffectsContext = createContext<VisualEffectsContextValue | null>(
  null,
);

export function VisualEffectsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    try {
      setEnabledState(
        window.localStorage.getItem(VISUAL_EFFECTS_STORAGE_KEY) !== "off",
      );
    } catch {
      // Visual effects remain enabled when local storage is unavailable.
    }
  }, []);

  const setEnabled = (nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    try {
      window.localStorage.setItem(
        VISUAL_EFFECTS_STORAGE_KEY,
        nextEnabled ? "on" : "off",
      );
    } catch {
      // The current session still reflects the user's preference.
    }
  };

  return (
    <VisualEffectsContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </VisualEffectsContext.Provider>
  );
}

export function useVisualEffects() {
  const value = useContext(VisualEffectsContext);
  if (!value) {
    throw new Error(
      "useVisualEffects must be used within VisualEffectsProvider",
    );
  }
  return value;
}
