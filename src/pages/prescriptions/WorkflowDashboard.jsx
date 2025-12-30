import { useEffect, useState } from "react";
import {
  ClipboardList,
  Beaker,
  CheckCircle,
  ShoppingBag,
  Truck,
} from "lucide-react";

import init from "../../init";
import { useUser } from "../../context/UserContext";
import Notification from "../../components/Notification";

const WORKFLOW_STEPS = [
  { key: "INTAKE_VALIDATION", label: "Intake Queue", icon: <ClipboardList size={20} /> },
  { key: "FILL_QUEUE_ASSIGNMENT", label: "Fill Queue", icon: <Beaker size={20} /> },
  { key: "QA_VERIFICATION", label: "QA Queue", icon: <CheckCircle size={20} /> },
  { key: "READY_FOR_PICKUP", label: "Pickup Queue", icon: <ShoppingBag size={20} /> },
  { key: "DELIVERY_DISPATCH", label: "Delivery Queue", icon: <Truck size={20} /> },
];

export default function WorkflowDashboard() {
  const { appUser, token } = useUser();

  // Role extraction from actor
  const role = appUser?.roles?.[0]?.roleName ?? "TECH";

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [queues, setQueues] = useState({
    INTAKE_VALIDATION: [],
    FILL_QUEUE_ASSIGNMENT: [],
    QA_VERIFICATION: [],
    READY_FOR_PICKUP: [],
    DELIVERY_DISPATCH: [],
  });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch a queue by workflow step
  const fetchQueue = async (step) => {
    try {
      const res = await fetch(
        `/${init.appName}/api/prescriptions/step/${step}?page=0&size=50`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-User-Role": role,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch queue: " + step);

      const json = await res.json();
      return json.content ?? [];
    } catch (err) {
      console.error(err);
      notify("error", `Error loading ${step} queue`);
      return [];
    }
  };

  // Load all workflow queues
  const loadAllQueues = async () => {
    setLoading(true);

    let nextQueues = { ...queues };

    for (const w of WORKFLOW_STEPS) {
      nextQueues[w.key] = await fetchQueue(w.key);
    }

    setQueues(nextQueues);
    setLoading(false);
    notify("success", "Workflow queues refreshed");
  };

  useEffect(() => {
    loadAllQueues();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Workflow Dashboard</h1>

          <button
            onClick={loadAllQueues}
            className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Workflow Queues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {WORKFLOW_STEPS.map((wf) => (
            <div
              key={wf.key}
              className="bg-white shadow-lg border border-indigo-200 rounded-xl p-6"
            >
              {/* Queue Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-indigo-600">{wf.icon}</span>
                <h2 className="text-xl font-semibold text-gray-900">{wf.label}</h2>

                <span className="ml-auto bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  {queues[wf.key]?.length}
                </span>
              </div>

              {/* Empty State */}
              {queues[wf.key]?.length === 0 ? (
                <p className="text-gray-500 text-sm">No prescriptions in this queue</p>
              ) : (
                <ul className="space-y-3">

                  {queues[wf.key]?.map((rx) => (
                    <li
                      key={rx.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <p className="font-semibold text-gray-900">Rx ID: {rx.id}</p>
                      <p className="text-sm text-gray-700">Patient: {rx.patientId}</p>
                      <p className="text-sm text-gray-700">Drug: {rx.drugId}</p>
                      <p className="text-xs text-gray-500">
                        Updated: {rx.updatedAt || "N/A"}
                      </p>
                    </li>
                  ))}

                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {notification && <Notification notification={notification} />}
    </div>
  );
}
