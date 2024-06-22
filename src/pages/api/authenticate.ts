// ~/pages/api/authenticate.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
import { validateEvent } from "nostr-tools";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // Use an environment variable for the secret

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { signedEvent } = req.body;
    const rawEvent = JSON.parse(
      Buffer.from(signedEvent, "base64").toString("utf-8")
    ) as NDKEvent;

    if (!rawEvent) {
      return res.status(400).json({ error: "failed to parse event" });
    }

    // Verify the event (example verification, customize as per your needs)
    if (rawEvent.kind !== 27235) {
      return res.status(400).json({ error: "Invalid event kind" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(rawEvent.created_at! - now) > 60) {
      return res.status(400).json({ error: "Event timestamp too old" });
    }

    console.log("api/auth rawevent: ", rawEvent);
    const isGood = validateEvent(rawEvent);
    console.log(isGood);

    if (isGood) {
      console.log("valid nip97");
      const token = jwt.sign({ pubkey: rawEvent.pubkey }, JWT_SECRET, {
        expiresIn: "2h",
      });
      return res.status(200).json({ token });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
