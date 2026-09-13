import { BACKEND_URL } from "./api";

const FOLLOWED_DISTRICTS_KEY = "riverguard-followed-districts";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getFollowedDistricts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLLOWED_DISTRICTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setFollowedDistricts(ids: string[]) {
  localStorage.setItem(FOLLOWED_DISTRICTS_KEY, JSON.stringify(ids));
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function followDistrict(districtId: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!isPushSupported()) {
    return { ok: false, reason: "Push notifications are not supported in this browser." };
  }

  const vapidRes = await fetch(`${BACKEND_URL}/push/vapid-public-key`);
  if (!vapidRes.ok) {
    return {
      ok: false,
      reason: "Push notifications are not configured on the server yet.",
    };
  }
  const { public_key } = await vapidRes.json();

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "Notification permission was not granted." };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key),
    });
  }

  const followed = Array.from(new Set([...getFollowedDistricts(), districtId]));
  setFollowedDistricts(followed);

  await fetch(`${BACKEND_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      district_ids: followed,
    }),
  });

  return { ok: true };
}

export function unfollowDistrict(districtId: string) {
  const followed = getFollowedDistricts().filter((id) => id !== districtId);
  setFollowedDistricts(followed);
  // Re-sync the reduced list with the backend on the existing subscription.
  if (isPushSupported()) {
    navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch(`${BACKEND_URL}/push/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            district_ids: followed,
          }),
        });
      }
    });
  }
}
