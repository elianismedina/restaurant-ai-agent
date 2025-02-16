import { Hono, Context } from "hono";

interface Env {
  WEBHOOK_VERIFY_TOKEN: string;
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

export default app;
