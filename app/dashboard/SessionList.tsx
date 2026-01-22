"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function SessionList() {
  const sessions = useQuery(api.twitterAuth.listSessions);
  const deactivateSession = useMutation(api.twitterAuth.deactivateSession);
  const activateSession = useMutation(api.twitterAuth.activateSession);

  const handleToggleSession = async (sessionId: Id<"twitterSessions">, isActive: boolean) => {
    if (isActive) {
      await deactivateSession({ sessionId });
    } else {
      await activateSession({ sessionId });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (sessions === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 dark:border-slate-300"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-600 dark:text-slate-400">
        No sessions found. Create a new session in the Login tab.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
        Twitter Sessions
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-300 dark:border-slate-600">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                Session Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                Username
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                Created
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                Last Used
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr
                key={session._id}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                  {session.sessionName}
                </td>
                <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                  @{session.username}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(session.createdAt)}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(session.lastUsedAt)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      session.isActive
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1 ${
                        session.isActive ? "bg-green-500" : "bg-slate-400"
                      }`}
                    ></span>
                    {session.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleToggleSession(session._id, session.isActive)}
                    className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                      session.isActive
                        ? "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                        : "text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900"
                    }`}
                  >
                    {session.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
