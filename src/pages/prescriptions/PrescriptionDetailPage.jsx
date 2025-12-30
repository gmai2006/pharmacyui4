import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import { useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function PrescriptionDetailPage() {
    const { id } = useParams();
    const { appUser, token } = useUser();

    const [rx, setRx] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRx = () => {
        axios
            .get(`/${init.appName}/api/prescription-aggregate/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => setRx(res.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (appUser?.email) fetchRx();
    }, [appUser]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!rx) return <div className="p-6">Not Found</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Prescription Details</h1>

            {/* Patient Card */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-xl font-semibold">Patient Info</h2>
                <p>{rx.firstName} {rx.lastName}</p>
                <p>MRN: {rx.mrn}</p>
                <p>DOB: {rx.dob ? new Date(rx.dob).toLocaleDateString() : "-"}</p>
                <p>Gender: {rx.gender}</p>
            </div>

            {/* Insurance */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-xl font-semibold mb-2">Insurance</h2>
                {rx.insuranceList?.map((ins, i) => (
                    <div key={i} className="border-b py-2">
                        <p><strong>{ins.planName}</strong></p>
                        <p>BIN: {ins.bin}  PCN: {ins.pcn}  Group: {ins.groupNumber}</p>
                        <p>Payer: {ins.payerName}</p>
                        <p>Coverage: {ins.coverageStart} → {ins.coverageEnd}</p>
                    </div>
                ))}
            </div>

            {/* Items */}
            <div className="bg-white p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-2">Prescription Items</h2>

                {rx.items.map((item, i) => (
                    <div key={i} className="border-b py-3">
                        <h3 className="font-semibold text-lg">
                            {item.drug?.name} {item.drug?.strength}
                        </h3>

                        <p><strong>SIG:</strong> {item.sig}</p>
                        <p><strong>Quantity:</strong> {item.quantity}</p>
                        <p><strong>Workflow:</strong> {item.workflowStep} / {item.workflowStatus}</p>

                        <details className="mt-2">
                            <summary className="cursor-pointer text-blue-600">Details</summary>
                            <pre className="bg-gray-100 p-2 mt-2 rounded text-sm">
{JSON.stringify(item, null, 2)}
                            </pre>
                        </details>
                    </div>
                ))}
            </div>
        </div>
    );
}
