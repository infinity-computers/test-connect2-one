"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Wifi,
  XCircle,
  DollarSign,
  Bell,
  LogOut,
  Search,
  Loader2,
  MessageSquare,
  UserPlus,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";

type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  auth_type: string;
  status: string | null;
};

type ApiComplaint = {
  id: number;
  issue_type: string;
  explicit_description: string | null;
  status: string;
  created_at: string;
  users: { name: string; email: string } | null;
  reporter_name: string | null;
};

type ApiNotification = {
  id: string;
  title: string;
  description: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

type KpiStats = {
  totalUsers: number;
  activeUsers: number;
  openComplaints: number;
  totalRevenue: number;
};

export default function AdminDashboardClient() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [tickets, setComplaints] = useState<ApiComplaint[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [search, setSearch] = useState("");
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingNotification, setSavingNotification] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "USER",
    auth_type: "PASSWORD",
    password: "",
  });
  const [newNotification, setNewNotification] = useState({
    title: "",
    description: "",
    expiresAt: (() => {
      const date = new Date(Date.now() + 60 * 60 * 1000);
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    })(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, complaintsRes, notificationsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/tickets"),
          fetch("/api/admin/notifications"),
        ]);

        const usersData = await usersRes.json();
        const complaintsData = await complaintsRes.json();
        const notificationsData = await notificationsRes.json();

        setUsers(usersData.users || []);
        setComplaints(complaintsData.tickets || []);
        setNotifications(notificationsData.notifications || []);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === "ADMIN" || user.role === "TECHNICIAN")) {
      fetchData();
    }
  }, [user]);

  const handleCreateUser = async () => {
    setAddUserError("");
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setAddUserError("Name and email are required.");
      return;
    }
    if (newUser.auth_type === "PASSWORD" && !newUser.password) {
      setAddUserError("Password is required for PASSWORD auth.");
      return;
    }

    setSavingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase(),
          phone: newUser.phone.trim() || null,
          role: newUser.role,
          auth_type: newUser.auth_type,
          password:
            newUser.auth_type === "PASSWORD" ? newUser.password : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUserError(data.error || "Failed to create user");
        return;
      }

      setUsers((prev) => [data.user, ...prev]);
      setShowAddUser(false);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        role: "USER",
        auth_type: "PASSWORD",
        password: "",
      });
      setShowPassword(false);
    } catch {
      setAddUserError("Failed to create user");
    } finally {
      setSavingUser(false);
    }
  };

  const handleCreateNotification = async () => {
    setNotificationError("");

    if (!newNotification.title.trim() || !newNotification.description.trim() || !newNotification.expiresAt) {
      setNotificationError("Title, description, and expiry are required.");
      return;
    }

    setSavingNotification(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNotification.title.trim(),
          description: newNotification.description.trim(),
          expiresAt: new Date(newNotification.expiresAt).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotificationError(data.error || "Failed to create notification");
        return;
      }

      setNotifications((prev) => [data.notification, ...prev]);
      setNewNotification({
        title: "",
        description: "",
        expiresAt: (() => {
          const date = new Date(Date.now() + 60 * 60 * 1000);
          const offset = date.getTimezoneOffset() * 60000;
          return new Date(date.getTime() - offset).toISOString().slice(0, 16);
        })(),
      });
      setShowNotificationForm(false);
    } catch {
      setNotificationError("Failed to create notification");
    } finally {
      setSavingNotification(false);
    }
  };

  const kpi: KpiStats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => (u.status || "").toLowerCase() === "active").length,
    openComplaints: tickets.filter((c) => c.status === "OPEN").length,
    totalRevenue: 0,
  };

  const openComplaints = tickets.filter((c) => c.status === "OPEN");
  const filtered = users.filter((u) => {
    const name = (u.name ?? "").toLowerCase();
    const email = (u.email ?? "").toLowerCase();
    const phone = u.phone ?? "";

    const query = search.toLowerCase();

    return (
      name.includes(query) || email.includes(query) || phone.includes(search)
    );
  });
  const activeNotifications = notifications.filter(
    (notification) => new Date(notification.expires_at).getTime() > Date.now(),
  );

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-slate-300 mb-4">Admin access required.</p>
          <button
            onClick={() => onNavigate("/login")}
            className="btn-primary px-5 py-2.5"
          >
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-slate-950">
      {/* Admin Header */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-slate-300 text-xs mb-1">Admin Portal</p>
              <h1 className="subheading-rhythm text-2xl font-bold">
                Dashboard
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Welcome, {user.name}
              </p>
            </div>
            <div className="flex flex-wrap items-stretch gap-2 sm:gap-3 sm:items-center sm:justify-end">
              {user.role === "ADMIN" && (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <UserPlus size={16} />
                  Add User
                </button>
              )}
              <button
                onClick={() => onNavigate("/admin/tickets")}
                className="flex w-full sm:w-auto items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <MessageSquare size={16} />
                View Complaints
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative bg-slate-800/50 hover:bg-slate-800/70 border border-slate-600 p-2.5 rounded-xl transition-colors"
                >
                  <Bell size={18} />
                  {openComplaints.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs font-bold flex items-center justify-center">
                      {openComplaints.length}
                    </span>
                  )}
                </button>
                {showAlerts && (
                  <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-72 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-950 border-b border-slate-800">
                      <p className="text-sm font-semibold text-slate-100">
                        Open Complaints ({openComplaints.length})
                      </p>
                    </div>
                    {openComplaints.slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        className="px-4 py-3 border-b border-slate-800 hover:bg-slate-950 cursor-pointer"
                        onClick={() => {
                          onNavigate("/admin/tickets");
                          setShowAlerts(false);
                        }}
                      >
                        <p className="text-xs font-semibold text-slate-100">
                          #{c.id} – {c.issue_type?.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.users?.name || c.reporter_name || "Guest"}
                        </p>
                      </div>
                    ))}
                    <div className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          onNavigate("/admin/tickets");
                          setShowAlerts(false);
                        }}
                        className="text-xs text-link font-semibold"
                      >
                        View all tickets
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  logout();
                  onNavigate("/");
                }}
                className="flex w-full sm:w-auto items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              icon: Users,
              label: "Total Users",
              value: kpi.totalUsers.toLocaleString(),
              color: "text-blue-200 bg-blue-900/40",
              change: "All time",
            },
            {
              icon: Wifi,
              label: "Active Users",
              value: kpi.activeUsers.toLocaleString(),
              color: "text-emerald-200 bg-emerald-900/30",
              change: "Current",
            },
            {
              icon: XCircle,
              label: "Open Complaints",
              value: kpi.openComplaints.toString(),
              color: "text-red-200 bg-red-900/30",
              change: "Needs attention",
            },
            {
              icon: DollarSign,
              label: "Total Revenue",
              value: "₹0",
              color: "text-blue-300 bg-blue-900/40",
              change: "This year",
            },
          ].map(({ icon: Icon, label, value, color, change }) => (
            <div
              key={label}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {label}
              </p>
              <p className="text-xs text-slate-500 mt-1">{change}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="subheading-rhythm text-lg font-bold text-slate-100">
                Sitewide Notifications
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visible to every user until expiry.
              </p>
            </div>
            {user.role === "ADMIN" && (
              <button
                onClick={() => setShowNotificationForm((prev) => !prev)}
                className="btn-primary px-4 py-2 text-sm rounded-xl"
              >
                {showNotificationForm ? "Close" : "New Notification"}
              </button>
            )}
          </div>

          {user.role === "ADMIN" && showNotificationForm && (
            <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) =>
                      setNewNotification((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="input-dark py-2.5"
                    placeholder="ISP outage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={newNotification.expiresAt}
                    onChange={(e) =>
                      setNewNotification((prev) => ({ ...prev, expiresAt: e.target.value }))
                    }
                    className="input-dark py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Description
                </label>
                <textarea
                  value={newNotification.description}
                  onChange={(e) =>
                    setNewNotification((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="input-dark min-h-28 py-2.5"
                  placeholder="Internet service is currently down. Work is in progress."
                />
              </div>

              {notificationError && (
                <p className="text-sm text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">
                  {notificationError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowNotificationForm(false);
                    setNotificationError("");
                  }}
                  className="flex-1 border border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNotification}
                  disabled={savingNotification}
                  className="btn-primary flex-1 py-2.5 disabled:opacity-60"
                >
                  {savingNotification ? "Creating..." : "Create Notification"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {activeNotifications.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
                No active notifications.
              </div>
            ) : (
              activeNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-amber-400/20 bg-amber-500/5 px-4 py-3"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-100">{notification.title}</p>
                      <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">
                        {notification.description}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 sm:pl-6 sm:pt-1 whitespace-nowrap">
                      Expires {new Date(notification.expires_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users Table */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="subheading-rhythm text-lg font-bold text-slate-100">
              All Users
            </h2>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark pl-9 py-2 w-full sm:w-56"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-950 border-b border-slate-800">
                    <tr>
                      {[
                        "ID",
                        "Name",
                        "Email",
                        "Phone",
                        "Role",
                        "Auth Type",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filtered.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-950 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">
                          {u.id}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-100 whitespace-nowrap">
                          {u.name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                          {u.email}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {u.phone || "-"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">{u.role}</td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {u.auth_type}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {(u.status || "-").toUpperCase()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 px-4 py-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="subheading-rhythm text-lg font-bold text-slate-100">
                Add User
              </h3>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setAddUserError("");
                }}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="input-dark py-2.5"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="input-dark py-2.5"
                    placeholder="email@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="input-dark py-2.5"
                    placeholder="99749 55542"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="input-dark py-2.5"
                  >
                    <option value="USER">User</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Auth Type
                  </label>
                  <select
                    value={newUser.auth_type}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        auth_type: e.target.value,
                      }))
                    }
                    className="input-dark py-2.5"
                  >
                    <option value="PASSWORD">Password</option>
                    <option value="OTP">OTP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="input-dark py-2.5 pr-10"
                      placeholder={
                        newUser.auth_type === "OTP"
                          ? "Not required"
                          : "Set password"
                      }
                      disabled={newUser.auth_type === "OTP"}
                    />
                    {newUser.auth_type === "PASSWORD" && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {addUserError && (
                <p className="text-sm text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">
                  {addUserError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setAddUserError("");
                  }}
                  className="flex-1 border border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={savingUser}
                  className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {savingUser ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {savingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
