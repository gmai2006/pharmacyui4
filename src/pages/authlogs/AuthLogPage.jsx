import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";

import init from "../../init";

export default function AuthLogPage() {
  const { appUser, token } = useUser();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");

    let url = `/${init.appName}/api/authlogs/recent?page=${page}&size=${size}`;

    if (username) {
      url = `/${init.appName}/api/authlogs/failures?username=${encodeURIComponent(
        username
      )}&page=${page}&size=${size}`;
    }

    if (start && end) {
      url = `/${init.appName}/api/authlogs/range?start=${encodeURIComponent(
        start
      )}&end=${encodeURIComponent(end)}&page=${page}&size=${size}`;
    }

    try {
      const resp = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Provided by Okta UI
        },
      });

      if (!resp.ok) {
        throw new Error("Failed to load logs");
      }

      setLogs(await resp.json());
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, size]);

  const statusBadge = (status) => {
    const base = "px-2 py-1 rounded text-xs font-semibold";
    return status === "success"
      ? `${base} bg-green-100 text-green-800`
      : `${base} bg-red-100 text-red-700`;
  };

  const eventBadge = (eventType) => {
    const base = "px-2 py-1 rounded text-xs font-semibold";
    return eventType === "login"
      ? `${base} bg-blue-100 text-blue-700`
      : `${base} bg-yellow-100 text-yellow-800`;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Authentication Audit Logs</h1>

      {/* Filters */}
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username (failed attempts)
            </label>
            <input
              className="mt-1 w-full border rounded p-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded p-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded p-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={() => fetchLogs()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {loading && (
        <div className="text-gray-600 text-center py-6">Loading logs...</div>
      )}

      {!loading && (
        <div className="overflow-x-auto border rounded shadow">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Event</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">IP</th>
                <th className="px-4 py-2 text-left">User Agent</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{log.createdAt}</td>
                  <td className="px-4 py-2">{log.username}</td>
                  <td className="px-4 py-2">
                    <span className={eventBadge(log.eventType)}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={statusBadge(log.status)}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{log.ipAddress}</td>
                  <td className="px-4 py-2 text-xs">{log.userAgent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 0}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </button>

        <span className="text-gray-700">
          Page <span className="font-semibold">{page + 1}</span>
        </span>

        <button
          className="px-3 py-1 bg-gray-200 rounded"
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
