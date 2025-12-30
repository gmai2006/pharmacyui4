import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import Notification from "../../components/Notification";
import { useUser } from "../../context/UserContext";

export default function PharmacistNoteDialog({
    open,
    mode, // "create" | "edit" | "addendum"
    existingNote,
    prescriptionId,
    onClose,
    onSaved,
}) {
    const { appUser, token } = useUser();

    const NOTE_TYPES = [
        { value: "CLINICAL_REVIEW", label: "Clinical Review" },
        { value: "DUR_INTERVENTION", label: "DUR Intervention" },
        { value: "INSURANCE_ISSUE", label: "Insurance Issue" },
        { value: "PRESCRIBER_CONTACT", label: "Prescriber Contact" },
        { value: "PATIENT_CONTACT", label: "Patient Contact" },
        { value: "PDMP_REVIEW", label: "PDMP Review" },
        { value: "CONTROLLED_SUBSTANCE_CHECK", label: "Controlled Substance Check" },
        { value: "COUNSELING", label: "Counseling" },
        { value: "DOCUMENTATION_ONLY", label: "Documentation Only" },
        { value: "OTHER", label: "Other" },
    ];

    const [noteType, setNoteType] = useState("");
    const [noteJson, setNoteJson] = useState({});
    const [addendumText, setAddendumText] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // ----------------------------------------
    // INITIALIZE NOTE FIELDS
    // ----------------------------------------
    useEffect(() => {
        if (mode === "edit" && existingNote) {
            setNoteType(existingNote.noteType || "");
            setNoteJson(existingNote.noteJson || {});
        } else if (mode === "addendum") {
            setAddendumText("");
        } else {
            resetForm();
        }
    }, [mode, existingNote]);

    const resetForm = () => {
        setNoteType("");
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

    // ----------------------------------------
    // SAVE OR UPDATE NOTE
    // ----------------------------------------
    const savePrimaryNote = () => {
        if (!noteType) {
            setError("Note type is required.");
            return;
        }

        setSaving(true);

        const payload = {
            id: existingNote?.id || null,
            prescriptionId,
            actorUserId: appUser?.userId,
            stationId: localStorage.getItem("stationId") || null,
            noteType,
            noteJson,
        };

        const url =
            mode === "edit"
                ? `/${init.appName}/api/pharmacist-notes/${existingNote.id}`
                : `/${init.appName}/api/pharmacist-notes`;

        const method = mode === "edit" ? axios.put : axios.post;

        method(url, payload, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, } })
            .then(() => {
                onSaved?.();
                onClose();
            })
            .catch((err) => setError(err.response?.data || "Save failed."))
            .finally(() => setSaving(false));
    };

    // ----------------------------------------
    // SAVE ADDENDUM
    // ----------------------------------------
    const saveAddendum = (token) => {
        if (!addendumText.trim()) {
            setError("Addendum cannot be empty.");
            return;
        }

        setSaving(true);

        axios
            .post(
                `/${init.appName}/api/pharmacist-notes/${existingNote.id}/addendum`,
                {
                    pharmacistNoteId: existingNote.id,
                    actorUserId: appUser?.userId,
                    addendumText: addendumText.trim(),
                },
                { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, } }
            )
            .then(() => {
                onSaved?.();
                onClose();
            })
            .catch((err) => setError(err.response?.data || "Addendum save failed."))
            .finally(() => setSaving(false));
    };

    if (!open) return null;

    // ----------------------------------------
    // RENDER DIALOG
    // ----------------------------------------
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">

                {/* HEADER WITH X BUTTON (same UX as BarcodePreviewDialog) */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-lg font-bold">
                        {mode === "create" && "Add Pharmacist Note"}
                        {mode === "edit" && "Edit Pharmacist Note"}
                        {mode === "addendum" && "Add Addendum"}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-white hover:bg-blue-800 rounded p-1 transition"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* BODY - SCROLLABLE */}
                <div className="p-4 overflow-y-auto flex-1">

                    {error && (
                        <div className="mb-4">
                            <Notification type="error" message={error} onClose={() => setError("")} />
                        </div>
                    )}

                    {/* ADDENDUM MODE */}
                    {mode === "addendum" ? (
                        <>
                            <p className="text-sm text-gray-600 mb-2">
                                Original Note Type: <strong>{existingNote.noteType}</strong>
                            </p>

                            <textarea
                                className="w-full p-2 border rounded"
                                rows="5"
                                placeholder="Enter addendum text..."
                                value={addendumText}
                                onChange={(e) => setAddendumText(e.target.value)}
                            />
                        </>
                    ) : (
                        <>
                            {/* NOTE TYPE */}
                            <label className="block font-medium mb-1">Note Type</label>
                            <select
                                className="w-full p-2 border rounded mb-3"
                                value={noteType}
                                onChange={(e) => setNoteType(e.target.value)}
                            >
                                <option value="">Select...</option>
                                {NOTE_TYPES.map((nt) => (
                                    <option key={nt.value} value={nt.value}>
                                        {nt.label}
                                    </option>
                                ))}
                            </select>

                            {/* STRUCTURED FIELDS */}
                            {[
                                ["assessment", "Assessment"],
                                ["findings", "Findings"],
                                ["intervention", "Intervention"],
                                ["communication", "Communication"],
                                ["insurance", "Insurance"],
                                ["disposition", "Disposition"],
                                ["freeText", "Additional Notes"],
                            ].map(([field, label]) => (
                                <div key={field} className="mb-3">
                                    <label className="block font-medium mb-1">{label}</label>
                                    <textarea
                                        className="w-full p-2 border rounded"
                                        rows="2"
                                        value={noteJson[field] || ""}
                                        onChange={(e) =>
                                            updateJsonField(field, e.target.value)
                                        }
                                    />
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className="border-t p-4 flex justify-end space-x-2">
                    <button
                        className="px-4 py-2 bg-gray-300 rounded"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        onClick={mode === "addendum" ? saveAddendum : savePrimaryNote}
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : mode === "addendum"
                            ? "Save Addendum"
                            : mode === "edit"
                            ? "Update Note"
                            : "Save Note"}
                    </button>
                </div>
            </div>
        </div>
    );
}
