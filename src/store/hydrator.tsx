import { useEffect } from "react";
import { useVoltcare } from "@/store/voltcare";

let hydrated = false;

export function StoreHydrator() {
  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      void useVoltcare.persist.rehydrate();
    }
  }, []);
  return null;
}
