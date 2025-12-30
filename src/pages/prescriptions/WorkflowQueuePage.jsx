import React, { useState, useEffect } from "react";
import axios from "axios";
import init from "../../init";
import { useUser } from "../../context/UserContext";
import { Link } from "react-router-dom";

const STEPS = ["INTAKE", "REVIEW", "FILL", "QA", "READY"];

export default function WorkflowQueuePage() {
    const { appUser, token } = useUser();
    const [step, setStep] = useState("INTAKE");
    const [list, setList] = useState([]);
    
    const fetchData = () => {
        axios.get(`/${init.appName}/api/prescription-aggregate?max=500`, {
            headers: { "Authorization": `Bearer ${token}` }
        }).then(res => {
            const data = res.data;
            const filtered = data.filter(p =>
                p.items.some(i => i.workflowStep === step)
            );
            setList(filtered);
        });
    };

    useEffect(() => {
        if (appUser?.email) fetchData();
    }, [appUser, step]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Workflow Queue</h1>

            <div className="flex gap-2 mb-6">
                {STEPS.map(s => (
                    <button
                        key={s}
                        onClick={() => setStep(s)}
                        className={`px-4 py-2 rounded ${
                            step === s ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <table className="min-w-full bg-white shadow rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3">Patient</th>
                        <th className="p-3">MRN</th>
                        <th className="p-3">Items in Step</th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map(rx => {
                        const items = rx.items.filter(i => i.workflowStep === step);
                        return (
                            <tr key={rx.prescriptionId} className="border-t">
                                <td className="p-3">{rx.firstName} {rx.lastName}</td>
                                <td className="p-3">{rx.mrn}</td>
                                <td className="p-3">{items.length}</td>
                                <td className="p-3">
                                    <Link
                                        className="text-blue-600 underline"
                                        to={`/prescriptions/${rx.prescriptionId}`}
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
