"use client";

import { useState, useEffect, useCallback } from "react";

interface ManagedUser {
  id: number;
  email: string;
  isAdminCreated: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      // non-critical; list stays empty
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setResult({ type: "success", message: data.message });
        setEmail("");
        fetchUsers();
      } else {
        setResult({ type: "error", message: data.error ?? "Something went wrong." });
      }
    } catch {
      setResult({ type: "error", message: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create admin dashboard accounts. Credentials are emailed automatically. Only these users can use Forgot&nbsp;Password.
        </p>
      </div>

      {/* Create user card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0, 122, 77, 0.12)" }}
            >
              <i className="bx bx-user-plus text-lg" style={{ color: "#007A4D" }} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Create New User</h2>
              <p className="text-xs text-muted-foreground">
                A secure random password will be generated and emailed.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="new-user-email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email Address
            </label>
            <div className="flex gap-3">
              <input
                id="new-user-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                required
                disabled={isSubmitting}
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-60"
                style={
                  {
                    "--tw-ring-color": "#007A4D",
                  } as React.CSSProperties
                }
              />
              <button
                id="create-user-submit"
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                style={{ background: "#007A4D" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <i className="bx bx-send text-base" />
                    Create &amp; Send
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result banner */}
          {result && (
            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm ${
                result.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                  : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
              }`}
            >
              <i
                className={`bx ${result.type === "success" ? "bx-check-circle" : "bx-error-circle"} text-lg flex-shrink-0 mt-0.5`}
              />
              <span>{result.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Users list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0, 122, 77, 0.12)" }}
            >
              <i className="bx bx-group text-lg" style={{ color: "#007A4D" }} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">All Users</h2>
              <p className="text-xs text-muted-foreground">
                {isLoadingUsers ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""} total`}
              </p>
            </div>
          </div>
          <button
            id="refresh-users-btn"
            onClick={fetchUsers}
            disabled={isLoadingUsers}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            title="Refresh list"
          >
            <i className={`bx bx-refresh text-xl ${isLoadingUsers ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoadingUsers ? (
          <div className="p-8 flex justify-center">
            <span className="inline-block w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            <i className="bx bx-user text-4xl mb-2 block opacity-30" />
            No users found. Create one above.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ background: "#007A4D" }}
                  >
                    {u.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                    u.isAdminCreated
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {u.isAdminCreated ? "Admin-created" : "Seed account"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
