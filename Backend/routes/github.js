import { Router } from "express";
import crypto from "crypto";

const router = Router();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const callbackUrl = process.env.GITHUB_CALLBACK_URL || "http://localhost:8080/api/github/callback";

const githubCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

router.get("/login", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "GitHub OAuth is not configured" });
  }

  const state = crypto.randomBytes(24).toString("hex");
  res.cookie("github_oauth_state", state, {
    ...githubCookieOptions,
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: "repo",
    state,
  });

  return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.cookies.github_oauth_state) {
    return res.status(400).send("Invalid GitHub OAuth callback");
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl,
      }),
    });
    const data = await response.json();

    if (!response.ok || !data.access_token) {
      return res.status(502).send(data.error_description || "GitHub authorization failed");
    }

    res.clearCookie("github_oauth_state");
    res.cookie("github_access_token", data.access_token, githubCookieOptions);
    return res.redirect(process.env.GITHUB_FRONTEND_REDIRECT_URL || `${frontendUrl}/?github_connected=1`);
  } catch (error) {
    console.error("GitHub OAuth callback failed:", error);
    return res.status(502).send("Unable to complete GitHub authorization");
  }
});

router.get("/status", (req, res) => {
  res.json({ connected: Boolean(req.cookies.github_access_token) });
});

export default router;