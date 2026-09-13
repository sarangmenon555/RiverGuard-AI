"""
Run this once to generate a VAPID keypair for Web Push notifications:

    python generate_vapid_keys.py

Put the printed values into your backend environment (.env or your host's
environment variable settings) before enabling push notifications:

    VAPID_PUBLIC_KEY=...
    VAPID_PRIVATE_KEY=...
    VAPID_CONTACT_EMAIL=mailto:you@example.com

The frontend fetches the public key live from the backend's
/push/vapid-public-key endpoint, so no separate frontend configuration is
needed. This is a one-time, self-generated cryptographic keypair — no
third-party account or API key is required.
"""

from py_vapid import Vapid02
import base64


def main():
    vapid = Vapid02()
    vapid.generate_keys()

    private_pem = vapid.private_pem().decode("utf-8")

    raw_public = vapid.public_key.public_bytes(
        encoding=__import__("cryptography.hazmat.primitives.serialization", fromlist=["Encoding"]).Encoding.X962,
        format=__import__("cryptography.hazmat.primitives.serialization", fromlist=["PublicFormat"]).PublicFormat.UncompressedPoint,
    )
    public_b64 = base64.urlsafe_b64encode(raw_public).rstrip(b"=").decode("utf-8")

    raw_private = vapid.private_key.private_numbers().private_value.to_bytes(32, "big")
    private_b64 = base64.urlsafe_b64encode(raw_private).rstrip(b"=").decode("utf-8")

    print("Add these to your backend environment:\n")
    print(f"VAPID_PUBLIC_KEY={public_b64}")
    print(f"VAPID_PRIVATE_KEY={private_b64}")
    print("VAPID_CONTACT_EMAIL=mailto:you@example.com")
    print(
        "\nThe frontend fetches the public key automatically from "
        "/push/vapid-public-key — no frontend configuration needed."
    )


if __name__ == "__main__":
    main()
