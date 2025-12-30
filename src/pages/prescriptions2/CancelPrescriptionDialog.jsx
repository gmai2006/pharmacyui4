import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import { useUser } from "../../context/UserContext";
import Notification from "../../components/Notification";
import { X } from "lucide-react";
import { CANCELLED } from "./PrescriptionDictionary";

export default function CancelPrescriptionDialog({
    open,
    prescription,
    onClose,
    onSaved,          // callback after cancellation workflow completes
}) {
    const { appUser, token } = useUser();

    const NOTE_TYPE = "PRESCRIPTION_CANCELLATION";

    const [noteJson, setNoteJson] = useState({
        assessment: "",
        findings: "",
        intervention: "",
        communication: "",
        insurance: "",
        disposition: "",
        freeText: "",
    });

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            resetForm();
        }
    }, [open]);

    const resetForm = () => {
        setNoteJson({
            assessment: "",
            findings: "",
            intervention: "",
            communication: "",
            insurance: "",
            disposition: "",
            freeText: "",
        });
    };

    const updateJsonField = (field, value) => {
        setNoteJson((prev) => ({ ...prev, [field]: value }));
    };

    // ----------------------------------------------------
    // SAVE NOTE + TRIGGER WORKFLOW CANCEL TRANSITION
    // ----------------------------------------------------
    const submitCancellation = async () => {
        if (!noteJson.freeText.trim() && !noteJson.assessment.trim()) {
            setError("At least one cancellation explanation is required.");
            return;
        }

        setSaving(true);

        try {
            //
            // STEP 1: SAVE PHARMACIST NOTE (structured cancellation note)
            //
            const notePayload = {
                id: null,
                prescriptionId: prescription.prescriptionId,
                actorUserId: appUser?.userId,
                stationId: localStorage.getItem("stationId") || null,
                noteType: NOTE_TYPE,
                noteJson,
            };

            await axios.post(
                `/${init.appName}/api/pharmacist-notes`,
                notePayload,
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            //
            // STEP 2: PERFORM WORKFLOW TRANSITION TO CANCELLED
            //
            const workflowPayload = {
                prescriptionId: prescription.prescriptionId,
                fromStep: prescription.currentStep, 
                toStep: CANCELLED,
                userAgent: navigator.userAgent,
            };

            await axios.post(
                `/${init.appName}/api/workflow/transition`,
                workflowPayload,
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            onSaved();
            onClose();
        } catch (err) {
            console.error("Cancel error:", err);
            setError(err.response?.data || "Cancellation failed.");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    // ----------------------------------------------------
    // UI
    // ----------------------------------------------------
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">

                {/* HEADER */}
                <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-3 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-lg font-bold">Cancel Prescription</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-red-800 rounded p-1 transition"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* BODY */}
                <div className="p-4 overflow-y-auto flex-1">

                    {error && (
                        <div className="mb-4">
                            <Notification type="error" message={error} onClose={() => setError("")} />
                        </div>
                    )}

                    <p className="text-sm text-gray-700 mb-3">
                        A pharmacist note is required to explain why this prescription is being cancelled.
                        This note will be stored permanently in the patient’s record.
                    </p>

                    {[
                        ["assessment", "Assessment"],
                        ["findings", "Findings"],
                        ["intervention", "Intervention"],
                        ["communication", "Communication"],
                        ["insurance", "Insurance"],
                        ["disposition", "Disposition"],
                        ["freeText", "Cancellation Explanation (required)"],
                    ].map(([field, label]) => (
                        <div key={field} className="mb-3">
                            <label className="block font-medium mb-1">{label}</label>
                            <textarea
                                className="w-full p-2 border rounded"
                                rows="2"
                                value={noteJson[field] || ""}
                                onChange={(e) => updateJsonField(field, e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div className="border-t p-4 flex justify-end space-x-2">
                    <button
                        className="px-4 py-2 bg-gray-300 rounded"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Close
                    </button>

                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded"
                        onClick={submitCancellation}
                        disabled={saving}
                    >
                        {saving ? "Cancelling..." : "Confirm Cancellation"}
                    </button>
                </div>
            </div>
        </div>
    );
}
