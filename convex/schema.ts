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
  })
    .index("by_tweet_id", ["tweetId"])
    .index("by_rule_id", ["ruleId"]),
});
