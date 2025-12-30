// src/pages/claims/ClaimsDashboard.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import Notification from "../../components/Notification";
import { useUser } from "../../context/UserContext";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Filter,
    ShieldAlert,
    Activity,
    Search,
    Download,
} from "lucide-react";
import { getErrorMessage } from "../../utils/util";

const CLAIMS_ENDPOINT = (max = 200) =>`/${init.appName}/api/claims-dashboard?max=${max}`;


const ClaimsDashboard = () => {
    const { appUser, token } = useUser();

    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);

    const [claims, setClaims] = useState([]);
    const [filteredClaims, setFilteredClaims] = useState([]);

    const [queueFilter, setQueueFilter] = useState("");       // recommended_queue
    const [stateFilter, setStateFilter] = useState("");       // dashboard_state
    const [searchTerm, setSearchTerm] = useState("");

    const [availableQueues, setAvailableQueues] = useState([]);
    const [availableStates, setAvailableStates] = useState([]);

    // -------------------------
    // Notification Auto-close
    // -------------------------
    useEffect(() => {
        if (notification) {
            const t = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(t);
        }
    }, [notification]);

    const showNotification = (msg, type = "success") =>
        setNotification({ message: msg, type });

    // -------------------------
    // LOAD CLAIMS DASHBOARD DATA
    // -------------------------
    const loadClaims = async () => {
        if (!appUser?.email) return;
        try {
            setLoading(true);
            const res = await axios.get(CLAIMS_ENDPOINT(200), {
                headers: { "Authorization": `Bearer ${token}`, },
            });
            const data = res.data?.content || res.data || [];
            const filtered = data.filter(data => data !== null);

            setClaims(filtered);
            setFilteredClaims(filtered);

            // derive distinct queues and states
            const queues = [
                ...new Set(
                    filtered
                        .map((c) => c.recommendedQueue)
                        .filter((v) => v && v.trim().length > 0)
                ),
            ];
            const states = [
                ...new Set(
                    filtered
                        .map((c) => c.dashboardState)
                        .filter((v) => v && v.trim().length > 0)
                ),
            ];

            setAvailableQueues(queues);
            setAvailableStates(states);
            setQueueFilter("");
            setStateFilter("");
            setSearchTerm("");
        } catch (error) {
            const msg = getErrorMessage ? getErrorMessage(error) : (error.message || "Failed to load claims.");
            console.error("Failed to load claims dashboard:", error);
            showNotification(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (appUser?.email) {
            loadClaims();
        }
    }, [appUser]);

    // -------------------------
    // FILTER LOGIC
    // -------------------------
    useEffect(() => {
        const term = (searchTerm || "").toLowerCase();

        const result = claims.filter((c) => {
            // queue filter
            if (queueFilter && c.recommendedQueue !== queueFilter) {
                return false;
            }
            // state filter
            if (stateFilter && c.dashboardState !== stateFilter) {
                return false;
            }

            // search on patient / claim / prescriber
            if (term) {
                const haystack = [
                    c.patientMrn,
                    c.patientFirstName,
                    c.patientLastName,
                    c.claimNumber,
                    c.prescriberFirstName,
                    c.prescriberLastName,
                    c.payerId,
                    c.bin,
                    c.groupId,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(term)) {
                    return false;
                }
            }

            return true;
        });

        setFilteredClaims(result);
    }, [claims, queueFilter, stateFilter, searchTerm]);

    // -------------------------
    // HELPERS
    // -------------------------
    const formatCurrency = (v) => {
        if (v == null) return "-";
        const num = Number(v);
        if (Number.isNaN(num)) return "-";
        return `$${num.toFixed(2)}`;
    };

    const formatDateTime = (value) => {
        if (!value) return "-";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "-";
        return d.toLocaleString();
    };

    const getStateBadge = (state) => {
        // state: PENDING, PAID, REQUIRES_ATTENTION, REVERSED, UNKNOWN
        switch (state) {
            case "PAID":
                return {
                    icon: <CheckCircle size={14} />,
                    className:
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800",
                };
            case "PENDING":
                return {
                    icon: <Clock size={14} />,
                    className:
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800",
                };
            case "REQUIRES_ATTENTION":
                return {
                    icon: <AlertCircle size={14} />,
                    className:
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800",
                };
            case "REVERSED":
                return {
                    icon: <XCircle size={14} />,
                    className:
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700",
                };
            default:
                return {
                    icon: <Activity size={14} />,
                    className:
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800",
                };
        }
    };

    const getQueuePillClass = (queue) => {
        // PA_REQUIRED, REFILL_TOO_SOON, DUR_REVIEW, AWAITING_PAYER, OK_TO_FILL, GENERAL_REVIEW
        const base =
            "px-3 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors";
        switch (queue) {
            case "PA_REQUIRED":
                return `${base} bg-purple-50 text-purple-800 border-purple-200`;
            case "REFILL_TOO_SOON":
                return `${base} bg-orange-50 text-orange-800 border-orange-200`;
            case "DUR_REVIEW":
                return `${base} bg-red-50 text-red-800 border-red-200`;
            case "AWAITING_PAYER":
                return `${base} bg-blue-50 text-blue-800 border-blue-200`;
            case "OK_TO_FILL":
                return `${base} bg-green-50 text-green-800 border-green-200`;
            default:
                return `${base} bg-slate-50 text-slate-800 border-slate-200`;
        }
    };

    const handleQueueClick = (queue) => {
        setQueueFilter((prev) => (prev === queue ? "" : queue));
    };

    const handleStateClick = (state) => {
        setStateFilter((prev) => (prev === state ? "" : state));
    };

    // -------------------------
    // EXPORT TO CSV
    // -------------------------
    const exportToCsv = () => {
        if (!filteredClaims || filteredClaims.length === 0) {
            showNotification("No data available to export.", "error");
            return;
        }

        // CSV headers
        const headers = [
            "Queue",
            "State",
            "Patient First Name",
            "Patient Last Name",
            "MRN",
            "Claim Number",
            "Prescription ID",
            "Payer ID",
            "BIN",
            "Group ID",
            "Plan Paid",
            "Patient Pay",
            "Last Tx Status",
            "Last Tx Code",
            "Reject Codes",
            "Last Activity",
            "Claim Submitted"
        ];

        // CSV rows
        const rows = filteredClaims.map((c) => {
            const rejectCodes = Array.isArray(c.lastRejectCodes)
                ? c.lastRejectCodes.join(";")
                : Array.isArray(c.claimMasterRejects)
                    ? c.claimMasterRejects.join(";")
                    : "";

            const clean = (v) => {
                if (v === null || v === undefined) return "";
                const s = String(v).replace(/"/g, '""');
                return `"${s}"`;
            };

            return [
                clean(c.recommendedQueue),
                clean(c.dashboardState),
                clean(c.patientFirstName),
                clean(c.patientLastName),
                clean(c.patientMrn),
                clean(c.claimNumber),
                clean(c.prescriptionId),
                clean(c.payerId),
                clean(c.bin),
                clean(c.groupId),
                clean(c.planPaidAmount),
                clean(c.patientPayAmount),
                clean(c.lastTransactionStatus || c.claimMasterStatus),
                clean(c.lastTransactionCode),
                clean(rejectCodes),
                clean(formatDateTime(c.lastTransactionAt)),
                clean(formatDateTime(c.claimSubmittedAt)),
            ].join(",");
        });

        const csv = [headers.join(","), ...rows].join("\n");

        // Trigger download
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "claims-dashboard.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // -------------------------
    // UI RENDER
    // -------------------------
    return (
        <div className="min-h-screen bg-gray-50">
            {notification && <Notification notification={notification} />}

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col h-[85vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                <ShieldAlert className="text-indigo-600" />
                                Claims Dashboard
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">
                                Monitor claim adjudication status and route work by queue.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">

                            <button
                                onClick={loadClaims}
                                className="px-3 py-1.5 text-xs rounded border bg-white hover:bg-gray-50 flex items-center gap-1"
                                disabled={loading}
                            >
                                <Activity size={14} />
                                {loading ? "Refreshing..." : "Refresh"}
                            </button>

                            <button
                                onClick={exportToCsv}
                                className="px-3 py-1.5 text-xs rounded border bg-white hover:bg-gray-50 flex items-center gap-1"
                            >
                                <Download size={14} />
                                Export CSV
                            </button>

                            <div className="text-xs text-gray-500">
                                Showing <span className="font-semibold">{filteredClaims.length}</span> of{" "}
                                <span className="font-semibold">{claims.length}</span>
                            </div>
                        </div>

                    </div>

                    {/* Filters */}
                    <div className="mb-4 flex flex-col gap-3">
                        {/* Top row: search + state filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search patient, claim #, prescriber, payer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 pr-3 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Filter size={14} /> Status:
                                </span>
                                {availableStates.map((state) => {
                                    const { icon, className } = getStateBadge(state);
                                    const isActive = stateFilter === state;
                                    return (
                                        <button
                                            key={state}
                                            onClick={() => handleStateClick(state)}
                                            className={`${className} ${isActive ? "ring-2 ring-offset-1 ring-indigo-500" : ""
                                                }`}
                                        >
                                            {icon}
                                            <span>{state.replace("_", " ")}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Second row: queue filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Filter size={14} /> Queue:
                            </span>
                            {availableQueues.map((q) => {
                                const isActive = queueFilter === q;
                                return (
                                    <button
                                        key={q}
                                        onClick={() => handleQueueClick(q)}
                                        className={`${getQueuePillClass(q)} ${isActive ? "ring-2 ring-offset-1 ring-indigo-500" : ""
                                            }`}
                                    >
                                        {q.replace(/_/g, " ")}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto border rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 border-b text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-3 py-2 text-left">Queue</th>
                                    <th className="px-3 py-2 text-left">State</th>
                                    <th className="px-3 py-2 text-left">Patient</th>
                                    <th className="px-3 py-2 text-left">Claim #</th>
                                    <th className="px-3 py-2 text-left">Payer</th>
                                    <th className="px-3 py-2 text-right">Plan Paid</th>
                                    <th className="px-3 py-2 text-right">Patient Pay</th>
                                    <th className="px-3 py-2 text-left">Last Status</th>
                                    <th className="px-3 py-2 text-left">Reject Codes</th>
                                    <th className="px-3 py-2 text-left">Last Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-3 py-4 text-center text-gray-500 text-sm"
                                        >
                                            Loading claims...
                                        </td>
                                    </tr>
                                )}

                                {!loading && filteredClaims.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-3 py-4 text-center text-gray-500 text-sm"
                                        >
                                            No claims match the current filters.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    filteredClaims.map((c) => {
                                        const { icon, className } = getStateBadge(
                                            c.dashboardState
                                        );
                                        const queue = c.recommendedQueue;
                                        const rejectCodes =
                                            c.lastRejectCodes ||
                                            c.claimMasterRejects ||
                                            null;

                                        return (
                                            <tr
                                                key={`${c.claimId || "noclaim"}-${c.prescriptionId
                                                    }`}
                                                className="hover:bg-gray-50"
                                            >
                                                {/* Queue */}
                                                <td className="px-3 py-2 align-top">
                                                    {queue ? (
                                                        <span
                                                            className={`${getQueuePillClass(
                                                                queue
                                                            )} text-[11px] px-2 py-0.5`}
                                                        >
                                                            {queue.replace(/_/g, " ")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            -
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Dashboard state */}
                                                <td className="px-3 py-2 align-top">
                                                    <span className={className}>
                                                        {icon}
                                                        <span>
                                                            {c.dashboardState
                                                                ? c.dashboardState.replace(
                                                                    /_/g,
                                                                    " "
                                                                )
                                                                : "UNKNOWN"}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* Patient */}
                                                <td className="px-3 py-2 align-top">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {c.patientFirstName} {c.patientLastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        MRN: {c.patientMrn || "-"}
                                                    </div>
                                                </td>

                                                {/* Claim # */}
                                                <td className="px-3 py-2 align-top">
                                                    <div className="text-sm">
                                                        {c.claimNumber || "-"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        RxID: {c.prescriptionId}
                                                    </div>
                                                </td>

                                                {/* Payer */}
                                                <td className="px-3 py-2 align-top">
                                                    <div className="text-sm">
                                                        {c.payerId || "-"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        BIN {c.bin || "-"} · GRP{" "}
                                                        {c.groupId || "-"}
                                                    </div>
                                                </td>

                                                {/* Plan Paid */}
                                                <td className="px-3 py-2 align-top text-right">
                                                    <div className="text-sm">
                                                        {formatCurrency(c.planPaidAmount)}
                                                    </div>
                                                </td>

                                                {/* Patient Pay */}
                                                <td className="px-3 py-2 align-top text-right">
                                                    <div className="text-sm">
                                                        {formatCurrency(c.patientPayAmount)}
                                                    </div>
                                                </td>

                                                {/* Last Status */}
                                                <td className="px-3 py-2 align-top">
                                                    <div className="text-sm">
                                                        {c.lastTransactionStatus ||
                                                            c.claimMasterStatus ||
                                                            "-"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Tx: {c.lastTransactionCode || "-"}
                                                    </div>
                                                </td>

                                                {/* Reject Codes */}
                                                <td className="px-3 py-2 align-top">
                                                    {rejectCodes && rejectCodes.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {rejectCodes.map((code) => (
                                                                <span
                                                                    key={code}
                                                                    className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] border border-rose-100"
                                                                >
                                                                    {code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            -
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Last Activity */}
                                                <td className="px-3 py-2 align-top">
                                                    <div className="text-sm">
                                                        {formatDateTime(c.lastTransactionAt)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Submitted:{" "}
                                                        {formatDateTime(c.claimSubmittedAt)}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimsDashboard;
