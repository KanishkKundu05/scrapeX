import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  tweets: defineTable({
    // Tweet identifiers
    tweetId: v.string(),
    text: v.string(),

    // Author info (flattened)
    authorId: v.string(),
    authorUsername: v.string(),
    authorName: v.string(),

    // Timestamps & metrics
    tweetCreatedAt: v.string(),
    retweetCount: v.number(),
    likeCount: v.number(),
    replyCount: v.number(),

    // Webhook metadata
    eventType: v.string(),
    ruleId: v.string(),
    ruleTag: v.string(),
    webhookTimestamp: v.number(),

    // Raw payload for debugging/future use
    rawPayload: v.any(),

    // Routing fields
    routingStatus: v.optional(v.string()), // "pending" | "routed" | "responded" | "skipped"
    matchedRuleId: v.optional(v.id("routingRules")),
  })
    .index("by_tweet_id", ["tweetId"])
    .index("by_rule_id", ["ruleId"])
    .index("by_routing_status", ["routingStatus"]),

  // Store Twitter login sessions
  twitterSessions: defineTable({
    sessionName: v.string(),
    loginCookie: v.string(),
    proxy: v.optional(v.string()),
    username: v.string(),
    email: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_username", ["username"])
    .index("by_active", ["isActive"]),

  // Keyword-based routing rules
  routingRules: defineTable({
    name: v.string(),
    keywords: v.array(v.string()),
    priority: v.number(),
    responseTemplate: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"]),

  // Track responses sent
  tweetResponses: defineTable({
    originalTweetId: v.string(),
    responseTweetId: v.optional(v.string()),
    routingRuleId: v.optional(v.id("routingRules")),
    sessionId: v.optional(v.id("twitterSessions")),
    responseText: v.string(),
    status: v.string(), // "pending" | "sent" | "failed"
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_original_tweet", ["originalTweetId"])
    .index("by_status", ["status"]),
});
