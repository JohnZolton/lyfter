import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { validateEvent } from "nostr-tools";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { encode } from "punycode";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(req.query);
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const decodedEvent = decodeURIComponent(req.query.event as string);
    console.log(decodedEvent);

    if (!decodedEvent || typeof decodedEvent !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid event parameter" });
    }

    const rawEvent = JSON.parse(decodedEvent) as NDKEvent;
    console.log(rawEvent);

    if (!rawEvent) {
      return res.status(400).json({ error: "Failed to parse event" });
    }

    if (rawEvent.kind !== 27235) {
      return res.status(400).json({ error: "Invalid event kind" });
    }
    const ourUrl = `https://www.liftr.club/api/authenticate`;
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

    const isGood = validateEvent(rawEvent);
    console.log("ITS GOOD");

    if (isGood) {
      const token = jwt.sign({ pubkey: rawEvent.pubkey }, JWT_SECRET, {
        expiresIn: "2h",
      });

      const html = `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Complete</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
            color: #333;
        }
        .container {
            text-align: center;
            padding: 20px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        p {
            font-size: 18px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Authentication Complete</h1>
        <p>You can now close this window and return to the app.</p>
    </div>

    <script>
        console.log('AMBER AUTH HIT');
        localStorage.setItem('authHeader', 'Bearer ${token}');
        localStorage.setItem('userNpub', '${rawEvent.pubkey}');
        window.close();
        setTimeout(() => {
            window.location.href = 'https://${
              process.env.AUTH_URL ?? "localhost:3000"
            }/home';
        }, 1000);
    </script>
</body>
</html>
      `;
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(html);
    } else {
      return res.status(400).json({ error: "Invalid event or signature" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
