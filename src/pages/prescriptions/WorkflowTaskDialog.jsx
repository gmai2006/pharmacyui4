import React, { useState } from "react";
import axios from "axios";
import init from "../../init";
import { useUser } from "../../context/UserContext";

export default function WorkflowTaskDialog({ item, task, onClose }) {
    const { appUser, token } = useUser();
    const [data, setData] = useState("");

    const submit = () => {
        axios.post(
            `/${init.appName}/api/prescription-items/${item.prescriptionItemId}/task`,
            { taskCode: task.code, data },
            { headers: { "Authorization": `Bearer ${token}` } }
        )
        .then(onClose)
        .catch((err) => alert("Task failed: " + err.message));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-3">
                    {task.label}
                </h2>

                <textarea
                    className="border w-full p-2 rounded"
                    rows="5"
                    placeholder="Enter task details..."
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                />

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
                        Close
                    </button>
                    <button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded">
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}
