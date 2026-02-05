import { initThemeMode } from "flowbite-react";
import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    initThemeMode();
  }, []);

  return null;
}
