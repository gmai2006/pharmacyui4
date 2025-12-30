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

export default function PatientInsurancePage() {

    const { appUser, token } = useUser();

    // ------------------------------------------------------------
    // STATE
    // ------------------------------------------------------------
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchFilter, setSearchFilter] = useState("");
    const [notification, setNotification] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // View Insurances popup
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedInsurances, setSelectedInsurances] = useState([]);

    // Add/Edit dialog
    const [showForm, setShowForm] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);

    const initialForm = {
        id: null,
        firstName: "",
        lastName: "",
        dob: "",
        gender: "",
        mrn: "",
        preferredLanguage: "",
        isStudentRecord: false,

        contactAddress: "",
        contactCity: "",
        contactState: "",
        contactCountry: "",
        contactPhone: "",

        contact: {},     // final JSON object
        insurances: []
    };


    const [formData, setFormData] = useState(initialForm);
    const [insuranceRows, setInsuranceRows] = useState([]);


    // ------------------------------------------------------------
    // NOTIFICATION
    // ------------------------------------------------------------
    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // ------------------------------------------------------------
    // FETCH patients (VPatientInsuranceSummary)
    // ------------------------------------------------------------
    const fetchPatients = () => {
        if (!appUser?.email) return;
        setLoading(true);

        axios.get(`/${init.appName}/api/patient-insurance-summary?page=0&size=200`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => {
                const list = res.data || [];
                setPatients(Array.isArray(list) ? list : []);
            })
            .catch(() => showNotification("Failed to load patients", "error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPatients();
    }, [appUser]);

    // ------------------------------------------------------------
    // FILTER + PAGINATION
    // ------------------------------------------------------------
    const filteredPatients = patients.filter((p) => {
        const s = searchFilter.toLowerCase();
        return (
            p.firstName?.toLowerCase().includes(s) ||
            p.lastName?.toLowerCase().includes(s) ||
            p.mrn?.toLowerCase().includes(s)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredPatients.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

    // ------------------------------------------------------------
    // OPEN VIEW INSURANCES POPUP
    // ------------------------------------------------------------
    const viewInsurances = (patient) => {
        setSelectedPatient(patient);
        setSelectedInsurances(patient.insurances || []);
    };

    const closeViewPopup = () => {
        setSelectedPatient(null);
        setSelectedInsurances([]);
    };

    // ------------------------------------------------------------
    // ADD / EDIT patient
    // ------------------------------------------------------------
    const openNewForm = () => {
        setEditingPatient(null);
        setFormData(initialForm);
        setInsuranceRows([]);
        setShowForm(true);
    };

    const openEditForm = (patient) => {

        axios.get(`/${init.appName}/api/patient-insurances/${patient.patientId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => {
                const full = res.data;
                setEditingPatient(full);
                const c = full.contact || {};

                setFormData({
                    ...full,
                    dob: full.dob || "",
                    contactAddress: c.address || "",
                    contactCity: c.city || "",
                    contactState: c.state || "",
                    contactCountry: c.country || "",
                    contactPhone: c.phone || "",
                });

                setInsuranceRows(full.insurances || []);
                setShowForm(true);
            })
            .catch(() => showNotification("Failed to load patient details", "error"));
    };


    // ------------------------------------------------------------
    // INSURANCE PLAN ROWS
    // ------------------------------------------------------------
    const addInsuranceRow = () => {
        setInsuranceRows(prev => [
            ...prev,
            {
                patientInsuranceId: null,
                planName: "",
                companyName: "",
                isPrimary: false,
                isSecondary: false,
                isTertiary: false,
                groupNumber: ""
            }
        ]);
    };

    const updateInsuranceRow = (idx, field, value) => {
        setInsuranceRows(prev => {
            const copy = [...prev];
            copy[idx][field] = value;
            return copy;
        });
    };

    const removeInsuranceRow = (idx) => {
        setInsuranceRows(prev => prev.filter((_, i) => i !== idx));
    };


    // ------------------------------------------------------------
    // SAVE (insert / update)
    // ------------------------------------------------------------
    const savePatient = () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            showNotification("First and last name are required", "error");
            return;
        }

        const payload = {
            ...formData,
            contact: {
                address: formData.contactAddress,
                city: formData.contactCity,
                state: formData.contactState,
                country: formData.contactCountry,
                phone: formData.contactPhone
            },
            insurances: insuranceRows
        };


        let req;
        if (editingPatient) {
            req = axios.put(`/${init.appName}/api/patient-insurances`, payload, {
                headers: { "Authorization": `Bearer ${token}` }
            });
        } else {
            req = axios.post(`/${init.appName}/api/patient-insurances`, payload, {
                headers: { "Authorization": `Bearer ${token}` }
            });
        }

        req
            .then(() => {
                showNotification(editingPatient ? "Patient updated" : "Patient created");
                fetchPatients();
                setShowForm(false);
            })
            .catch(() => showNotification("Save failed", "error"));
    };


    // ------------------------------------------------------------
    // DELETE patient
    // ------------------------------------------------------------
    const deletePatient = (patient) => {
        if (!window.confirm("Delete this patient and all insurance records?")) return;

        axios.delete(`/${init.appName}/api/patient-insurances/${patient.patientId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(() => {
                showNotification("Patient deleted");
                fetchPatients();
            })
            .catch(() => showNotification("Delete failed", "error"));
    };


    // ------------------------------------------------------------
    // EXPORT CSV
    // ------------------------------------------------------------
    const exportCSV = () => {
        if (patients.length === 0) {
            showNotification("No records to export", "error");
            return;
        }

        const headers = [
            "Patient ID",
            "MRN",
            "First Name",
            "Last Name",
            "DOB",
            "Gender",
            "Insurance Count"
        ];

        const rows = patients.map((p) => [
            p.patientId || "",
            p.mrn || "",
            p.firstName || "",
            p.lastName || "",
            p.dob || "",
            p.gender || "",
            p.insurances?.length || 0
        ]);

        const content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "patients_insurance.csv";
        a.click();
        URL.revokeObjectURL(url);
    };


    // ------------------------------------------------------------
    // RENDER UI
    // ------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 p-8">

            {notification && <Notification notification={notification} />}

            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Patient Insurance Management</h1>
                    <p className="text-gray-600">Manage patients and their insurance plans</p>
                </div>

                {/* ACTION BAR */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <button
                        onClick={openNewForm}
                        className="flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 gap-2"
                    >
                        <Plus size={20} /> Add Patient
                    </button>

                    <input
                        type="text"
                        placeholder="Search by name or MRN"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="px-4 py-3 border rounded-lg flex-1 min-w-64"
                    />

                    <button
                        onClick={exportCSV}
                        className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 gap-2"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                </div>

                {/* TABLE */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading...</div>
                    ) : patients.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No patients found.</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold">Name</th>
                                    <th className="p-4 text-left text-sm font-semibold">MRN</th>
                                    <th className="p-4 text-left text-sm font-semibold">DOB</th>
                                    <th className="p-4 text-left text-sm font-semibold">Gender</th>
                                    <th className="p-4 text-left text-sm font-semibold">Insurances</th>
                                    <th className="p-4 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentItems.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                        <td className="p-4">{p.firstName} {p.lastName}</td>
                                        <td className="p-4">{p.mrn}</td>
                                        <td className="p-4">{p.dob}</td>
                                        <td className="p-4">{p.gender}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => viewInsurances(p)}
                                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                            >
                                                <List size={16} />
                                                View ({p.insurances?.length || 0})
                                            </button>
                                        </td>
                                        <td className="p-4 flex gap-4">
                                            <button
                                                onClick={() => openEditForm(p)}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                <Pencil size={18} />
                                            </button>

                                            <button
                                                onClick={() => deletePatient(p)}
                                                className="text-red-600 hover:text-red-800"
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

                {/* Pagination */}
                <div className="mt-6 text-center">
                    Page {currentPage} / {totalPages}
                    <div className="flex justify-center gap-2 mt-2">
                        <button
                            className="px-3 py-1 border rounded"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Prev
                        </button>
                        <button
                            className="px-3 py-1 border rounded"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* -------------------------------------------------------------
                   VIEW INSURANCES POPUP
                ------------------------------------------------------------- */}
                {selectedPatient && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-screen overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-bold">
                                    Insurance Plans for {selectedPatient.firstName} {selectedPatient.lastName}
                                </h2>
                                <button onClick={closeViewPopup}>
                                    <X size={22} className="text-gray-500 hover:text-gray-700" />
                                </button>
                            </div>

                            <div className="p-6">
                                {selectedInsurances.length === 0 ? (
                                    <p>No insurance plans.</p>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="p-3 text-left">Plan</th>
                                                <th className="p-3 text-left">Member ID</th>
                                                <th className="p-3 text-left">BIN/PCN</th>
                                                <th className="p-3 text-left">Primary?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedInsurances.map((ins, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="p-3">{ins.planName}</td>
                                                    <td className="p-3">{ins.memberId}</td>
                                                    <td className="p-3">{ins.bin} / {ins.pcn}</td>
                                                    <td className="p-3">{ins.isPrimary ? "Yes" : "No"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="p-6 border-t text-right">
                                <button
                                    onClick={closeViewPopup}
                                    className="px-6 py-2 border rounded-lg"
                                >
                                    Close
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* -------------------------------------------------------------
                   ADD / EDIT PATIENT DIALOG
                ------------------------------------------------------------- */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">

                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-bold">
                                    {editingPatient ? "Edit Patient" : "Add Patient"}
                                </h2>
                                <button onClick={() => setShowForm(false)}>
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">First Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Last Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">DOB</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border rounded"
                                            value={formData.dob || ""}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Gender</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={formData.gender || ""}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* MRN */}
                                <div>
                                    <label className="text-sm font-medium">MRN</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded"
                                        value={formData.mrn || ""}
                                        onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
                                    />
                                </div>

                                {/* Contact Information */}
                                <div className="border p-4 rounded bg-gray-50">
                                    <h3 className="font-semibold mb-3 text-indigo-700">Patient Contact Information</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div>
                                            <label className="text-sm font-medium">Address</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                value={formData.contactAddress}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, contactAddress: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium">City</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                value={formData.contactCity}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, contactCity: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium">State</label>
                                            <select
                                                className="w-full p-2 border rounded"
                                                value={formData.contactState}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, contactState: e.target.value })
                                                }
                                            >
                                                <option value="">Select State</option>
                                                {[
                                                    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
                                                    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
                                                    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
                                                    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
                                                    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
                                                ].map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium">Country</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                value={formData.contactCountry}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, contactCountry: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium">Phone</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                value={formData.contactPhone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, contactPhone: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="md:col-span-2 flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.isStudentRecord}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, isStudentRecord: e.target.checked })
                                                }
                                            />
                                            <label className="text-sm font-medium">Is Student?</label>
                                        </div>

                                    </div>
                                </div>

                                {/* Insurances section */}
                                <div className="border p-4 rounded bg-gray-50">

                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold">Insurance Plans</h3>
                                        <button
                                            className="flex items-center gap-2 text-indigo-600"
                                            onClick={addInsuranceRow}
                                        >
                                            <Plus size={16} /> Add Plan
                                        </button>
                                    </div>

                                    {insuranceRows.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No insurance plans.</p>
                                    ) : (
                                        insuranceRows.map((row, idx) => (
                                            <div key={idx} className="bg-white p-4 border rounded mb-3">

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-medium">Plan Name</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border rounded"
                                                            value={row.planName}
                                                            onChange={(e) =>
                                                                updateInsuranceRow(idx, "planName", e.target.value)
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-medium">Insurance Company</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border rounded"
                                                            value={row.companyName || ""}
                                                            onChange={(e) =>
                                                                updateInsuranceRow(idx, "insuranceCompany", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 mt-2">
                                                    <div>
                                                        <label className="text-xs font-medium">BIN</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border rounded"
                                                            value={row.bin}
                                                            onChange={(e) =>
                                                                updateInsuranceRow(idx, "bin", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">PCN</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border rounded"
                                                            value={row.pcn}
                                                            onChange={(e) =>
                                                                updateInsuranceRow(idx, "pcn", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">Group #</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border rounded"
                                                            value={row.groupNumber}
                                                            onChange={(e) =>
                                                                updateInsuranceRow(idx, "groupNumber", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 mt-2">
                                                    <div>
                                                        <label className="text-xs font-medium">Primary?</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={row.isPrimary}
                                                            onChange={() =>
                                                                updateInsuranceRow(idx, "isPrimary", !row.isPrimary)
                                                            }
                                                            className="w-4 h-4"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-medium">Secondary?</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={row.isSecondary}
                                                            onChange={() =>
                                                                updateInsuranceRow(idx, "isSecondary", !row.isSecondary)
                                                            }
                                                            className="w-4 h-4"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-medium">Tertiary?</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={row.isTertiary}
                                                            onChange={() =>
                                                                updateInsuranceRow(idx, "isTertiary", !row.isTertiary)
                                                            }
                                                            className="w-4 h-4"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-3 text-right">
                                                    <button
                                                        onClick={() => removeInsuranceRow(idx)}
                                                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                                    >
                                                        <Trash2 size={16} /> Remove
                                                    </button>
                                                </div>

                                            </div>
                                        ))
                                    )}

                                </div>

                                {/* Dialog Footer */}
                                <div className="flex justify-end gap-4 pt-4 border-t">
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 border rounded-lg"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={savePatient}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
                                    >
                                        {editingPatient ? "Update" : "Create"}
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
