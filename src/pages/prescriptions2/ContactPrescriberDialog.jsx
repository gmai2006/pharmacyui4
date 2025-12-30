import React, { useState, useEffect } from "react";

/* -----------------------------------------------
   Contact Type Definitions
-------------------------------------------------*/
const CONTACT_TYPES = [
    { value: "FAX", label: "Fax Prescriber" },
    { value: "PHONE", label: "Phone Call to Prescriber" },
    { value: "CANCELRX", label: "CancelRx (Discontinue Notice)" },
    { value: "PRIOR_AUTH", label: "Prior Authorization" },
    { value: "REFILL", label: "Refill Authorization / Denial" },
    { value: "THERAPY_CHANGE", label: "Therapy Change Request" },
    { value: "CLARIFICATION", label: "Prescription Clarification" },
    { value: "SAFETY", label: "Safety / Dose Verification" },
    { value: "OTHER", label: "Other" }
];

/* -----------------------------------------------
   Standardized Preset Messages by Contact Type
-------------------------------------------------*/
const REASON_PRESETS = {
    PRIOR_AUTH: [
        "Insurance requires clinical justification to approve this medication.",
        "ICD-10 diagnosis code required to process prior authorization.",
        "Plan requires documentation of step therapy / prior failures.",
        "Quantity limit exceeded — need clinical justification.",
        "Non-formulary medication — request clinical rationale."
    ],
    REFILL: [
        "Refill authorization needed — no refills remaining.",
        "Early refill request requires provider approval.",
        "Possible duplicate therapy — verify continuation.",
        "Safety or dose verification needed for refill request."
    ],
    THERAPY_CHANGE: [
        "Formulary alternative required — preferred alternative available.",
        "Therapeutic interchange requested — confirm substitution.",
        "Interaction/contraindication identified — verify therapy.",
        "High-dose or unusual regimen — confirm dosing."
    ],
    CANCELRX: [
        "Please discontinue this medication — patient request.",
        "Therapy changed — discontinue previous medication.",
        "Patient no longer taking medication — discontinue.",
        "Duplicate therapy identified — discontinue this item.",
        "Prescription may have been sent in error — discontinue."
    ],
    CLARIFICATION: [
        "Additional information required: missing strength / SIG / quantity.",
        "Directions unclear — need clarification.",
        "Quantity mismatch — verify intended quantity.",
        "Need DAW/substitution clarification.",
        "Verify indication to ensure accurate processing."
    ],
    SAFETY: [
        "Dose appears outside standard therapeutic range — verify dose.",
        "Drug interaction alert — verify therapy continuation.",
        "Potential renal/hepatic dosing adjustment needed — confirm dosing.",
        "Allergy conflict identified — verify therapy."
    ],
    PHONE: [
        "Urgent clinical clarification required.",
        "Callback requested regarding prescription issue.",
        "Insurance needs verification from provider.",
        "Dose safety inquiry — please confirm regimen."
    ],
    FAX: [
        "Prescription clarification needed.",
        "Missing directions or strength — please verify.",
        "Refill or authorization request pending.",
        "Plan denial — alternative or justification requested."
    ],
    OTHER: []
};

const ContactPrescriberDialog = ({
    isOpen,
    onClose,
    prescription,
    onSubmit
}) => {
    const [contactType, setContactType] = useState("CLARIFICATION");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");

    /* -----------------------------------------------------------
       Auto-update reason presets when contact type changes
    -------------------------------------------------------------*/
    useEffect(() => {
        const presets = REASON_PRESETS[contactType] || [];

        // Auto-fill the reason to the first preset (if available)
        if (presets.length > 0) {
            setReason(presets[0]);
        } else {
            setReason("");
        }

        // Optional: auto-fill notes (disabled by default)
        // setNotes(presets.length > 0 ? presets[0] : "");
    }, [contactType]);

    if (!isOpen) return null;

    const presets = REASON_PRESETS[contactType] || [];

    const handleSubmit = (jobType) => {
        onSubmit({
            prescriptionId: prescription?.prescriptionId,
            contactType,
            reason,
            noteToPrescriber: notes
        }, jobType);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Contact Prescriber</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-800 text-lg font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">

                    {/* Prescriber Summary */}
                    <div>
                        <label className="text-sm text-gray-600">Prescriber</label>
                        <div className="font-medium text-gray-900">
                            {prescription?.prescriberFirstName} {prescription?.prescriberLastName}
                        </div>
                    </div>

                    {/* Contact Type Dropdown */}
                    <div>
                        <label className="text-sm text-gray-600">Contact Type</label>
                        <select
                            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                            value={contactType}
                            onChange={(e) => setContactType(e.target.value)}
                        >
                            {CONTACT_TYPES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reason Presets Dropdown */}
                    {presets.length > 0 && (
                        <div>
                            <label className="text-sm text-gray-600">Reason</label>
                            <select
                                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            >
                                {presets.map((r, idx) => (
                                    <option key={idx} value={r}>
                                        {r}
                                    </option>
                                ))}
                                <option value="">Other...</option>
                            </select>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="text-sm text-gray-600">Notes to Prescriber</label>
                        <textarea
                            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                            rows="4"
                            placeholder="Enter additional message to prescriber…"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => handleSubmit('generate')}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        Create PDF
                    </button>

                    <button
                        onClick={() => handleSubmit('generate-and-create-job')}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        Create PDF and Send
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ContactPrescriberDialog;
