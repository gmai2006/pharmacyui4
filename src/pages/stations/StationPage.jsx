import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Download } from "lucide-react";

import init from "../../init";
import { useUser } from "../../context/UserContext";
import Notification from "../../components/Notification";

import StationDialog from "./StationDialog";
import DeleteDialog from "../../components/DeleteDialog";
import axios from "axios";

const baseUrl = `/${init.appName}/api/stations`;

export default function StationPage() {
    const { appUser, token } = useUser();

    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedStation, setSelectedStation] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [notification, setNotification] = useState(null);

    const [search, setSearch] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    // ---------------------------------------------------------
    // Notification helper
    // ---------------------------------------------------------
    const notify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // ---------------------------------------------------------
    // Fetch stations
    // ---------------------------------------------------------
    const fetchStations = () => {
        if (!appUser?.email) return;

        setLoading(true);

        axios
            .get(`/${init.appName}/api/stations?page=0&size=200`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            })
            .then((res) => {
                const data = res.data;
                setStations(data.content || []);
            })
            .catch(() => notify("error", "Failed to load stations"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStations();
    }, [appUser]);

    // ---------------------------------------------------------
    // Create Station
    // ---------------------------------------------------------
    const createStation = async (station) => {
        try {
            const res = await fetch(baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(station),
            });

            if (!res.ok) throw new Error("Failed to create station");

            const created = await res.json();
            setStations([created, ...stations]);
            notify("success", "Station created successfully");
        } catch (err) {
            notify("error", err.message);
        }
    };

    // ---------------------------------------------------------
    // Update Station
    // ---------------------------------------------------------
    const updateStation = async (station) => {
        try {
            const res = await fetch(`${baseUrl}/${station.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(station),
            });

            if (!res.ok) throw new Error("Failed to update station");

            const updated = await res.json();
            setStations(stations.map((s) => (s.id === updated.id ? updated : s)));

            notify("success", "Station updated successfully");
        } catch (err) {
            notify("error", err.message);
        }
    };

    // ---------------------------------------------------------
    // Delete Station
    // ---------------------------------------------------------
    const deleteStation = async (id) => {
        try {
            const res = await fetch(`${baseUrl}/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to delete station");

            setStations(stations.filter((s) => s.id !== id));
            notify("success", "Station deleted successfully");
        } catch (err) {
            notify("error", err.message);
        }
    };

    const handleSubmit = (station) => {
        if (station.id) updateStation(station);
        else createStation(station);

        setSelectedStation(null);
        setShowDialog(false);
    };

    // ---------------------------------------------------------
    // Search filter
    // ---------------------------------------------------------
    const filtered = stations.filter((s) => {
        const t = search.toLowerCase();
        return (
            s.stationPrefix.toLowerCase().includes(t) ||
            s.department.toLowerCase().includes(t) ||
            (s.location || "").toLowerCase().includes(t)
        );
    });

    // ---------------------------------------------------------
    // Pagination logic
    // ---------------------------------------------------------
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentItems = filtered.slice(startIdx, endIdx);

    // ---------------------------------------------------------
    // CSV Export
    // ---------------------------------------------------------
    const exportToCSV = () => {
        if (stations.length === 0) {
            notify("error", "No stations to export");
            return;
        }

        const headers = [
            "ID",
            "Station Prefix",
            "Department",
            "Location",
        ];

        const rows = stations.map((s) => [
            s.id || "",
            s.stationPrefix || "",
            s.department || "",
            s.location || "",
        ]);

        const csv = [
            headers.join(","),
            ...rows.map((row) =>
                row
                    .map((cell) => {
                        const v = `${cell ?? ""}`;
                        if (v.includes(",") || v.includes('"')) {
                            return `"${v.replace(/"/g, '""')}"`;
                        }
                        return v;
                    })
                    .join(",")
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `stations_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        notify("success", "Stations exported to CSV");
    };

    // ---------------------------------------------------------
    // JSX
    // ---------------------------------------------------------
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">

            {notification && <Notification notification={notification} />}

            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Stations</h1>
                        <p className="text-gray-600">Configure pharmacy workflow stations</p>
                    </div>
                </div>

                {/* Actions Row */}
                <div className="flex gap-4 mb-8 flex-wrap items-center">

                    {/* Left: Add Station */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => {
                                setSelectedStation(null);
                                setShowDialog(true);
                            }}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                            <Plus size={20} />
                            Add Station
                        </button>
                    </div>

                    {/* Middle: Search Field */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search prefix, department, or location..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Right: Export CSV */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={exportToCSV}
                            disabled={stations.length === 0}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                            title="Export stations to CSV"
                        >
                            <Download size={20} />
                            Export CSV
                        </button>
                    </div>

                </div>


                {/* Table */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No stations found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Prefix
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Department
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Location
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((st) => (
                                        <tr
                                            key={st.id}
                                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-900">{st.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{st.stationPrefix}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{st.department}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{st.location}</td>

                                            <td className="px-6 py-4">
                                                <div className="flex gap-3">
                                                    <button
                                                        className="text-indigo-600 hover:text-indigo-800 transition"
                                                        onClick={() => {
                                                            setSelectedStation(st);
                                                            setShowDialog(true);
                                                        }}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:text-red-800 transition"
                                                        onClick={() => setDeleteId(st.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                            {/* Items Per Page */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Rows per page:
                                </label>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(parseInt(e.target.value, 10));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    <option value={6}>6</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                </select>
                            </div>

                            {/* Page Info */}
                            <div className="text-sm text-gray-600 font-medium">
                                Showing {startIdx + 1} to {Math.min(endIdx, filtered.length)} of{" "}
                                {filtered.length} stations
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                                >
                                    Prev
                                </button>

                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-2 rounded-lg text-sm ${page === currentPage
                                                        ? "bg-indigo-600 text-white"
                                                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }
                                    if (
                                        (page === 2 && currentPage > 3) ||
                                        (page === totalPages - 1 && currentPage < totalPages - 2)
                                    ) {
                                        return (
                                            <span key={page} className="px-2 text-gray-500">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dialogs */}
                {showDialog && (
                    <StationDialog
                        station={selectedStation}
                        close={() => setShowDialog(false)}
                        submit={handleSubmit}
                        showNotification={notify}
                    />
                )}

                {deleteId && (
                    <DeleteDialog
                        deleteConfirmId={deleteId}
                        setDeleteConfirmId={setDeleteId}
                        confirmDelete={() => {
                            deleteStation(deleteId);
                            setDeleteId(null);
                        }}
                        name="station"
                    />
                )}
            </div>
        </div>
    );
}
