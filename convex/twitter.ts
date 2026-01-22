import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Login API validator
export const loginRequestValidator = v.object({
  username: v.string(),
  email: v.string(),
  password: v.string(),
  proxy: v.string(),
  totp_secret: v.optional(v.string()),
});

// Create Tweet API validator
export const createTweetRequestValidator = v.object({
  login_cookies: v.string(),
  tweet_text: v.string(),
  proxy: v.string(),
  reply_to_tweet_id: v.optional(v.string()),
});

// Routing rule validator
export const routingRuleValidator = v.object({
  name: v.string(),
  keywords: v.array(v.string()),
  priority: v.number(),
  responseTemplate: v.string(),
  isActive: v.boolean(),
});

// Validator for tweet author
const tweetAuthorValidator = v.object({
  id: v.string(),
  userName: v.string(),
  name: v.string(),
});

// Validator for individual tweet
const tweetValidator = v.object({
  id: v.string(),
  text: v.string(),
  author: tweetAuthorValidator,
  created_at: v.string(),
  retweet_count: v.number(),
  like_count: v.number(),
  reply_count: v.number(),
});

// Validator for the full webhook payload
export const webhookPayloadValidator = v.object({
  event_type: v.string(),
  rule_id: v.string(),
  rule_tag: v.string(),
  tweets: v.array(tweetValidator),
  timestamp: v.number(),
});

// Internal mutation to store tweets with deduplication
export const storeTweets = internalMutation({
  args: {
    payload: webhookPayloadValidator,
  },
  handler: async (ctx, { payload }) => {
    const { event_type, rule_id, rule_tag, tweets, timestamp } = payload;
    let insertedCount = 0;
    let skippedCount = 0;
    const insertedTweetIds: Id<"tweets">[] = [];

    for (const tweet of tweets) {
      // Check for existing tweet by tweetId
      const existing = await ctx.db
        .query("tweets")
        .withIndex("by_tweet_id", (q) => q.eq("tweetId", tweet.id))
        .first();

      if (existing) {
        skippedCount++;
        continue;
      }

      // Insert normalized tweet data with pending routing status
      const insertedId = await ctx.db.insert("tweets", {
        tweetId: tweet.id,
        text: tweet.text,
        authorId: tweet.author.id,
        authorUsername: tweet.author.userName,
        authorName: tweet.author.name,
        tweetCreatedAt: tweet.created_at,
        retweetCount: tweet.retweet_count,
        likeCount: tweet.like_count,
        replyCount: tweet.reply_count,
        eventType: event_type,
        ruleId: rule_id,
        ruleTag: rule_tag,
        webhookTimestamp: timestamp,
        rawPayload: tweet,
        routingStatus: "pending",
      });

      insertedTweetIds.push(insertedId);
      insertedCount++;
    }

    return { insertedCount, skippedCount, insertedTweetIds };
  },
});

// Query to fetch tweets by rule_id
export const getTweetsByRule = query({
  args: {
    ruleId: v.string(),
  },
  handler: async (ctx, { ruleId }) => {
    return await ctx.db
      .query("tweets")
      .withIndex("by_rule_id", (q) => q.eq("ruleId", ruleId))
      .collect();
  },
});
