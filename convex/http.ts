import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/twitter-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Parse JSON body
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Validate required fields
    const requiredFields = ["event_type", "rule_id", "rule_tag", "tweets", "timestamp"];
    for (const field of requiredFields) {
      if (!(field in payload)) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!Array.isArray(payload.tweets)) {
      return new Response(
        JSON.stringify({ error: "tweets must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Call internal mutation to store tweets
    try {
      const result = await ctx.runMutation(internal.twitter.storeTweets, {
        payload: {
          event_type: payload.event_type,
          rule_id: payload.rule_id,
          rule_tag: payload.rule_tag,
          tweets: payload.tweets,
          timestamp: payload.timestamp,
        },
      });

      // 4. Return success response with counts
      return new Response(
        JSON.stringify({
          success: true,
          inserted: result.insertedCount,
          skipped: result.skippedCount,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error storing tweets:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store tweets" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
