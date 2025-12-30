import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import { useUser } from "../../context/UserContext";
import { Link } from "react-router-dom";

export default function PrescriptionListPage() {
    const { appUser, token } = useUser();

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState("");

    const fetchAll = () => {
        if (!appUser?.email) return;

        setLoading(true);
        axios
            .get(`/${init.appName}/api/prescription-aggregate?max=200`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => setList(res.data))
            .finally(() => setLoading(false));
    };

    const search = () => {
        if (!searchName.trim()) return fetchAll();

        axios
            .get(
                `/${init.appName}/api/prescription-aggregate/search?name=${encodeURIComponent(
                    searchName
                )}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            )
            .then(res => setList(res.data));
    };

    useEffect(() => {
        fetchAll();
    }, [appUser]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Prescription List</h1>

            <div className="flex mb-4 gap-2">
                <input
                    className="border p-2 rounded w-64"
                    placeholder="Search patient name..."
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                />
                <button
                    onClick={search}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Search
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3">Patient</th>
                                <th className="p-3">MRN</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Written</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(p => (
                                <tr key={p.prescriptionId} className="border-t">
                                    <td className="p-3">
                                        {p.firstName} {p.lastName}
                                    </td>
                                    <td className="p-3">{p.mrn}</td>
                                    <td className="p-3">{p.currentStatus}</td>
                                    <td className="p-3">
                                        {p.writtenDate
                                            ? new Date(p.writtenDate).toLocaleDateString()
                                            : "-"}
                                    </td>
                                    <td className="p-3">
                                        <Link
                                            className="text-blue-600 underline"
                                            to={`/prescriptions/${p.prescriptionId}`}
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
