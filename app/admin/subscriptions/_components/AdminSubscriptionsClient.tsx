"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, Loader2, Pencil, Plus, RefreshCw, Search, Wifi, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import StatusBadge from "../../../../components/ui/StatusBadge";

type SubscriptionStatus = "active" | "expired" | "cancelled";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
};

type PlanVariant = {
  id: string;
  speed_mbps: number;
  duration_months: number;
  price: number | string;
  plans?: { name: string };
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  plan_variants: PlanVariant[];
};

type Subscription = {
  id: string;
  user_id: string;
  plan_variant_id: string;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  plan_variants: PlanVariant & { plans: { name: string } };
};

type SubscriptionForm = {
  planVariantId: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
};

function todayInputValue(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function toDateInputValue(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPlanLabel(variant: PlanVariant, fallbackPlanName?: string): string {
  const planName = variant.plans?.name || fallbackPlanName || "Plan";
  return `${planName} - ${variant.speed_mbps} Mbps - ${variant.duration_months} months - Rs. ${Number(variant.price).toLocaleString("en-IN")}`;
}

const emptyForm = (): SubscriptionForm => ({
  planVariantId: "",
  startDate: todayInputValue(),
  endDate: "",
  status: "active",
});

export default function AdminSubscriptionsClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [form, setForm] = useState<SubscriptionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const navigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedUser = users.find((item) => item.id === selectedUserId) || null;
  const activeSubscription = subscriptions.find((item) => item.status === "active") || null;

  const planOptions = useMemo(
    () => plans.flatMap((plan) => plan.plan_variants.map((variant) => ({ ...variant, planName: plan.name }))),
    [plans],
  );

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((item) => {
      const name = item.name?.toLowerCase() || "";
      const email = item.email?.toLowerCase() || "";
      const phone = item.phone || "";
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [userSearch, users]);

  const addingSecondActiveSubscription = Boolean(
    selectedUserId &&
    !editingId &&
    form.status === "active" &&
    activeSubscription,
  );

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;

    const fetchInitialData = async () => {
      try {
        const res = await fetch("/api/admin/subscriptions");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch subscription data");
          return;
        }
        setUsers(data.users || []);
        setPlans(data.plans || []);
      } catch {
        setError("Failed to fetch subscription data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  useEffect(() => {
    if (!selectedUserId) {
      setSubscriptions([]);
      setEditingId(null);
      setForm(emptyForm());
      return;
    }

    const fetchSubscriptions = async () => {
      setSubscriptionsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/subscriptions?userId=${selectedUserId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch subscriptions");
          return;
        }
        setSubscriptions(data.subscriptions || []);
        setEditingId(null);
        setForm(emptyForm());
      } catch {
        setError("Failed to fetch subscriptions");
      } finally {
        setSubscriptionsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [selectedUserId]);

  const refreshSelectedUserSubscriptions = async () => {
    if (!selectedUserId) return;
    const res = await fetch(`/api/admin/subscriptions?userId=${selectedUserId}`);
    const data = await res.json();
    if (res.ok) {
      setSubscriptions(data.subscriptions || []);
    }
  };

  const startEdit = (subscription: Subscription) => {
    setEditingId(subscription.id);
    setError("");
    setForm({
      planVariantId: subscription.plan_variant_id,
      startDate: toDateInputValue(subscription.start_date),
      endDate: toDateInputValue(subscription.end_date),
      status: subscription.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError("");
    setForm(emptyForm());
  };

  const saveSubscription = async () => {
    setError("");

    if (!selectedUserId) {
      setError("Select a user first.");
      return;
    }

    if (!form.planVariantId || !form.startDate || !form.endDate || !form.status) {
      setError("Plan, start date, end date, and status are required.");
      return;
    }

    if (addingSecondActiveSubscription) {
      setError("This user already has an active subscription. Cancel or edit the current active subscription first.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/admin/subscriptions/${editingId}` : "/api/admin/subscriptions",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUserId,
            planVariantId: form.planVariantId,
            startDate: form.startDate,
            endDate: form.endDate,
            status: form.status,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save subscription");
        return;
      }

      await refreshSelectedUserSubscriptions();
      setEditingId(null);
      setForm(emptyForm());
    } catch {
      setError("Failed to save subscription");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="pt-14 min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Admin access required.</p>
          <button onClick={() => navigate("/login")} className="btn-primary px-5 py-2.5">Admin Login</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-14 min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="pt-14 min-h-screen bg-slate-950">
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="subheading-rhythm text-2xl font-bold">Manage Subscriptions</h1>
          <p className="text-slate-500 text-sm mt-1">Add, update, or cancel user subscriptions using existing plans.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit">
            <h2 className="text-base font-bold text-slate-100 mb-4">Select User</h2>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name, email, or phone"
                className="input-dark w-full pl-9 py-2.5 text-sm"
              />
            </div>
            <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
              {filteredUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No users found.</p>
              ) : (
                filteredUsers.map((item) => {
                  const selected = item.id === selectedUserId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedUserId(item.id)}
                      className={`w-full text-left rounded-xl border p-3 transition-colors ${selected ? "border-blue-600 bg-blue-950/40" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}
                    >
                      <p className="text-sm font-semibold text-slate-100">{item.name || "Unnamed User"}</p>
                      <p className="text-xs text-slate-400 truncate">{item.email || "No email"}</p>
                      <p className="text-xs text-slate-500">{item.phone || "No phone"}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Subscription Details</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedUser ? `${selectedUser.name || selectedUser.email || "Selected user"}` : "Choose a user to manage subscriptions."}
                  </p>
                </div>
                <button
                  onClick={refreshSelectedUserSubscriptions}
                  disabled={!selectedUserId || subscriptionsLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={subscriptionsLoading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {activeSubscription && !editingId && (
                <div className="mb-5 rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                  This user already has an active subscription. To add another active subscription, cancel or edit the current active subscription first.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <label className="xl:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">Plan</span>
                  <select
                    value={form.planVariantId}
                    onChange={(event) => setForm((prev) => ({ ...prev, planVariantId: event.target.value }))}
                    disabled={!selectedUserId}
                    className="input-dark w-full py-2.5 text-sm"
                  >
                    <option value="">Select plan</option>
                    {planOptions.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {formatPlanLabel(variant, variant.planName)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">Start Date</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    disabled={!selectedUserId}
                    className="input-dark w-full py-2.5 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">End Date</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    disabled={!selectedUserId}
                    className="input-dark w-full py-2.5 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as SubscriptionStatus }))}
                    disabled={!selectedUserId}
                    className="input-dark w-full py-2.5 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                {editingId && (
                  <button
                    onClick={cancelEdit}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-600"
                  >
                    <X size={14} /> Cancel Edit
                  </button>
                )}
                <button
                  onClick={saveSubscription}
                  disabled={saving || !selectedUserId || addingSecondActiveSubscription}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : editingId ? <Pencil size={15} /> : <Plus size={15} />}
                  {editingId ? "Update Subscription" : "Add Subscription"}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Subscription History</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Full history for the selected user.</p>
                </div>
                <Wifi size={18} className="text-blue-400" />
              </div>

              {!selectedUserId ? (
                <div className="p-10 text-center text-sm text-slate-500">Select a user to view subscription history.</div>
              ) : subscriptionsLoading ? (
                <div className="p-10 flex items-center justify-center">
                  <Loader2 size={26} className="animate-spin text-blue-400" />
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">No subscriptions found for this user.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950 border-b border-slate-800">
                      <tr>
                        {["Plan", "Speed", "Duration", "Price", "Start", "End", "Status", "Action"].map((heading) => (
                          <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-slate-950 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-slate-100 whitespace-nowrap">{subscription.plan_variants.plans.name}</td>
                          <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{subscription.plan_variants.speed_mbps} Mbps</td>
                          <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{subscription.plan_variants.duration_months} months</td>
                          <td className="px-4 py-3.5 text-slate-100 whitespace-nowrap">Rs. {Number(subscription.plan_variants.price).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap"><Calendar size={13} className="inline mr-1 text-slate-500" />{formatDate(subscription.start_date)}</td>
                          <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{formatDate(subscription.end_date)}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap"><StatusBadge status={subscription.status} size="sm" /></td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <button
                              onClick={() => startEdit(subscription)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-600"
                            >
                              <Pencil size={12} /> Edit
                            </button>
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
      </div>
    </div>
  );
}
