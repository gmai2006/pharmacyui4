import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import { useUser } from "../../context/UserContext";
import Notification from "../../components/Notification";
import { Pencil, Trash2 } from "lucide-react";

export default function PatientWithInsurancePage() {
    const { appUser, token } = useUser();

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [insuranceList, setInsuranceList] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);

    const [insurancePlans, setInsurancePlans] = useState([]);
    const [insuranceRows, setInsuranceRows] = useState([]);

    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dob: "",
        gender: "",
        mrn: ""
    });

    // -------------------------------------------------------------
    // Notification helper
    // -------------------------------------------------------------
    const notify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // -------------------------------------------------------------
    // Fetch PATIENTS
    // -------------------------------------------------------------
    const fetchPatients = () => {
        setLoading(true);

        axios
            .get(`/${init.appName}/api/patients?page=0&size=100`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            })
            .then((res) => setPatients(res.data.content || []))
            .catch(() => notify("error", "Failed to load patients."))
            .finally(() => setLoading(false));
    };

    const fetchInsurancePlans = () => {
        axios
            .get(`/${init.appName}/api/insurance-plans?page=0&size=200`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then((res) => {
                const activeOnly = (res.data.content || []).filter((p) => p.active === true);
                setInsurancePlans(activeOnly);
            })
            .catch(() => notify("error", "Failed to load insurance plans."));
    };

    useEffect(() => {
        if (appUser?.email) {
            fetchPatients();
            fetchInsurancePlans();
        }
    }, [appUser]);

    // -------------------------------------------------------------
    // Fetch INSURANCE for one patient
    // -------------------------------------------------------------
    const viewInsurance = (patient) => {
        setSelectedPatient(patient);

        axios
            .get(
                `/${init.appName}/api/patient-insurance-summary/by-patient/${patient.id}`,
                {
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
                }
            )
            .then((res) => setInsuranceList(res.data))
            .catch(() => notify("error", "Failed to load insurance."));
    };

    // -------------------------------------------------------------
    // FORM HANDLERS
    // -------------------------------------------------------------
    const openNewForm = () => {
        setEditingPatient(null);
        setFormData({
            firstName: "",
            lastName: "",
            dob: "",
            gender: "",
            mrn: ""
        });
        setInsuranceRows([]);
        setShowForm(true);
    };

    const openEditForm = (patient) => {
        setEditingPatient(patient);
        setFormData({
            firstName: patient.firstName || "",
            lastName: patient.lastName || "",
            dob: patient.dob || "",
            gender: patient.gender || "",
            mrn: patient.mrn || ""
        });
        setInsuranceRows([]);
        setShowForm(true);
    };

    const handleInput = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // -------------------------------------------------------------
    // SAVE PATIENT
    // -------------------------------------------------------------
    const handleSave = () => {
        const errors = validateForm();
        if (errors.length > 0) {
            notify("error", errors.join("  "));
            return;
        }

        const payload = {
            ...formData,
            insurances: insuranceRows
        };

        const request = editingPatient
            ? axios.put(
                  `/${init.appName}/api/patients/${editingPatient.id}`,
                  payload,
                  { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } }
              )
            : axios.post(
                  `/${init.appName}/api/patients`,
                  payload,
                  { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } }
              );

        request
            .then(() => {
                notify("success", editingPatient ? "Patient updated." : "Patient created.");
                fetchPatients();
                setShowForm(false);
            })
            .catch(() => notify("error", "Failed to save patient."));
    };

    // -------------------------------------------------------------
    // DELETE PATIENT
    // -------------------------------------------------------------
    const deletePatient = (patient) => {
        if (!window.confirm("Delete this patient?")) return;

        axios
            .delete(`/${init.appName}/api/patients/${patient.id}`, {
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
            })
            .then(() => {
                notify("success", "Patient deleted.");
                fetchPatients();
            })
            .catch(() => notify("error", "Delete failed."));
    };

    // -------------------------------------------------------------
    // INSURANCE ROW HELPERS
    // -------------------------------------------------------------
    const addInsuranceRow = () => {
        setInsuranceRows((prev) => [
            ...prev,
            {
                insurancePlanId: "",
                memberId: "",
                isPrimary: false
            }
        ]);
    };

    const updateInsuranceRow = (index, field, value) => {
        setInsuranceRows((prev) => {
            const copy = [...prev];
            copy[index][field] = value;

            if (field === "isPrimary" && value === true) {
                copy.forEach((row, i) => {
                    if (i !== index) row.isPrimary = false;
                });
            }

            return copy;
        });
    };

    const removeInsuranceRow = (index) => {
        setInsuranceRows((prev) => prev.filter((_, i) => i !== index));
    };

    // -------------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------------
    const validateForm = () => {
        const errors = [];

        if (!formData.firstName.trim()) errors.push("First name is required.");
        if (!formData.lastName.trim()) errors.push("Last name is required.");
        if (!formData.dob) errors.push("Date of birth is required.");
        if (!formData.gender) errors.push("Gender is required.");

        insuranceRows.forEach((row, i) => {
            if (!row.insurancePlanId) errors.push(`Row ${i + 1}: Insurance plan required.`);
            if (!row.memberId) errors.push(`Row ${i + 1}: Member ID required.`);
        });

        return errors;
    };

    // -------------------------------------------------------------
    // UI RENDER
    // -------------------------------------------------------------
    return (
        <div className="p-8 max-w-7xl mx-auto relative">
            <h1 className="text-3xl font-bold mb-6">Patients & Insurance</h1>

            <button
                className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
                onClick={openNewForm}
            >
                + Add Patient
            </button>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">DOB</th>
                                <th className="p-3">Gender</th>
                                <th className="p-3">MRN</th>
                                <th className="p-3">Insurance</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {patients.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-3">
                                        {p.firstName} {p.lastName}
                                    </td>
                                    <td className="p-3">
                                        {p.dob ? new Date(p.dob).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="p-3">{p.gender}</td>
                                    <td className="p-3">{p.mrn}</td>

                                    <td className="p-3">
                                        <button
                                            className="px-3 py-1 bg-indigo-600 text-white rounded"
                                            onClick={() => viewInsurance(p)}
                                        >
                                            View
                                        </button>
                                    </td>

                                    <td className="p-3 space-x-2">
                                        <button
                                            onClick={() => openEditForm(p)}
                                            className="px-3 py-1 bg-green-600 text-white rounded inline-flex items-center gap-1"
                                        >
                                            <Pencil size={16} /> Edit
                                        </button>

                                        <button
                                            onClick={() => deletePatient(p)}
                                            className="px-3 py-1 bg-red-600 text-white rounded inline-flex items-center gap-1"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* -------------------------------
                INSURANCE LIST POPUP
            -------------------------------- */}
            {selectedPatient && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-3xl">
                        <h2 className="text-xl font-semibold mb-4">
                            Insurance for {selectedPatient.firstName} {selectedPatient.lastName}
                        </h2>

                        {insuranceList.length === 0 ? (
                            <p>No insurance records.</p>
                        ) : (
                            <table className="min-w-full bg-white rounded">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2">Plan</th>
                                        <th className="p-2">Payer</th>
                                        <th className="p-2">Payer ID</th>
                                        <th className="p-2">BIN/PCN</th>
                                        <th className="p-2">Notes</th>
                                        <th className="p-2">Active</th>
                                        <th className="p-2">Member ID</th>
                                        <th className="p-2">Primary?</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {insuranceList.map((i) => (
                                        <tr key={i.patientInsuranceId} className="border-t">
                                            <td className="p-2">{i.planName}</td>
                                            <td className="p-2">{i.payerName}</td>
                                            <td className="p-2">{i.payerId}</td>
                                            <td className="p-2">
                                                {i.bin} / {i.pcn}
                                            </td>
                                            <td className="p-2">{i.notes}</td>
                                            <td className="p-2">{i.active ? "Yes" : "No"}</td>
                                            <td className="p-2">{i.memberId}</td>
                                            <td className="p-2">{i.isPrimary ? "Yes" : "No"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className="text-right mt-4">
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded"
                                onClick={() => setSelectedPatient(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* -------------------------------
                ADD / EDIT PATIENT POPUP FORM
            -------------------------------- */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
                    <div className="bg-white p-6 rounded w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingPatient ? "Edit Patient" : "Add Patient"}
                        </h2>

                        <div className="space-y-3">
                            <input
                                name="firstName"
                                placeholder="First Name"
                                className="w-full p-2 border rounded"
                                value={formData.firstName}
                                onChange={handleInput}
                            />

                            <input
                                name="lastName"
                                placeholder="Last Name"
                                className="w-full p-2 border rounded"
                                value={formData.lastName}
                                onChange={handleInput}
                            />

                            <input
                                type="date"
                                name="dob"
                                className="w-full p-2 border rounded"
                                value={new Date(formData.dob).toLocaleDateString()}
                                onChange={handleInput}
                            />

                            <select
                                name="gender"
                                className="w-full p-2 border rounded"
                                value={formData.gender}
                                onChange={handleInput}
                            >
                                <option value="">Select gender...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="unknown">Unknown</option>
                            </select>

                            <input
                                name="mrn"
                                placeholder="MRN (Optional)"
                                className="w-full p-2 border rounded"
                                value={formData.mrn}
                                onChange={handleInput}
                            />

                            {/* Insurance Section */}
                            <div className="border rounded p-4 bg-gray-50">
                                <div className="flex justify-between mb-2">
                                    <h3 className="font-semibold">Insurance</h3>

                                    <button
                                        className="px-3 py-1 bg-blue-600 text-white rounded"
                                        onClick={addInsuranceRow}
                                    >
                                        + Add Insurance
                                    </button>
                                </div>

                                {insuranceRows.length === 0 && (
                                    <p className="text-gray-500 text-sm">No insurance added.</p>
                                )}

                                {insuranceRows.map((row, idx) => (
                                    <div key={idx} className="border p-3 rounded mb-3 bg-white">

                                        <select
                                            className="w-full p-2 border rounded mb-2"
                                            value={row.insurancePlanId}
                                            onChange={(e) =>
                                                updateInsuranceRow(idx, "insurancePlanId", e.target.value)
                                            }
                                        >
                                            <option value="">Select Insurance Plan...</option>

                                            {insurancePlans.map((plan) => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.planName} - {plan.payerName} ({plan.payerId})
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            className="w-full p-2 border rounded mb-2"
                                            placeholder="Member ID"
                                            value={row.memberId}
                                            onChange={(e) =>
                                                updateInsuranceRow(idx, "memberId", e.target.value)
                                            }
                                        />

                                        <label className="flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                checked={row.isPrimary}
                                                onChange={(e) =>
                                                    updateInsuranceRow(idx, "isPrimary", e.target.checked)
                                                }
                                                className="mr-2"
                                            />
                                            Primary Insurance
                                        </label>

                                        <button
                                            className="px-3 py-1 bg-red-600 text-white rounded inline-flex items-center gap-1"
                                            onClick={() => removeInsuranceRow(idx)}
                                        >
                                            <Trash2 size={16} /> Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    className="px-4 py-2 bg-gray-300 rounded"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                    onClick={handleSave}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification */}
            {notification && <Notification notification={notification} />}
        </div>
    );
}
