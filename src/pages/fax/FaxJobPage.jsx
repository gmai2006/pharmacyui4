import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Trash2, Eye } from 'lucide-react';

import init from "../../init";
import Notification from '../../components/Notification';
import DeleteDialog from '../../components/DeleteDialog';
import { useUser } from "../../context/UserContext";
import { getErrorMessage } from '../../utils/util';

const faxJobsUrl = `/${init.appName}/api/efax-jobs`;
const downloadUrl = (id) => `/${init.appName}/api/efax-jobs/${id}/document`;

const statusColors = {
    queued: "bg-gray-100 text-gray-800",
    preparing: "bg-yellow-100 text-yellow-800",
    sending: "bg-blue-100 text-blue-800",
    sent: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    received: "bg-purple-100 text-purple-800"
};

const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    normal: "bg-blue-100 text-blue-800",
    high: "bg-red-100 text-red-800"
};

const FaxJobPage = () => {
    const { appUser, token } = useUser();

    const [faxJobs, setFaxJobs] = useState([]);
    const [notification, setNotification] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [searchFilter, setSearchFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // -----------------------------------------------------------------------
    // FETCH FAX JOBS
    // -----------------------------------------------------------------------
    const fetchFaxJobs = async () => {
        if (!appUser?.email) return;
        try {
            const response = await fetch(faxJobsUrl, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch efax jobs");
            }

            const jsonData = await response.json();
            setFaxJobs(jsonData.content || jsonData); // depends on backend wrapper

        } catch (error) {
            showNotification(getErrorMessage(error), "error");
        }
    };

    useEffect(() => {
        fetchFaxJobs();
    }, [appUser]);

    // Auto-hide notifications
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // -----------------------------------------------------------------------
    // DOWNLOAD PDF DOCUMENT
    // -----------------------------------------------------------------------
    const handleDownload = async (jobId) => {
        try {
            const url = downloadUrl(jobId);
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to download document");
            }

            const blob = await response.blob();
            const filename = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "")
                || `fax-document-${jobId}.pdf`;

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();

            showNotification("Document downloaded successfully", "success");

        } catch (error) {
            showNotification(getErrorMessage(error), "error");
        }
    };

    // -----------------------------------------------------------------------
    // DELETE JOB
    // -----------------------------------------------------------------------
    const deleteFaxJob = async (jobId) => {
        try {
            const response = await fetch(`${faxJobsUrl}/${jobId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error("Failed to delete fax job");
            }

            setFaxJobs(prev => prev.filter(j => j.id !== jobId));
            showNotification("EFax job deleted successfully", "success");

        } catch (error) {
            showNotification(getErrorMessage(error), "error");
        }
    };

    // -----------------------------------------------------------------------
    // FILTER + SEARCH
    // -----------------------------------------------------------------------
    const filteredJobs = faxJobs.filter(job => {
        const query = searchFilter.toLowerCase();
        return (
            job.subject?.toLowerCase().includes(query) ||
            job.providerName?.toLowerCase().includes(query) ||
            job.faxNumber?.toLowerCase().includes(query) ||
            job.direction?.toLowerCase().includes(query) ||
            job.status?.toLowerCase().includes(query)
        );
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(Math.max(1, Math.min(totalPages, page)));
    };

    // -----------------------------------------------------------------------
    // EXPORT CSV (mirrors UserPage style)
    // -----------------------------------------------------------------------
    const exportToCSV = () => {
        if (faxJobs.length === 0) {
            showNotification("No fax jobs to export", "error");
            return;
        }

        // CSV columns
        const csvHeaders = [
            "ID",
            "Subject",
            "Provider",
            "Fax Number",
            "Direction",
            "Status",
            "Priority",
            "Created At",
            "Completed At"
        ];

        const csvRows = faxJobs.map(job => [
            job.id,
            job.subject || "",
            job.providerName || "",
            job.faxNumber || "",
            job.direction || "",
            job.status || "",
            job.priority || "",
            job.createdAt ? new Date(job.createdAt).toISOString() : "",
            job.completedAt ? new Date(job.completedAt).toISOString() : ""
        ]);

        const csvContent = [
            csvHeaders.join(","),
            ...csvRows.map(row =>
                row
                    .map(cell =>
                        typeof cell === "string" && (cell.includes(",") || cell.includes("\""))
                            ? `"${cell.replace(/"/g, '""')}"`
                            : cell
                    )
                    .join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `fax_jobs_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();

        showNotification("Fax jobs exported successfully", "success");
    };


    // -----------------------------------------------------------------------
    // UI RENDERING
    // -----------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">

            {notification && (
                <Notification notification={notification} />
            )}

            <div className="max-w-7xl mx-auto">

                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Fax Job Dashboard</h1>
                    <p className="text-gray-600">Monitor fax transmissions, downloads, and status history</p>
                </div>

                {/* Search + Count */}
                {/* Search + Total + Export CSV */}
                <div className="flex flex-wrap items-center justify-between mb-8 gap-4">

                    {/* Search Box */}
                    <input
                        type="text"
                        placeholder="Search by subject, status, provider, fax number..."
                        value={searchFilter}
                        onChange={(e) => {
                            setSearchFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-1 min-w-64 px-4 py-3 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Right Side: Total Jobs + Export */}
                    <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold text-gray-700">
                            Total Jobs: <span className="text-blue-600">{faxJobs.length}</span>
                        </div>

                        <button
                            onClick={exportToCSV}
                            disabled={faxJobs.length === 0}
                            className="
                flex items-center gap-2 
                bg-green-600 text-white 
                px-6 py-3 rounded-lg 
                hover:bg-green-700 
                disabled:bg-gray-400 disabled:cursor-not-allowed 
                transition font-medium
            "
                            title="Export fax jobs to CSV"
                        >
                            <Download size={20} />
                            Export CSV
                        </button>
                    </div>
                </div>


                {/* JOBS TABLE */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">

                    {faxJobs.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-lg">
                            No fax jobs found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Subject</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Provider</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Fax Number</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Direction</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Priority</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentJobs.map(job => (
                                        <tr key={job.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4">{job.subject}</td>
                                            <td className="px-6 py-4">{job.providerName}</td>
                                            <td className="px-6 py-4">{job.faxNumber}</td>
                                            <td className="px-6 py-4 capitalize">{job.direction}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status]}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[job.priority]}`}>
                                                    {job.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {job.createdAt ? new Date(job.createdAt).toLocaleString() : ""}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-3">

                                                    {/* View Job (future modal) */}
                                                    <button
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="View Job Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    {/* Download PDF */}
                                                    <button
                                                        className="text-green-600 hover:text-green-800"
                                                        onClick={() => handleDownload(job.id)}
                                                        title="Download Fax PDF"
                                                    >
                                                        <Download size={18} />
                                                    </button>

                                                    {/* Retry (future queue processor) */}
                                                    <button
                                                        className="text-yellow-600 hover:text-yellow-800"
                                                        title="Retry sending fax"
                                                        onClick={() => showNotification('Retry not implemented yet', 'error')}
                                                    >
                                                        <RefreshCw size={18} />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete Fax Job"
                                                        onClick={() => setDeleteConfirmId(job.id)}
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

                {/* DELETE CONFIRMATION */}
                {deleteConfirmId && (
                    <DeleteDialog
                        deleteConfirmId={deleteConfirmId}
                        setDeleteConfirmId={setDeleteConfirmId}
                        confirmDelete={() => {
                            deleteFaxJob(deleteConfirmId);
                            setDeleteConfirmId(null);
                        }}
                        name="fax job"
                    />
                )}

                {/* PAGINATION */}
                {faxJobs.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow p-6">

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">

                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium">Rows per page:</label>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    {[5, 10, 15, 20].map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredJobs.length)} of {filteredJobs.length}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(1)}
                                    className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                                >
                                    First
                                </button>

                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-2 rounded-lg text-sm 
                                                  ${page === currentPage ? "bg-blue-600 text-white" : "border"}`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                                >
                                    Next
                                </button>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(totalPages)}
                                    className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                                >
                                    Last
                                </button>
                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default FaxJobPage;
