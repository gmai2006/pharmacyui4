// Updated DeviceFingerprintPage.jsx styled like StationPage/UserPage
// Source: DeviceFingerprintPage.jsx
// :contentReference[oaicite:1]{index=1}

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Download } from "lucide-react";

import init from "../../init";
import { useUser } from "../../context/UserContext";
import Notification from "../../components/Notification";
import DeviceFingerprintService from "../../utils/fingerprinting";
import DeleteDialog from "../../components/DeleteDialog";
import DeviceDialog from "./DeviceDialog";
import UpdateDeviceHashDialog from "./UpdateDeviceHashDialog";


export default function DeviceFingerprintPage() {
    const { appUser, token } = useUser();

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showDialog, setShowDialog] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const [notification, setNotification] = useState(null);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [dialogType, setDialogType] = useState("create"); // "create" | "editHash"

    const itemsPerPage = 6;

    const baseUrl = `/${init.appName}/api/device-fingerprints`;

    // ---------------------------------------------------------
    // Notification helper
    // ---------------------------------------------------------
    const notify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // ---------------------------------------------------------
    // Fetch devices
    // ---------------------------------------------------------
    const fetchDevices = () => {
        setLoading(true);

        axios
            .get(`${baseUrl}?page=0&size=200`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            })
            .then((res) => setDevices(res.data.content || []))
            .catch(() => notify("error", "Failed to load devices"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (appUser?.email) fetchDevices();
    }, [appUser]);

    // ---------------------------------------------------------
    // Create default new device using fingerprinting service
    // ---------------------------------------------------------
    const resetForm = async () => {
        const info = await DeviceFingerprintService.generateFingerprint();
        const hash = await DeviceFingerprintService.createFingerprintHash(info);

        return {
            id: undefined,
            stationId: "",
            fingerprintHash: hash,
            browserUserAgent: info.vendorPrefix,
            screenResolution: info.screenResolution,
            timezone: info.timezone,
            language: navigator.language,
            canvasFingerprint: info.canvasFingerprint,
            webglFingerprint: info.webglFingerprint,
            department: "",
            location: "",
            isActive: true,
            accessCount: 1,
        };
    };

    const openNewDialog = async () => {
        const device = await resetForm();
        setSelectedDevice(device);
        setDialogType("create");   // NEW device uses DeviceDialog
        setShowDialog(true);
    };


    const openEditDialog = (device) => {
        setSelectedDevice(device);
        setDialogType("editHash");   // EXISTING device → UpdateDeviceHashDialog
        setShowDialog(true);
    };


    // ---------------------------------------------------------
    // Save (create/update)
    // ---------------------------------------------------------
    const saveDevice = async (device) => {
        try {
            await axios.post(`${baseUrl}/`, device, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            notify("success", "Device saved");
            setShowDialog(false);
            fetchDevices();
        } catch (err) {
            notify("error", err.response?.data || "Failed to save device");
        }
    };

    const updateHash = async (device) => {
        try {
            await axios.put(
                `${baseUrl}/${device.id}/`,
                device,
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            notify("success", "Hashcode updated");
            setShowDialog(false);
            fetchDevices();
        } catch (err) {
            notify("error", err.response?.data || "Failed to update device hash");
        }
    };


    // ---------------------------------------------------------
    // Delete
    // ---------------------------------------------------------
    const deleteDevice = async (id) => {
        try {
            await axios.delete(`${baseUrl}/${id}`, {
                headers: { "Authorization": `Bearer ${token}`, },
            });

            notify("success", "Device deleted");
            setDeleteId(null);
            fetchDevices();
        } catch {
            notify("error", "Unable to delete device");
        }
    };

    // ---------------------------------------------------------
    // Search + Pagination
    // ---------------------------------------------------------
    const filtered = devices.filter((d) =>
        d.fingerprintHash.toLowerCase().includes(search.toLowerCase()) ||
        d.department?.toLowerCase().includes(search.toLowerCase()) ||
        d.location?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const currentItems = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ---------------------------------------------------------
    // CSV Export
    // ---------------------------------------------------------
    const exportCSV = () => {
        if (devices.length === 0) {
            notify("error", "No devices to export");
            return;
        }

        const headers = [
            "ID",
            "Station ID",
            "Fingerprint Hash",
            "User Agent",
            "Resolution",
            "Timezone",
            "Language",
            "Canvas FP",
            "WebGL FP",
            "Department",
            "Location",
            "Is Active",
            "Last Seen",
        ];

        const rows = devices.map((d) => [
            d.id,
            d.stationId,
            d.fingerprintHash,
            d.browserUserAgent,
            d.screenResolution,
            d.timezone,
            d.language,
            d.canvasFingerprint,
            d.webglFingerprint,
            d.department,
            d.location,
            d.isActive ? "Yes" : "No",
            d.lastSeen || "",
        ]);

        const csv = [
            headers.join(","),
            ...rows.map((row) =>
                row
                    .map((cell) => {
                        const v = `${cell ?? ""}`;
                        return v.includes(",") || v.includes('"')
                            ? `"${v.replace(/"/g, '""')}"`
                            : v;
                    })
                    .join(",")
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `device_fingerprints_${new Date()
            .toISOString()
            .split("T")[0]}.csv`;
        a.click();

        notify("success", "CSV exported");
    };

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------
    return (
        <div className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 to-purple-100">

            {notification && <Notification notification={notification} />}

            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Device Fingerprints
                    </h1>
                    <p className="text-gray-600">
                        Register and manage trusted devices across stations
                    </p>
                </div>

                {/* Action Bar (Add - Search - Export) */}
                <div className="flex gap-4 mb-8 flex-wrap items-center">

                    {/* Add New */}
                    <button
                        onClick={openNewDialog}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                        <Plus size={20} />
                        Add Device
                    </button>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by hash, department, or location..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />

                    {/* Export CSV */}
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                        <Download size={20} />
                        Export CSV
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    {loading ? (
                        <p className="p-6 text-gray-500">Loading…</p>
                    ) : filtered.length === 0 ? (
                        <p className="p-6 text-center text-gray-500">
                            No devices found.
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Station
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Fingerprint
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Dept
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Last Seen
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentItems.map((d) => (
                                    <tr
                                        key={d.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4">{d.stationId}</td>

                                        <td className="px-6 py-4 text-xs break-all text-gray-700">
                                            {d.fingerprintHash}
                                        </td>

                                        <td className="px-6 py-4">{d.department}</td>

                                        <td className="px-6 py-4">
                                            {d.location || "-"}
                                        </td>

                                        <td className="px-6 py-4">
                                            {d.lastSeen
                                                ? new Date(d.lastSeen).toLocaleString()
                                                : "-"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex gap-3">
                                                <button
                                                    className="text-indigo-600 hover:text-indigo-800 transition"
                                                    onClick={() => openEditDialog(d)}
                                                >
                                                    <Edit2 size={18} />
                                                </button>

                                                <button
                                                    className="text-red-600 hover:text-red-800 transition"
                                                    onClick={() => setDeleteId(d.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                            <div className="text-sm text-gray-600">
                                Showing {(currentPage - 1) * itemsPerPage + 1}–
                                {Math.min(currentPage * itemsPerPage, filtered.length)}{" "}
                                of {filtered.length} devices
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(1)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                                >
                                    First
                                </button>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                                >
                                    Prev
                                </button>

                                {/* Page numbers */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(
                                        (num) =>
                                            num === 1 ||
                                            num === totalPages ||
                                            (num >= currentPage - 1 &&
                                                num <= currentPage + 1)
                                    )
                                    .map((num, i, arr) => (
                                        <React.Fragment key={num}>
                                            {i > 0 && num - arr[i - 1] > 1 && (
                                                <span className="px-2 text-gray-500">…</span>
                                            )}

                                            <button
                                                onClick={() => setCurrentPage(num)}
                                                className={`px-3 py-2 rounded-lg text-sm ${num === currentPage
                                                    ? "bg-indigo-600 text-white"
                                                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        </React.Fragment>
                                    ))}

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                                >
                                    Next
                                </button>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dialogs */}
                {showDialog && dialogType === "create" && (
                    <DeviceDialog
                        device={selectedDevice}
                        close={() => setShowDialog(false)}
                        submit={saveDevice}
                        notify={notify}
                    />
                )}

                {showDialog && dialogType === "editHash" && (
                    <UpdateDeviceHashDialog
                        device={selectedDevice}
                        close={() => setShowDialog(false)}
                        submit={updateHash}
                        notify={notify}
                    />
                )}


                {deleteId && (
                    <DeleteDialog
                        deleteConfirmId={deleteId}
                        setDeleteConfirmId={setDeleteId}
                        confirmDelete={() => deleteDevice(deleteId)}
                        name="device"
                    />
                )}
            </div>
        </div>
    );
}
