// Updated PrescriberPage.jsx – styled like StationPage & UserPage
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Download } from "lucide-react";
import axios from "axios";

import init from "../../init";
import Notification from "../../components/Notification";
import DeleteDialog from "../../components/DeleteDialog";
import PrescriberDialog from "./PrescriberDialog";
import { useUser } from "../../context/UserContext";

export default function PrescriberPage() {
    const { appUser, token } = useUser();

    const [prescribers, setPrescribers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [notification, setNotification] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Search
    const [search, setSearch] = useState("");

    const apiUrl = `/${init.appName}/api/prescribers`;

    // ---------------------------------------------
    // Notifications
    // ---------------------------------------------
    const notify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // ---------------------------------------------
    // Fetch Prescribers
    // ---------------------------------------------
    const fetchPrescribers = () => {
        axios
            .get(`${apiUrl}?page=0&size=500`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            })
            .then((res) => setPrescribers(res.data.content || []))
            .catch(() => notify("error", "Failed to load prescribers"));
    };

    useEffect(() => {
        if (appUser?.email) fetchPrescribers();
    }, [appUser]);

    // ---------------------------------------------
    // Search / Pagination
    // ---------------------------------------------
    const filtered = prescribers.filter((p) => {
        const s = search.toLowerCase();
        return (
            p.npi?.toLowerCase().includes(s) ||
            p.firstName?.toLowerCase().includes(s) ||
            p.lastName?.toLowerCase().includes(s)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const pageData = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ---------------------------------------------
    // Dialog Handlers
    // ---------------------------------------------
    const openNew = () => {
        setSelected(null);
        setShowDialog(true);
    };

    const openEdit = (p) => {
        setSelected(p);
        setShowDialog(true);
    };

    // ---------------------------------------------
    // Save
    // ---------------------------------------------
    const savePrescriber = (data) => {
        const payload = { ...data };

        const req = data.id
            ? axios.put(`${apiUrl}/${data.id}`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            })
            : axios.post(apiUrl, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

        req.then(() => {
            notify("success", data.id ? "Prescriber updated" : "Prescriber created");
            fetchPrescribers();
            setShowDialog(false);
        }).catch(() => notify("error", "Failed to save prescriber"));
    };

    // ---------------------------------------------
    // Delete
    // ---------------------------------------------
    const confirmDelete = (id) => setDeleteId(id);

    const handleDelete = () => {
        axios
            .delete(`${apiUrl}/${deleteId}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            })
            .then(() => {
                notify("success", "Prescriber deleted");
                fetchPrescribers();
                setDeleteId(null);
            })
            .catch(() => notify("error", "Delete failed"));
    };

    // ---------------------------------------------
    // Export CSV (table-level)
    // ---------------------------------------------
    const exportCSV = () => {
        const header = [
            "id", "npi", "firstName", "lastName", "middleName", "suffix",
            "clinicName", "deaNumber", "stateLicenseNumber", "taxonomyCode",
            "erxIdentifier", "ncpdpProviderId", "epcsEnabled", "active"
        ];

        const rows = prescribers.map((p) =>
            header.map((h) => JSON.stringify(p[h] ?? "")).join(",")
        );

        const csv = [header.join(","), ...rows].join("\n");

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        link.download = "prescribers.csv";
        link.click();

        notify("success", "CSV exported");
    };

    // ---------------------------------------------
    // RENDER
    // ---------------------------------------------
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
            {notification && <Notification notification={notification} />}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Prescriber Management
                </h1>
                <p className="text-gray-600 mb-8">
                    Manage prescribers and their information.
                </p>

                {/* ACTION BAR */}
                <div className="flex gap-4 mb-8 flex-wrap items-center">
                    
                    {/* Left: Add Prescriber */}
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                        <Plus size={20} />
                        Add Prescriber
                    </button>

                    {/* Middle: Search */}
                    <input
                        type="text"
                        placeholder="Search by NPI or name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />

                    {/* Right: Export CSV */}
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                        <Download size={20} />
                        Export CSV
                    </button>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No prescribers found.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        NPI
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Clinic
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Active
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-900">{p.npi}</td>

                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {p.lastName}, {p.firstName}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {p.clinicName || ""}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    p.active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-200 text-gray-700"
                                                }`}
                                            >
                                                {p.active ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <button
                                                className="text-indigo-600 hover:text-indigo-800 transition"
                                                onClick={() => openEdit(p)}
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>

                                            <button
                                                className="text-red-600 hover:text-red-800 transition"
                                                onClick={() => confirmDelete(p.id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* PAGINATION */}
                {filtered.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                            {/* Rows per page */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                    Rows:
                                </span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(parseInt(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            {/* Page Info */}
                            <div className="text-sm text-gray-600 font-medium">
                                Showing {(currentPage - 1) * itemsPerPage + 1}–
                                {Math.min(currentPage * itemsPerPage, filtered.length)}{" "}
                                of {filtered.length} prescribers
                            </div>

                            {/* Pagination buttons */}
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
                                                className={`px-3 py-2 rounded-lg text-sm ${
                                                    num === currentPage
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

                {/* DELETE DIALOG */}
                {deleteId && (
                    <DeleteDialog
                        deleteConfirmId={deleteId}
                        setDeleteConfirmId={setDeleteId}
                        confirmDelete={handleDelete}
                        name="prescriber"
                    />
                )}

                {/* CREATE / EDIT DIALOG */}
                {showDialog && (
                    <PrescriberDialog
                        prescriber={selected}
                        onClose={() => setShowDialog(false)}
                        onSave={savePrescriber}
                        notify={notify}
                    />
                )}
            </div>
        </div>
    );
}
