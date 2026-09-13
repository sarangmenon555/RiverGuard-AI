"""
Web Push notifications for "Follow my district".

Uses the standard, free, keyless Web Push protocol (VAPID). This does not
require registering with any third-party push service or API — VAPID keys
are a self-generated cryptographic keypair specific to this deployment.
Run `python generate_vapid_keys.py` once and put the resulting keys in
your environment before enabling push in production.

Subscriptions are stored in a local JSON file for simplicity. For a real
production deployment, replace this with a proper database table.
"""

import json
import os
from pathlib import Path

from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS_EMAIL = os.environ.get("VAPID_CONTACT_EMAIL", "mailto:admin@example.com")

SUBSCRIPTIONS_FILE = Path(__file__).parent / "subscriptions.json"


def _load_subscriptions() -> list:
    if not SUBSCRIPTIONS_FILE.exists():
        return []
    try:
        return json.loads(SUBSCRIPTIONS_FILE.read_text())
    except (json.JSONDecodeError, OSError):
        return []


def _save_subscriptions(subs: list) -> None:
    SUBSCRIPTIONS_FILE.write_text(json.dumps(subs, indent=2))


def add_subscription(subscription_info: dict, district_ids: list) -> None:
    subs = _load_subscriptions()
    endpoint = subscription_info.get("endpoint")
    subs = [s for s in subs if s["subscription"].get("endpoint") != endpoint]
    subs.append(
        {
            "subscription": subscription_info,
            "district_ids": district_ids,
            "last_notified": {},
        }
    )
    _save_subscriptions(subs)


def remove_subscription(endpoint: str) -> None:
    subs = _load_subscriptions()
    subs = [s for s in subs if s["subscription"].get("endpoint") != endpoint]
    _save_subscriptions(subs)


def is_configured() -> bool:
    return bool(VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY)


def send_notification(subscription_info: dict, title: str, body: str) -> bool:
    if not is_configured():
        return False
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": body}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CLAIMS_EMAIL},
        )
        return True
    except WebPushException:
        return False


def check_and_notify(predictions_by_district: dict) -> dict:
    """
    Compares each subscription's followed districts against current
    predictions. Sends a push notification the first time a followed
    district enters Medium or High risk, and again if it escalates from
    Medium to High. Does not re-notify for an unchanged risk level.
    Returns a summary of how many notifications were sent.
    """
    if not is_configured():
        return {"sent": 0, "configured": False}

    subs = _load_subscriptions()
    sent = 0

    for sub in subs:
        for district_id in sub["district_ids"]:
            pred = predictions_by_district.get(district_id)
            if not pred:
                continue
            risk = pred["risk_class"]
            last = sub["last_notified"].get(district_id)

            should_notify = risk in ("Medium", "High") and risk != last
            if should_notify:
                ok = send_notification(
                    sub["subscription"],
                    title=f"RiverGuard AI: {pred['district_name']}",
                    body=f"{pred['district_name']} has moved to {risk} flood risk.",
                )
                if ok:
                    sent += 1
                    sub["last_notified"][district_id] = risk
            elif risk == "Low" and last is not None:
                sub["last_notified"][district_id] = "Low"

    _save_subscriptions(subs)
    return {"sent": sent, "configured": True}
