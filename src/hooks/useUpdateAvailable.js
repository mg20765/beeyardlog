import { useEffect, useState } from "react";
import { checkForUpdate, currentAsset } from "../utils/appVersion.js";

const CHECK_EVERY_MS = 10 * 60 * 1000;

// True once a newer version of the app has been put online. It looks when the
// app is switched back to, when the phone gets signal again, and every ten
// minutes while it stays open. Only in the real app: the development server
// always serves the newest code anyway.
export default function useUpdateAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || available) return undefined;
    const current = currentAsset();
    const look = async () => {
      if (await checkForUpdate((...args) => fetch(...args), current)) {
        setAvailable(true);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") look();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", look);
    const timer = setInterval(look, CHECK_EVERY_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", look);
      clearInterval(timer);
    };
  }, [available]);

  return available;
}
