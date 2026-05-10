"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { BiUserPlus, BiSend, BiCheckCircle, BiErrorCircle, BiGroup, BiRefresh, BiUser, BiTrash } from "react-icons/bi";

interface ManagedUser {
  id: number;
  email: string;
  createdAt: string;
  role: string;
}

export default function UserManagement({ userRole }: { userRole: string }) {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const toast = useToast();

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

  const handleDeleteUser = async (id: number, emailToDelete: string) => {
    if (!confirm(`Are you sure you want to delete user ${emailToDelete}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: selectedRole }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("User Created", data.message);
        setEmail("");
        fetchUsers();
      } else {
        toast.error("Error", data.error ?? "Something went wrong.");
      }
    } catch {
      toast.error("Error", "Network error. Please try again.");
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
              <BiUserPlus className="text-lg" style={{ color: "#007A4D" }} />
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
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label
                htmlFor="new-user-email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Email Address
              </label>
              <input
                id="new-user-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                required
                disabled={isSubmitting}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-60"
                style={
                  {
                    "--tw-ring-color": "#007A4D",
                  } as React.CSSProperties
                }
              />
            </div>
            {userRole === "developer" && (
              <div className="w-32">
                <label htmlFor="new-user-role" className="block text-sm font-medium text-foreground mb-1.5">
                  Role
                </label>
                <select
                  id="new-user-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-60"
                  style={{ "--tw-ring-color": "#007A4D" } as React.CSSProperties}
                  disabled={isSubmitting}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <button
              id="create-user-submit"
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 h-[42px]"
              style={{ background: "#007A4D" }}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <BiSend className="text-base" />
                  Create &amp; Send
                </>
              )}
            </button>
          </div>

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
              <BiGroup className="text-lg" style={{ color: "#007A4D" }} />
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
            <BiRefresh className={`text-xl ${isLoadingUsers ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoadingUsers ? (
          <div className="p-8 flex justify-center">
            <span className="inline-block w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            <BiUser className="text-4xl mb-2 mx-auto block opacity-30" />
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {u.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(userRole === "developer" || (userRole === "admin" && u.role !== "developer")) && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                      title="Delete User"
                    >
                      <BiTrash className="text-lg" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
