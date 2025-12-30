import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import Notification from "../../components/Notification";
import { useUser } from "../../context/UserContext";

import {
    Plus,
    Trash2,
    Pencil,
    Download,
    X,
    List,
} from "lucide-react";

export default function InsuranceCompanyWithPlansPage() {
    const { appUser, token } = useUser();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchFilter, setSearchFilter] = useState("");

    const [notification, setNotification] = useState(null);

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // dialogs
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);

    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedPlans, setSelectedPlans] = useState([]);

    // company form
    const [formData, setFormData] = useState({
        payerName: "",
        payerId: "",
        phoneNumber: "",
        website: "",
        notes: "",
        active: true,
    });

    // full plan rows (schema B)
    const [planRows, setPlanRows] = useState([]);

    // -------------------------------------------------------------------
    // Notification helpers
    // -------------------------------------------------------------------
    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // -------------------------------------------------------------------
    // Fetch companies
    // -------------------------------------------------------------------
    const fetchCompanies = () => {
        if (!appUser?.email) return;

        setLoading(true);

        axios
            .get(`/${init.appName}/api/insurance-companies-with-plans?page=0&size=200`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            })
            .then((res) => {
                const payload = res.data;
                const list = payload?.content || payload || [];
                setCompanies(Array.isArray(list) ? list : []);
            })
            .catch(() => showNotification("Failed to load insurance companies", "error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCompanies();
    }, [appUser]);

    // -------------------------------------------------------------------
    // Filtering + Pagination
    // -------------------------------------------------------------------
    const filteredCompanies = companies.filter((c) => {
        const s = searchFilter.toLowerCase();
        return (
            c.payerName?.toLowerCase().includes(s) ||
            c.payerId?.toLowerCase().includes(s) ||
            c.phoneNumber?.toLowerCase().includes(s) ||
            c.website?.toLowerCase().includes(s)
        );
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCompanies.length / itemsPerPage)
    );
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(parseInt(e.target.value, 10));
        setCurrentPage(1);
    };

    // -------------------------------------------------------------------
    // CSV Export
    // -------------------------------------------------------------------
    const exportToCSV = () => {
        if (companies.length === 0) {
            showNotification("No companies to export", "error");
            return;
        }

        const headers = [
            "Company ID",
            "Payer Name",
            "Payer ID",
            "Phone Number",
            "Website",
            "Active",
            "Plan Count",
        ];

        const rows = companies.map((c) => {
            const planCount = c.insurancePlans?.length || 0;
            return [
                c.id || "",
                c.payerName || "",
                c.payerId || "",
                c.phoneNumber || "",
                c.website || "",
                c.active ? "Active" : "Inactive",
                planCount.toString(),
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map((row) =>
                row
                    .map((cell) => {
                        const val = cell == null ? "" : String(cell);
                        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                            return `"${val.replace(/"/g, '""')}"`;
                        }
                        return val;
                    })
                    .join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `insurance_companies_${new Date()
            .toISOString()
            .split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification("Companies exported to CSV", "success");
    };

    // -------------------------------------------------------------------
    // View plans popup
    // -------------------------------------------------------------------
    const viewPlans = (company) => {
        setSelectedCompany(company);
        setSelectedPlans(company.insurancePlans || []);
    };

    const closePlansPopup = () => {
        setSelectedCompany(null);
        setSelectedPlans([]);
    };

    // -------------------------------------------------------------------
    // Add / Edit form
    // -------------------------------------------------------------------
    const openNewForm = () => {
        setEditingCompany(null);
        setFormData({
            payerName: "",
            payerId: "",
            phoneNumber: "",
            website: "",
            notes: "",
            active: true,
        });
        setPlanRows([]);
        setShowForm(true);
    };

    const openEditForm = (company) => {
        setEditingCompany(company);
        setFormData({
            payerName: company.payerName || "",
            payerId: company.payerId || "",
            phoneNumber: company.phoneNumber || "",
            website: company.website || "",
            notes: company.notes || "",
            active: company.active,
        });

        // Map existing insurance plans into full B schema rows
        const rows =
            (company.insurancePlans || []).map((p) => ({
                id: p.id || null,
                planName: p.planName || "",
                payerName: p.payerName || company.payerName || "",
                payerId: p.payerId || company.payerId || "",
                bin: p.bin || "",
                pcn: p.pcn || "",
                groupNumber: p.groupNumber || "",
                phoneNumber: p.phoneNumber || company.phoneNumber || "",
                notes: p.notes || "",
                active: typeof p.active === "boolean" ? p.active : true,
            })) || [];

        setPlanRows(rows);
        setShowForm(true);
    };

    const handleCompanyField = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // plan row helpers (full B schema)
    const addPlanRow = () => {
        setPlanRows((prev) => [
            ...prev,
            {
                id: null,
                planName: "",
                payerName: formData.payerName || "",
                payerId: formData.payerId || "",
                bin: "",
                pcn: "",
                groupNumber: "",
                phoneNumber: formData.phoneNumber || "",
                notes: "",
                active: true,
            },
        ]);
    };

    const updatePlanRow = (idx, field, value) => {
        setPlanRows((prev) => {
            const copy = [...prev];
            copy[idx][field] = value;
            return copy;
        });
    };

    const togglePlanActive = (idx) => {
        setPlanRows((prev) => {
            const copy = [...prev];
            copy[idx].active = !copy[idx].active;
            return copy;
        });
    };

    const removePlanRow = (idx) => {
        setPlanRows((prev) => prev.filter((_, i) => i !== idx));
    };

    // -------------------------------------------------------------------
    // Save (Insert / Update)
    // -------------------------------------------------------------------
    const saveCompany = () => {
        if (!formData.payerName.trim()) {
            showNotification("Payer name is required", "error");
            return;
        }

        // Ensure plan payerName / payerId / phoneNumber are synced from company
        const normalizedPlans = planRows.map((p) => ({
            ...p,
            payerName: formData.payerName,
            payerId: formData.payerId,
            phoneNumber: formData.phoneNumber,
        }));

        const payload = {
            ...formData,
            insurancePlans: normalizedPlans,
        };

        let req;
        if (editingCompany) {
            payload.id = editingCompany.id;
            req = axios.put(
                `/${init.appName}/api/insurance-companies-with-plans`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );
        } else {
            req = axios.post(
                `/${init.appName}/api/insurance-companies-with-plans`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );
        }

        req
            .then(() => {
                showNotification(
                    editingCompany ? "Company updated successfully" : "Company created successfully",
                    "success"
                );
                fetchCompanies();
                setShowForm(false);
                setEditingCompany(null);
            })
            .catch(() => showNotification("Failed to save company", "error"));
    };

    // -------------------------------------------------------------------
    // Delete company
    // -------------------------------------------------------------------
    const deleteCompany = (company) => {
        if (!window.confirm("Delete this insurance company and all its plans?")) return;

        axios
            .delete(
                `/${init.appName}/api/insurance-companies-with-plans/${company.id}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            )
            .then(() => {
                showNotification("Company deleted successfully", "success");
                fetchCompanies();
            })
            .catch(() => showNotification("Failed to delete company", "error"));
    };

    // -------------------------------------------------------------------
    // Export Plans to CSV
    // -------------------------------------------------------------------
    const exportPlansToCSV = () => {
        if (!selectedPlans || selectedPlans.length === 0) {
            showNotification("No plans available to export", "error");
            return;
        }

        const headers = [
            "Plan ID",
            "Plan Name",
            "Payer Name",
            "Payer ID",
            "BIN",
            "PCN",
            "Group Number",
            "Phone Number",
            "Notes",
            "Active"
        ];

        const rows = selectedPlans.map((p) => [
            p.id || "",
            p.planName || "",
            p.payerName || "",
            p.payerId || "",
            p.bin || "",
            p.pcn || "",
            p.groupNumber || "",
            p.phoneNumber || "",
            p.notes || "",
            p.active ? "Active" : "Inactive"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) =>
                r
                    .map((cell) => {
                        const val = cell == null ? "" : String(cell);
                        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                            return `"${val.replace(/"/g, '""')}"`;
                        }
                        return val;
                    })
                    .join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `plans_${selectedCompany?.payerName || "company"}_${new Date()
            .toISOString()
            .split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showNotification("Plans exported successfully", "success");
    };


    // -------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
            {/* Notification Toast */}
            {notification && <Notification notification={notification} />}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Insurance Company Management
                    </h1>
                    <p className="text-gray-600">
                        Manage insurance payers and their plans
                    </p>
                </div>

                {/* Actions + Search + Export */}
                <div className="flex gap-4 mb-8 flex-wrap items-center">
                    <button
                        onClick={openNewForm}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                        <Plus size={20} />
                        Add Company
                    </button>

                    <input
                        type="text"
                        placeholder="Search by payer name, payer ID, phone or website..."
                        value={searchFilter}
                        onChange={(e) => {
                            setSearchFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-1 min-w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />

                    <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold text-gray-700">
                            Total Companies:{" "}
                            <span className="text-indigo-600">{companies.length}</span>
                        </div>

                        <button
                            onClick={exportToCSV}
                            disabled={companies.length === 0}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                            title="Export companies to CSV"
                        >
                            <Download size={20} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Companies Table */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading...</div>
                    ) : companies.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 text-lg">
                                No insurance companies yet. Add one to get started!
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Payer Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Payer ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Phone
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Website
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Plans
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentCompanies.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                {c.payerName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {c.payerId}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {c.phoneNumber}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {c.website ? (
                                                    <a
                                                        href={c.website}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-indigo-600 underline"
                                                    >
                                                        {c.website}
                                                    </a>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${c.active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                        }`}
                                                >
                                                    {c.active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() => viewPlans(c)}
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition"
                                                    title="View plans"
                                                >
                                                    <List size={18} />
                                                    <span>View ({c.insurancePlans?.length || 0})</span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => openEditForm(c)}
                                                        className="text-indigo-600 hover:text-indigo-800 transition"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCompany(c)}
                                                        className="text-red-600 hover:text-red-800 transition"
                                                        title="Delete"
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
                {filteredCompanies.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Items per page */}
                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="itemsPerPage"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Rows per page:
                                </label>
                                <select
                                    id="itemsPerPage"
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>

                            {/* Page info */}
                            <div className="text-sm text-gray-600 font-medium">
                                Showing {startIndex + 1} to{" "}
                                {Math.min(endIndex, filteredCompanies.length)} of{" "}
                                {filteredCompanies.length} companies
                            </div>

                            {/* Page buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                        (page) => {
                                            if (
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentPage === page
                                                            ? "bg-indigo-600 text-white"
                                                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                (page === 2 && currentPage > 3) ||
                                                (page === totalPages - 1 &&
                                                    currentPage < totalPages - 2)
                                            ) {
                                                return (
                                                    <span key={page} className="px-2 text-gray-500">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        }
                                    )}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Plans Popup */}
                {selectedCompany && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">

                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">

                                <h2 className="text-2xl font-bold text-gray-900">
                                    Plans for {selectedCompany.payerName}
                                </h2>

                                <div className="flex items-center gap-4">

                                    {/* Export CSV */}
                                    <button
                                        onClick={exportPlansToCSV}
                                        className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium"
                                        title="Export plans to CSV"
                                    >
                                        <Download size={20} />
                                        Export CSV
                                    </button>

                                    {/* Close */}
                                    <button
                                        onClick={closePlansPopup}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {selectedPlans.length === 0 ? (
                                    <p className="text-gray-500">No plans for this company.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white rounded shadow">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="p-3 text-left text-sm font-semibold text-gray-900">
                                                        Plan Name
                                                    </th>
                                                    <th className="p-3 text-left text-sm font-semibold text-gray-900">
                                                        BIN
                                                    </th>
                                                    <th className="p-3 text-left text-sm font-semibold text-gray-900">
                                                        PCN
                                                    </th>
                                                    <th className="p-3 text-left text-sm font-semibold text-gray-900">
                                                        Group #
                                                    </th>
                                                    <th className="p-3 text-left text-sm font-semibold text-gray-900">
                                                        Active
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPlans.map((p) => (
                                                    <tr key={p.id} className="border-t">
                                                        <td className="p-3 text-sm text-gray-900">{p.planName}</td>
                                                        <td className="p-3 text-sm text-gray-600">{p.bin}</td>
                                                        <td className="p-3 text-sm text-gray-600">{p.pcn}</td>
                                                        <td className="p-3 text-sm text-gray-600">{p.groupNumber}</td>
                                                        <td className="p-3 text-sm text-gray-600">
                                                            {p.active ? "Yes" : "No"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={closePlansPopup}
                                        className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Add / Edit Dialog (UserDialog style) */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingCompany ? "Edit Company" : "Add New Company"}
                                </h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Company Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Payer Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="payerName"
                                            value={formData.payerName}
                                            onChange={handleCompanyField}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Payer ID
                                        </label>
                                        <input
                                            type="text"
                                            name="payerId"
                                            value={formData.payerId}
                                            onChange={handleCompanyField}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleCompanyField}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Website
                                        </label>
                                        <input
                                            type="text"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleCompanyField}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={handleCompanyField}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={formData.active}
                                        onChange={handleCompanyField}
                                        className="w-4 h-4"
                                    />
                                    <span className="font-medium">Active Company</span>
                                </div>

                                {/* Plans Editor */}
                                <div className="border p-4 rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-semibold">
                                            Insurance Plans for this Company
                                        </h3>
                                        <button
                                            onClick={addPlanRow}
                                            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                        >
                                            <Plus size={16} />
                                            Add Plan
                                        </button>
                                    </div>

                                    {planRows.length === 0 ? (
                                        <p className="text-gray-500 text-sm">
                                            No plans added. Click &ldquo;Add Plan&rdquo; to create one.
                                        </p>
                                    ) : (
                                        planRows.map((row, idx) => (
                                            <div
                                                key={idx}
                                                className="border rounded-lg p-3 mb-3 bg-white shadow-sm"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">
                                                            Plan Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={row.planName}
                                                            onChange={(e) =>
                                                                updatePlanRow(idx, "planName", e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1">
                                                                BIN
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={row.bin}
                                                                onChange={(e) =>
                                                                    updatePlanRow(idx, "bin", e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1">
                                                                PCN
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={row.pcn}
                                                                onChange={(e) =>
                                                                    updatePlanRow(idx, "pcn", e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1">
                                                                Group #
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={row.groupNumber}
                                                                onChange={(e) =>
                                                                    updatePlanRow(
                                                                        idx,
                                                                        "groupNumber",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">
                                                            Plan Phone (optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={row.phoneNumber}
                                                            onChange={(e) =>
                                                                updatePlanRow(
                                                                    idx,
                                                                    "phoneNumber",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">
                                                            Notes
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={row.notes}
                                                            onChange={(e) =>
                                                                updatePlanRow(idx, "notes", e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={row.active}
                                                            onChange={() => togglePlanActive(idx)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span>Active Plan</span>
                                                    </label>

                                                    <button
                                                        onClick={() => removePlanRow(idx)}
                                                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        <Trash2 size={16} />
                                                        Remove Plan
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer actions */}
                                <div className="flex justify-end gap-4 pt-4 border-t">
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 border rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveCompany}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
                                    >
                                        {editingCompany ? "Update Company" : "Create Company"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
