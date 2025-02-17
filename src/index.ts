import { Hono, Context } from "hono";

interface Env {
  WEBHOOK_VERIFY_TOKEN: string;
  GRAPH_API_TOKEN: string;
  OPENAI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.text("Hello Hono on Cloudlfare!");
});

app.get("/webhook", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  const verifyToken = c.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    c.status(200);
    return c.text(challenge);
  }
  c.status(403);
  return c.text("Invalid request");
});
app.post("/webhook", async (c) => {
  const fbToken = c.env.GRAPH_API_TOKEN;
  const openAIToken = c.env.OPENAI_API_KEY;

  const body = await c.req.json();

  const message = body.entry?.[0]?.changes[0]?.value.messages?.[0];

  if (message?.type === "text") {
    const business_phone_number_id =
      body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

    const url = `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`;

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${fbToken}`);
    myHeaders.append("Content-Type", "application/json");

    await fetch(url, {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.from,
        text: { body: message.text.body },
        context: {
          message_id: message.id,
        },
      }),
    });
  }
  c.status(200);
  return c.text("ok");
});

export default app;
