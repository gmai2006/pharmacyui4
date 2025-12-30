import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";
import init from "../../init";
import { useUser } from "../../context/UserContext";

export default function DeviceDialog({ device, close, submit, notify }) {
    const { token } = useUser();

    const emptyDevice = {
        id: null,
        stationId: "",
        fingerprintHash: "",
        department: "",
        location: "",
        isActive: true,
    };

    const [local, setLocal] = useState(emptyDevice);
    const [stations, setStations] = useState([]);

    // --------------------------------------------------------------
    // Load stations
    // --------------------------------------------------------------
    useEffect(() => {
        axios
            .get(`/${init.appName}/api/stations/unassigned`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setStations(res.data.content || []))
            .catch(() => notify("error", "Failed to load stations"));
    }, []);

    // --------------------------------------------------------------
    // Pre-fill fields
    // --------------------------------------------------------------
    useEffect(() => {
        setLocal(device ?? emptyDevice);
    }, [device]);

    // --------------------------------------------------------------
    // Handle change (generic)
    // --------------------------------------------------------------
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setLocal((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // --------------------------------------------------------------
    // Auto-fill department/location when station changes
    // --------------------------------------------------------------
    const handleStationChange = (e) => {
        const stationId = e.target.value;
        const selected = stations.find((s) => `${s.id}` === `${stationId}`);

        setLocal((prev) => ({
            ...prev,
            stationId,
            department: selected?.department || "",
            location: selected?.location || "",
        }));
    };

    // --------------------------------------------------------------
    // Submit
    // --------------------------------------------------------------
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!local.stationId) return notify("error", "Station ID is required");
        if (!local.fingerprintHash) return notify("error", "Fingerprint Hash is required");

        submit(local);
    };

    // --------------------------------------------------------------
    // RENDER
    // --------------------------------------------------------------

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">

                {/* HEADER */}
                <div className="flex justify-between items-center border-b p-5">
                    <h2 className="text-xl font-bold text-gray-900">
                        {local.id ? "Edit Device" : "Register New Device"}
                    </h2>
                    <button onClick={close} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Station */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Station *</label>
                        <select
                            name="stationId"
                            value={local.stationId}
                            onChange={handleStationChange}
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                        >
                            <option value="">Select station…</option>
                            {stations.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.stationPrefix + s.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fingerprint Hash */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Fingerprint Hash *</label>
                        <input
                            type="text"
                            name="fingerprintHash"
                            value={local.fingerprintHash}
                            readOnly
                            disabled
                            className="w-full px-4 py-2 border rounded-lg break-all"
                        />
                    </div>

                    {/* Auto-filled department + location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                            <label className="block text-sm font-medium mb-1">Department</label>
                            <input
                                type="text"
                                value={local.department}
                                readOnly
                                disabled
                                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <input
                                type="text"
                                value={local.location || ""}
                                readOnly
                                disabled
                                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
                            />
                        </div>
                    </div>

                    {/* Active */}
                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={local.isActive}
                            onChange={handleChange}
                            className="w-4 h-4"
                        />
                        <span className="font-medium">Active Device</span>
                    </div>

                    {/* FOOTER BUTTONS */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={close}
                            className="px-6 py-2 border border-gray-300 rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            {local.id ? "Update Device" : "Register Device"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
