import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Action to create a tweet via external API
export const createTweet = action({
  args: {
    sessionId: v.id("twitterSessions"),
    tweetText: v.string(),
    replyToTweetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.TWITTER_API_KEY;
    if (!apiKey) {
      throw new Error("TWITTER_API_KEY environment variable is not set");
    }

    // Get session with cookie
    const session = await ctx.runQuery(internal.twitterAuth.getSessionWithCookie, {
      sessionId: args.sessionId,
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.isActive) {
      throw new Error("Session is not active");
    }

    const requestBody: Record<string, string> = {
      login_cookies: session.loginCookie,
      tweet_text: args.tweetText,
      proxy: session.proxy || "",
    };

    if (args.replyToTweetId) {
      requestBody.reply_to_tweet_id = args.replyToTweetId;
    }

    const response = await fetch("https://api.twitterapi.io/twitter/tweet/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tweet creation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Update session last used timestamp
    await ctx.runMutation(internal.twitterAuth.updateSessionLastUsed, {
      sessionId: args.sessionId,
    });

    return {
      success: true,
      tweetId: result.tweet_id || result.id,
      message: "Tweet created successfully",
    };
  },
});

// Action to send a queued response
export const sendResponse = action({
  args: {
    responseId: v.id("tweetResponses"),
    sessionId: v.optional(v.id("twitterSessions")),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.TWITTER_API_KEY;
    if (!apiKey) {
      throw new Error("TWITTER_API_KEY environment variable is not set");
    }

    // Get the response
    const response = await ctx.runQuery(internal.twitterActions.getResponse, {
      responseId: args.responseId,
    });

    if (!response) {
      throw new Error("Response not found");
    }

    if (response.status === "sent") {
      throw new Error("Response has already been sent");
    }

    // Get session - use provided or find an active one
    let session;
    if (args.sessionId) {
      session = await ctx.runQuery(internal.twitterAuth.getSessionWithCookie, {
        sessionId: args.sessionId,
      });
    } else {
      session = await ctx.runQuery(internal.twitterAuth.getActiveSession, {});
    }

    if (!session) {
      throw new Error("No active session found");
    }

    const requestBody: Record<string, string> = {
      login_cookies: session.loginCookie,
      tweet_text: response.responseText,
      proxy: session.proxy || "",
      reply_to_tweet_id: response.originalTweetId,
    };

    try {
      const apiResponse = await fetch("https://api.twitterapi.io/twitter/tweet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        await ctx.runMutation(internal.twitterActions.updateResponseStatus, {
          responseId: args.responseId,
          status: "failed",
          errorMessage: `API error: ${apiResponse.status} - ${errorText}`,
        });
        throw new Error(`Tweet creation failed: ${apiResponse.status} - ${errorText}`);
      }

      const result = await apiResponse.json();
      const tweetId = result.tweet_id || result.id;

      // Update response status to sent
      await ctx.runMutation(internal.twitterActions.updateResponseStatus, {
        responseId: args.responseId,
        status: "sent",
        responseTweetId: tweetId,
        sessionId: session._id,
      });

      // Update session last used
      await ctx.runMutation(internal.twitterAuth.updateSessionLastUsed, {
        sessionId: session._id,
      });

      return {
        success: true,
        tweetId,
        message: "Response sent successfully",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.twitterActions.updateResponseStatus, {
        responseId: args.responseId,
        status: "failed",
        errorMessage,
      });
      throw error;
    }
  },
});

// Internal query to get a response
export const getResponse = internalQuery({
  args: {
    responseId: v.id("tweetResponses"),
  },
  handler: async (ctx, { responseId }) => {
    return await ctx.db.get(responseId);
  },
});

// Internal mutation to create a pending response
export const createPendingResponse = internalMutation({
  args: {
    originalTweetId: v.string(),
    routingRuleId: v.optional(v.id("routingRules")),
    responseText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tweetResponses", {
      originalTweetId: args.originalTweetId,
      routingRuleId: args.routingRuleId,
      responseText: args.responseText,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Internal mutation to update response status
export const updateResponseStatus = internalMutation({
  args: {
    responseId: v.id("tweetResponses"),
    status: v.string(),
    responseTweetId: v.optional(v.string()),
    sessionId: v.optional(v.id("twitterSessions")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.responseTweetId) {
      updates.responseTweetId = args.responseTweetId;
    }

    if (args.sessionId) {
      updates.sessionId = args.sessionId;
    }

    if (args.errorMessage) {
      updates.errorMessage = args.errorMessage;
    }

    if (args.status === "sent") {
      updates.sentAt = Date.now();
    }

    await ctx.db.patch(args.responseId, updates);
  },
});

// Query to list pending responses
export const listPendingResponses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tweetResponses")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Query to list all responses
export const listResponses = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, { status }) => {
    if (status) {
      return await ctx.db
        .query("tweetResponses")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    }
    return await ctx.db.query("tweetResponses").collect();
  },
});

// Mutation to manually create a response (for compose feature)
export const createManualResponse = mutation({
  args: {
    originalTweetId: v.string(),
    responseText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tweetResponses", {
      originalTweetId: args.originalTweetId,
      responseText: args.responseText,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});
