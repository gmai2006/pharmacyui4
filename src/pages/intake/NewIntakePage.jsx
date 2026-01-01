import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import Notification from "../../components/Notification";
import { useUser } from "../../context/UserContext";

import { Search, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NewIntakePage = () => {
    const navigate = useNavigate();
    const { appUser, token } = useUser();

    // ------------------------------------------------------------
    // STATE
    // ------------------------------------------------------------
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchFilter, setSearchFilter] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [notification, setNotification] = useState(null);

    // ------------------------------------------------------------
    // NOTIFICATION
    // ------------------------------------------------------------
    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
    };

    useEffect(() => {
        if (notification) {
            const t = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(t);
        }
    }, [notification]);

    // ------------------------------------------------------------
    // FETCH PATIENTS (read-only list)
    // ------------------------------------------------------------
    const fetchPatients = () => {
        if (!appUser) return;

        setLoading(true);
        axios
            .get(`/${init.appName}/api/patient-insurance-summary?page=0&size=200`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
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
    // FILTERED PATIENTS (same logic as patient page)
    // ------------------------------------------------------------
    const filteredPatients = patients.filter((p) => {
        const s = searchFilter.toLowerCase();
        return (
            p.firstName?.toLowerCase().includes(s) ||
            p.lastName?.toLowerCase().includes(s) ||
            p.mrn?.toLowerCase().includes(s)
        );
    });

    // ------------------------------------------------------------
    // SELECT PATIENT
    // ------------------------------------------------------------
    const selectPatient = (patient) => {
        setSelectedPatient(patient);
        showNotification(
            `Selected patient: ${patient.firstName} ${patient.lastName}`
        );
    };

    // ------------------------------------------------------------
    // NEXT STEP PLACEHOLDER
    // ------------------------------------------------------------
    const proceedToPrescription = () => {
        if (!selectedPatient) {
            showNotification("Please select a patient first", "error");
            return;
        }

        navigate(`/intake/prescription/${selectedPatient.patientId}`);
        console.log("Proceed with patient:", selectedPatient.patientId);
    };

    // ------------------------------------------------------------
    // RENDER
    // ------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 p-8">

            {notification && <Notification notification={notification} />}

            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        New Prescription Intake
                    </h1>
                    <p className="text-gray-600">
                        Select an existing patient to begin intake
                    </p>
                </div>

                {/* SEARCH BAR */}
                <div className="flex items-center gap-3 mb-6">
                    <Search className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by first name, last name, or MRN"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="flex-1 px-4 py-3 border rounded-lg"
                    />
                </div>

                {/* PATIENT LIST */}
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">
                            Loading patients…
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No matching patients found
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Name
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        MRN
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        DOB
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map((p) => (
                                    <tr
                                        key={p.patientId}
                                        className={`border-b hover:bg-gray-50 ${
                                            selectedPatient?.patientId === p.patientId
                                                ? "bg-indigo-50"
                                                : ""
                                        }`}
                                    >
                                        <td className="p-4">
                                            {p.firstName} {p.lastName}
                                        </td>
                                        <td className="p-4">{p.mrn}</td>
                                        <td className="p-4">{p.dob}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => selectPatient(p)}
                                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                                            >
                                                <CheckCircle size={18} />
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* FOOTER ACTION */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={proceedToPrescription}
                        disabled={!selectedPatient}
                        className={`px-6 py-3 rounded-lg text-white font-medium ${
                            selectedPatient
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-gray-300 cursor-not-allowed"
                        }`}
                    >
                        Continue to Prescription
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NewIntakePage;
