import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import Notification from "../../components/Notification";
import { useUser } from "../../context/UserContext";

export default function WorkflowPanel({ currentStep, onTransition }) {
    const { appUser, token } = useUser();

    const [nextSteps, setNextSteps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // ---------------------------------------------------------
    // Fetch next possible transitions
    // ---------------------------------------------------------
    const fetchNextSteps = () => {
        if (!currentStep) return;

        setLoading(true);

        axios.get(
            `/${init.appName}/api/workflow/next-steps/${currentStep}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        )
        .then(res => {
            setNextSteps(res.data || []);
        })
        .catch(err => {
            console.error("Failed to load workflow steps", err);
            setNotification({
                type: "error",
                message: err.response?.data || "Failed to load workflow steps"
            });
        })
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (appUser?.email) {
            fetchNextSteps();
        }
    }, [currentStep, appUser]);

    // ---------------------------------------------------------
    // Execute transition
    // ---------------------------------------------------------
    const handleTransition = (toStep) => {
        axios.post(
            `/${init.appName}/api/workflow/transition`,
            {
                fromStep: currentStep,
                toStep: toStep
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        )
        .then(res => {
            const result = res.data;

            setNotification({
                type: "success",
                message: `Step advanced to ${result.nextStep} (status: ${result.nextStatus})`
            });

            // bubble up result (parent can update prescription state)
            if (onTransition) {
                onTransition(result);
            }
        })
        .catch(err => {
            console.error("Workflow transition failed", err);
            setNotification({
                type: "error",
                message: err.response?.data || "Workflow transition failed"
            });
        });
    };

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="p-4 bg-white rounded shadow mt-4">

            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}

            <h2 className="text-xl font-semibold mb-3">
                Workflow Actions (current: {currentStep})
            </h2>

            {loading ? (
                <p className="text-gray-500">Loading next steps...</p>
            ) : nextSteps.length === 0 ? (
                <p className="text-gray-400 italic">
                    No next actions available.
                </p>
            ) : (
                <div className="flex flex-wrap gap-3">

                    {nextSteps.map((t, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleTransition(t.toStep)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                        >
                            {t.toStep.replace(/_/g, " ")}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
