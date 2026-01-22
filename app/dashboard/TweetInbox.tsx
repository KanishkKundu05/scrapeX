"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type StatusFilter = "all" | "pending" | "routed" | "responded" | "skipped";

export default function TweetInbox() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sendingId, setSendingId] = useState<Id<"tweetResponses"> | null>(null);
  const [composeText, setComposeText] = useState<Record<string, string>>({});

  const tweets = useQuery(api.routing.getTweetsWithRouting, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const sessions = useQuery(api.twitterAuth.listSessions);
  const sendResponse = useAction(api.twitterActions.sendResponse);
  const createManualResponse = useMutation(api.twitterActions.createManualResponse);

  const activeSessions = sessions?.filter((s) => s.isActive) || [];

  const handleSendResponse = async (responseId: Id<"tweetResponses">) => {
    if (activeSessions.length === 0) {
      alert("No active session found. Please create and activate a session first.");
      return;
    }

    setSendingId(responseId);
    try {
      await sendResponse({
        responseId,
        sessionId: activeSessions[0]._id,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send response");
    } finally {
      setSendingId(null);
    }
  };

  const handleCreateResponse = async (tweetId: string) => {
    const text = composeText[tweetId];
    if (!text?.trim()) {
      alert("Please enter a response");
      return;
    }

    await createManualResponse({
      originalTweetId: tweetId,
      responseText: text,
    });

    setComposeText((prev) => ({ ...prev, [tweetId]: "" }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string | undefined) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      routed: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      responded: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      skipped: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
    };

    return (
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
          styles[status || "pending"] || styles.pending
        }`}
      >
        {status || "pending"}
      </span>
    );
  };

  if (tweets === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 dark:border-slate-300"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Tweet Inbox
        </h2>
        <div className="flex gap-2">
          {(["all", "pending", "routed", "responded", "skipped"] as StatusFilter[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {activeSessions.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg">
          No active session available. Please create a session in the Login tab to send responses.
        </div>
      )}

      {tweets.length === 0 ? (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          No tweets found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
        </div>
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <div
              key={tweet._id}
              className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {tweet.authorName}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    @{tweet.authorUsername}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(tweet.routingStatus)}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(tweet.tweetCreatedAt)}
                  </span>
                </div>
              </div>

              <p className="text-slate-800 dark:text-slate-200 mb-3">{tweet.text}</p>

              {tweet.matchedRule && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Matched Rule: {tweet.matchedRule.name}
                  </span>
                </div>
              )}

              {tweet.pendingResponse && (
                <div className="mt-3 p-3 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Suggested Response
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        tweet.pendingResponse.status === "sent"
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : tweet.pendingResponse.status === "failed"
                          ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      {tweet.pendingResponse.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {tweet.pendingResponse.text}
                  </p>
                  {tweet.pendingResponse.status === "pending" && (
                    <button
                      onClick={() => handleSendResponse(tweet.pendingResponse!._id)}
                      disabled={sendingId === tweet.pendingResponse._id || activeSessions.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-3 py-1 rounded transition-colors"
                    >
                      {sendingId === tweet.pendingResponse._id ? "Sending..." : "Send Response"}
                    </button>
                  )}
                </div>
              )}

              {!tweet.pendingResponse && tweet.routingStatus !== "responded" && (
                <div className="mt-3 p-3 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                    Compose Response
                  </label>
                  <textarea
                    value={composeText[tweet.tweetId] || ""}
                    onChange={(e) =>
                      setComposeText((prev) => ({
                        ...prev,
                        [tweet.tweetId]: e.target.value,
                      }))
                    }
                    placeholder="Type your response..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm mb-2"
                  />
                  <button
                    onClick={() => handleCreateResponse(tweet.tweetId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded transition-colors"
                  >
                    Queue Response
                  </button>
                </div>
              )}

              <div className="mt-3 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Replies: {tweet.replyCount}</span>
                <span>Likes: {tweet.likeCount}</span>
                <span>Retweets: {tweet.retweetCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
