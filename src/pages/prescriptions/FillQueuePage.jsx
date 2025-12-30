import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import { useUser } from "../../context/UserContext";
import { Link } from "react-router-dom";

export default function FillQueuePage() {
    const { appUser, token } = useUser();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [cancelItem, setCancelItem] = useState(null);
    const [cancelReason, setCancelReason] = useState("");

    // ----------------------------------------------------------
    // Fetch All Prescription Aggregates
    // ----------------------------------------------------------
    const fetchQueue = () => {
        if (!appUser?.email) return;

        setLoading(true);
        axios
            .get(`/${init.appName}/api/prescription-aggregate?max=500`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then((res) => {
                const all = res.data || [];

                // Extract all items in workflow step FILL
                const fillItems = [];
                all.forEach((rx) => {
                    rx.items
                        .filter((it) => it.workflowStep === "FILL")
                        .forEach((it) => {
                            fillItems.push({
                                ...it,
                                patientName: `${rx.firstName} ${rx.lastName}`,
                                mrn: rx.mrn,
                                prescriptionId: rx.prescriptionId,
                            });
                        });
                });

                setItems(fillItems);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchQueue();
    }, [appUser]);

    // ----------------------------------------------------------
    // API Actions
    // ----------------------------------------------------------

    const startFill = (itemId) => {
        axios
            .post(
                `/${init.appName}/api/prescription-items/${itemId}/start-fill`,
                {},
                { headers: { "Authorization": `Bearer ${token}` } }
            )
            .then(fetchQueue)
            .catch((err) => alert("Failed to start fill: " + err.message));
    };

    const completeFill = (itemId) => {
        axios
            .post(
                `/${init.appName}/api/prescription-items/${itemId}/complete-fill`,
                {},
                { headers: { "Authorization": `Bearer ${token}` } }
            )
            .then(fetchQueue)
            .catch((err) => alert("Failed to complete fill: " + err.message));
    };

    const doCancelItem = () => {
        axios
            .post(
                `/${init.appName}/api/prescription-items/${cancelItem}/cancel`,
                { reason: cancelReason },
                { headers: { "Authorization": `Bearer ${token}` } }
            )
            .then(() => {
                setCancelItem(null);
                setCancelReason("");
                fetchQueue();
            })
            .catch((err) => alert("Failed to cancel item: " + err.message));
    };

    // ----------------------------------------------------------
    // UI Rendering
    // ----------------------------------------------------------
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Fill Queue</h1>

            {loading ? (
                <p>Loading...</p>
            ) : items.length === 0 ? (
                <p>No items waiting for fill.</p>
            ) : (
                <table className="min-w-full bg-white rounded shadow">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3">Patient</th>
                            <th className="p-3">MRN</th>
                            <th className="p-3">Drug</th>
                            <th className="p-3">SIG</th>
                            <th className="p-3">Quantity</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it) => (
                            <tr key={it.prescriptionItemId} className="border-t">
                                <td className="p-3">{it.patientName}</td>
                                <td className="p-3">{it.mrn}</td>
                                <td className="p-3">
                                    {it.drug?.name} {it.drug?.strength}
                                </td>
                                <td className="p-3">{it.sig}</td>
                                <td className="p-3">{it.quantity}</td>
                                <td className="p-3">{it.workflowStatus}</td>
                                <td className="p-3 space-x-2">

                                    <button
                                        onClick={() => startFill(it.prescriptionItemId)}
                                        className="px-3 py-1 bg-blue-600 text-white rounded"
                                    >
                                        Start Fill
                                    </button>

                                    <button
                                        onClick={() => completeFill(it.prescriptionItemId)}
                                        className="px-3 py-1 bg-green-600 text-white rounded"
                                    >
                                        Complete Fill
                                    </button>

                                    <button
                                        onClick={() => setCancelItem(it.prescriptionItemId)}
                                        className="px-3 py-1 bg-red-600 text-white rounded"
                                    >
                                        Cancel
                                    </button>

                                    <Link
                                        className="px-3 py-1 bg-gray-300 rounded inline-block"
                                        to={`/prescriptions/${it.prescriptionId}`}
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Cancel Modal */}
            {cancelItem && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-3">Cancel Item</h2>

                        <textarea
                            className="w-full border p-2 rounded"
                            rows="4"
                            placeholder="Enter reason..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />

                        <div className="flex justify-end mt-4 gap-2">
                            <button
                                onClick={() => setCancelItem(null)}
                                className="px-4 py-2 bg-gray-300 rounded"
                            >
                                Close
                            </button>

                            <button
                                onClick={doCancelItem}
                                className="px-4 py-2 bg-red-600 text-white rounded"
                            >
                                Cancel Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
