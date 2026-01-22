import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { loginRequestValidator } from "./twitter";

// Action to login to Twitter via external API
export const loginToTwitter = action({
  args: {
    sessionName: v.string(),
    username: v.string(),
    email: v.string(),
    password: v.string(),
    proxy: v.string(),
    totp_secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.TWITTER_API_KEY;
    if (!apiKey) {
      throw new Error("TWITTER_API_KEY environment variable is not set");
    }

    const requestBody: Record<string, string> = {
      username: args.username,
      email: args.email,
      password: args.password,
      proxy: args.proxy,
    };

    if (args.totp_secret) {
      requestBody.totp_secret = args.totp_secret;
    }

    const response = await fetch("https://api.twitterapi.io/twitter/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter login failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.login_cookies) {
      throw new Error("Login succeeded but no cookies returned");
    }

    // Store the session
    await ctx.runMutation(internal.twitterAuth.storeSession, {
      sessionName: args.sessionName,
      loginCookie: result.login_cookies,
      proxy: args.proxy,
      username: args.username,
      email: args.email,
    });

    return {
      success: true,
      message: `Session "${args.sessionName}" created successfully`,
    };
  },
});

// Internal mutation to store login session
export const storeSession = internalMutation({
  args: {
    sessionName: v.string(),
    loginCookie: v.string(),
    proxy: v.optional(v.string()),
    username: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("twitterSessions", {
      sessionName: args.sessionName,
      loginCookie: args.loginCookie,
      proxy: args.proxy,
      username: args.username,
      email: args.email,
      createdAt: now,
      lastUsedAt: now,
      isActive: true,
    });
  },
});

// Query to list sessions (without exposing cookies)
export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("twitterSessions")
      .collect();

    return sessions.map((session) => ({
      _id: session._id,
      sessionName: session.sessionName,
      username: session.username,
      email: session.email,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      isActive: session.isActive,
      hasProxy: !!session.proxy,
    }));
  },
});

// Internal query to get session with cookie for internal use
export const getSessionWithCookie = internalQuery({
  args: {
    sessionId: v.id("twitterSessions"),
  },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});

// Get an active session for sending tweets
export const getActiveSession = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("twitterSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});

// Mutation to deactivate a session
export const deactivateSession = mutation({
  args: {
    sessionId: v.id("twitterSessions"),
  },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { isActive: false });
    return { success: true };
  },
});

// Mutation to activate a session
export const activateSession = mutation({
  args: {
    sessionId: v.id("twitterSessions"),
  },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { isActive: true });
    return { success: true };
  },
});

// Internal mutation to update last used timestamp
export const updateSessionLastUsed = internalMutation({
  args: {
    sessionId: v.id("twitterSessions"),
  },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { lastUsedAt: Date.now() });
  },
});
