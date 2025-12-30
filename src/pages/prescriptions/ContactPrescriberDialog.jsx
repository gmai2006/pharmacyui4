import React, { useState } from "react";

const ContactPrescriberDialog = ({ isOpen, onClose, prescription, onSubmit }) => {
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Prescriber</h2>

                <div className="space-y-4">

                    <div>
                        <label className="text-sm text-gray-600">Prescriber</label>
                        <div className="font-medium text-gray-900">
                            {prescription?.prescriberName}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Reason</label>
                        <input
                            type="text"
                            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="Missing information, clarification needed..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Notes</label>
                        <textarea
                            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                            rows="3"
                            placeholder="Additional details..."
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
                        onClick={() => onSubmit({
                            prescriptionId: prescription?.prescriptionId,
                            prescriberId: prescription?.prescriberId,
                            reason,
                            notes
                        })}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactPrescriberDialog;
