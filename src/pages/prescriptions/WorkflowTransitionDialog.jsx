import React from "react";
import axios from "axios";
import init from "../../init";
import { useUser } from "../../context/UserContext";

export default function WorkflowTransitionDialog({ item, transition, onClose }) {
    const { appUser, token } = useUser();

    const submit = () => {
        axios.post(
            `/${init.appName}/api/prescription-items/${item.prescriptionItemId}/transition`,
            { toStep: transition.to },
            { headers: { "Authorization": `Bearer ${token}` } }
        )
        .then(onClose)
        .catch((err) => alert("Transition failed: " + err.message));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                    Move Item to {transition.to}
                </h2>

                <p className="text-gray-600 mb-4">
                    Are you sure you want to move this item from <strong>{transition.from}</strong> → <strong>{transition.to}</strong>?
                </p>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
                        Cancel
                    </button>

                    <button onClick={submit} className="px-4 py-2 bg-green-600 text-white rounded">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
