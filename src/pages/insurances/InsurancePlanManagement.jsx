import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import Notification from "../../components/Notification";
import { useUser } from "../../context/UserContext";

export default function InsurancePlanManagement() {
  const { appUser, token } = useUser();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const [search, setSearch] = useState("");

  // Dialog State
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [formData, setFormData] = useState({
    planName: "",
    payerName: "",
    payerId: "",
    bin: "",
    pcn: "",
    groupNumber: "",
    phoneNumber: "",
    notes: "",
    active: true,
  });

  // ---------------------------------------------------------------------
  // Notification helper
  // ---------------------------------------------------------------------
  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ---------------------------------------------------------------------
  // Fetch Insurance Plans
  // ---------------------------------------------------------------------
  const fetchPlans = () => {
    setLoading(true);

    axios
      .get(`/${init.appName}/api/insurance-plans?page=0&size=200`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
      .then((res) => setPlans(res.data.content || []))
      .catch((err) => {
        console.error(err);
        notify("error", "Failed to fetch insurance plans.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (appUser?.email) {
      fetchPlans();
    }
  }, [appUser]);

  // ---------------------------------------------------------------------
  // Search filter
  // ---------------------------------------------------------------------
  const filtered = plans.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.planName?.toLowerCase().includes(s) ||
      p.payerName?.toLowerCase().includes(s) ||
      p.bin?.toLowerCase().includes(s) ||
      p.pcn?.toLowerCase().includes(s)
    );
  });

  // ---------------------------------------------------------------------
  // Dialog helpers
  // ---------------------------------------------------------------------
  const openNew = () => {
    setEditing(null);
    setFormData({
      planName: "",
      payerName: "",
      payerId: "",
      bin: "",
      pcn: "",
      groupNumber: "",
      phoneNumber: "",
      notes: "",
      active: true,
    });
    setShowDialog(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setFormData({
      planName: plan.planName || "",
      payerName: plan.payerName || "",
      payerId: plan.payerId || "",
      bin: plan.bin || "",
      pcn: plan.pcn || "",
      groupNumber: plan.groupNumber || "",
      phoneNumber: plan.phoneNumber || "",
      notes: plan.notes || "",
      active: plan.active,
    });
    setShowDialog(true);
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // ---------------------------------------------------------------------
  // Save (Create or Update)
  // ---------------------------------------------------------------------
  const savePlan = () => {
    const payload = { ...formData };
    let req;

    if (editing) {
      req = axios.put(
        `/${init.appName}/api/insurance-plans/${editing.id}`,
        payload,
        {
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        }
      );
    } else {
      req = axios.post(`/${init.appName}/api/insurance-plans`, payload, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      });
    }

    req
      .then(() => {
        notify("success", editing ? "Insurance plan updated." : "Insurance plan created.");
        setShowDialog(false);
        fetchPlans();
      })
      .catch((err) => {
        notify("error", "Failed to save insurance plan.");
        console.error(err);
      });
  };

  // ---------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------
  const deletePlan = (id) => {
    if (!window.confirm("Delete this insurance plan?")) return;

    axios
      .delete(`/${init.appName}/api/insurance-plans/${id}`, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      })
      .then(() => {
        notify("success", "Insurance plan deleted.");
        fetchPlans();
      })
      .catch(() => notify("error", "Failed to delete plan."));
  };

  // ---------------------------------------------------------------------
  // Toggle Active (inline toggle like Prescriber)
  // ---------------------------------------------------------------------
  const toggleActive = (plan) => {
    const payload = { ...plan, active: !plan.active };

    axios
      .put(`/${init.appName}/api/insurance-plans/${plan.id}`, payload, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      })
      .then(() => {
        notify("success", "Status updated.");
        fetchPlans();
      })
      .catch(() => notify("error", "Failed to update status."));
  };

  // ---------------------------------------------------------------------
  // UI Rendering
  // ---------------------------------------------------------------------
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Insurance Plans</h1>

      {/* Search + Add Button aligned like Prescriber page */}
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by plan name, payer, BIN, PCN..."
          className="px-4 py-2 border rounded w-1/2"
        />

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={openNew}
        >
          + Add Insurance Plan
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p>No insurance plans found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="p-3">Plan Name</th>
                <th className="p-3">Payer</th>
                <th className="p-3">BIN/PCN</th>
                <th className="p-3">Group #</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Active</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.planName}</td>
                  <td className="p-3">
                    {p.payerName} ({p.payerId})
                  </td>
                  <td className="p-3">
                    {p.bin} / {p.pcn}
                  </td>
                  <td className="p-3">{p.groupNumber}</td>
                  <td className="p-3">{p.phoneNumber}</td>

                  {/* Active Toggle */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`px-3 py-1 rounded ${
                        p.active ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                      }`}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deletePlan(p.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-xl">
            <h2 className="text-xl font-semibold mb-4">
              {editing ? "Edit Insurance Plan" : "Add Insurance Plan"}
            </h2>

            <div className="grid grid-cols-2 gap-4">

              <input
                name="planName"
                className="border p-2 rounded col-span-2"
                placeholder="Plan Name"
                value={formData.planName}
                onChange={handleField}
              />

              <input
                name="payerName"
                className="border p-2 rounded"
                placeholder="Payer Name"
                value={formData.payerName}
                onChange={handleField}
              />

              <input
                name="payerId"
                className="border p-2 rounded"
                placeholder="Payer ID"
                value={formData.payerId}
                onChange={handleField}
              />

              <input
                name="bin"
                className="border p-2 rounded"
                placeholder="BIN"
                value={formData.bin}
                onChange={handleField}
              />

              <input
                name="pcn"
                className="border p-2 rounded"
                placeholder="PCN"
                value={formData.pcn}
                onChange={handleField}
              />

              <input
                name="groupNumber"
                className="border p-2 rounded col-span-2"
                placeholder="Group Number"
                value={formData.groupNumber}
                onChange={handleField}
              />

              <input
                name="phoneNumber"
                className="border p-2 rounded col-span-2"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleField}
              />

              <textarea
                name="notes"
                className="border p-2 rounded col-span-2"
                placeholder="Notes"
                value={formData.notes}
                onChange={handleField}
                rows={3}
              />

              {/* Active Checkbox */}
              <label className="flex items-center space-x-2 col-span-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, active: e.target.checked }))
                  }
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={savePlan}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && <Notification notification={notification} />}
    </div>
  );
}
