// ~/pages/api/authenticate.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
import { validateEvent } from "nostr-tools";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  interface reqBody {
    signedEvent: string;
  }
  try {
    const { signedEvent } = req.body as reqBody;
    const rawEvent = JSON.parse(
      Buffer.from(signedEvent, "base64").toString("utf-8")
    ) as NDKEvent;

    if (!rawEvent) {
      return res.status(400).json({ error: "failed to parse event" });
    }

    if (rawEvent.kind !== 27235) {
      return res.status(400).json({ error: "Invalid event kind" });
    }
    const ourUrl = `https://${
      process.env.AUTH_URL ?? "localhost:3000"
    }/api/authenticate`;
    const goodTags = [
      ["u", ourUrl],
      ["method", "GET"],
    ];
    const tagsMatch = goodTags.every((tag) =>
      rawEvent.tags.some(
        (rawTag) => rawTag[0] === tag[0] && rawTag[1] === tag[1]
      )
    );
    if (!tagsMatch) {
      return res.status(400).json({ error: "Invalid event tags" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(rawEvent.created_at! - now) > 60) {
      return res.status(400).json({ error: "Event timestamp too old" });
    }

    const isGood = validateEvent(rawEvent);
    if (isGood) {
      const token = jwt.sign({ pubkey: rawEvent.pubkey }, JWT_SECRET, {
        expiresIn: "2h",
      });
      return res.status(200).json({ token });
    }
    return res.status(400).json({ error: "Unknown" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
