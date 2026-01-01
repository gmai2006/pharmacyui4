import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import Notification from "../../components/Notification";
import { useUser } from "../../context/UserContext";
import { useSearchParams, useNavigate } from "react-router-dom";

import { Plus, Trash2, Search, CheckCircle } from "lucide-react";

function useDebouncedCallback(callback, delay) {
    const timeoutRef = React.useRef(null);

    return (...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}


const PrescriptionEntryPage = () => {
    const latestSearchRef = React.useRef(0);

    const { token, appUser } = useUser();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const patientId = params.get("patientId");

    // ------------------------------------------------------------
    // STATE
    // ------------------------------------------------------------
    const [notification, setNotification] = useState(null);

    // Prescribers
    const [prescribers, setPrescribers] = useState([]);
    const [prescriberSearch, setPrescriberSearch] = useState("");
    const [selectedPrescriber, setSelectedPrescriber] = useState(null);

    const [prescriber, setPrescriber] = useState({
        id: null,
        firstName: "",
        lastName: "",
        npi: "",
        clinicName: ""
    });

    // Prescription items
    const [items, setItems] = useState([
        {
            inventoryItemId: null,
            drugName: "",
            strength: "",
            ndc: "",
            quantity: "",
            refills: 0,
            daw: false,

            // UI only
            searchText: "",
            suggestions: [],
            searching: false
        }
    ]);


    const [submitting, setSubmitting] = useState(false);

    // ------------------------------------------------------------
    // GUARD
    // ------------------------------------------------------------
    useEffect(() => {
        // if (!patientId) navigate("/intake/new");
    }, [patientId, navigate]);

    // ------------------------------------------------------------
    // NOTIFICATION
    // ------------------------------------------------------------
    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
    };

    useEffect(() => {
        if (notification) {
            const t = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(t);
        }
    }, [notification]);

    // ------------------------------------------------------------
    // FETCH PRESCRIBERS (same API as PrescriberPage)
    // ------------------------------------------------------------
    const fetchPrescribers = () => {
        if (!appUser) return;

        axios
            .get(`/${init.appName}/api/prescribers?page=0&size=500`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setPrescribers(res.data.content || []))
            .catch(() =>
                showNotification("Failed to load prescribers", "error")
            );
    };

    useEffect(() => {
        fetchPrescribers();
    }, [appUser]);

    // ------------------------------------------------------------
    // PRESCRIBER SEARCH
    // ------------------------------------------------------------
    const filteredPrescribers = prescribers.filter(p => {
        const s = prescriberSearch.toLowerCase();
        return (
            p.npi?.toLowerCase().includes(s) ||
            p.firstName?.toLowerCase().includes(s) ||
            p.lastName?.toLowerCase().includes(s)
        );
    });

    const selectPrescriber = (p) => {
        setSelectedPrescriber(p);
        setPrescriber({
            id: p.id,
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            npi: p.npi || "",
            clinicName: p.clinicName || ""
        });
        showNotification(
            `Selected prescriber: ${p.lastName}, ${p.firstName}`
        );
    };

    // ------------------------------------------------------------
    // ITEMS
    // ------------------------------------------------------------
    const addItem = () => {
        setItems(prev => [
            ...prev,
            {
                drugName: "",
                strength: "",
                ndc: "",
                quantity: "",
                refills: 0,
                daw: false
            }
        ]);
    };

    const updateItem = (idx, field, value) => {
        setItems(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    };


    const removeItem = (idx) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    // ------------------------------------------------------------
    // VALIDATION
    // ------------------------------------------------------------
    const validate = () => {
        if (!prescriber.lastName.trim()) {
            showNotification("Prescriber last name is required", "error");
            return false;
        }

        for (const i of items) {
            if (!i.drugName.trim()) {
                showNotification("Each item requires Drug", "error");
                return false;
            }
        }
        return true;
    };

    // ------------------------------------------------------------
    // SUBMIT
    // ------------------------------------------------------------
    const submitIntake = async () => {
        if (!validate()) return;

        const payload = {
            patientId,
            prescriber,
            items
        };

        try {
            setSubmitting(true);

            await axios.post(
                `/${init.appName}/api/prescriptions/intake`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showNotification("Prescription intake created");

            setTimeout(() => navigate("/prescriptions"), 800);
        } catch {
            showNotification("Failed to submit intake", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const searchInventoryItems = async (idx, text) => {
        const requestId = ++latestSearchRef.current;
        if (!text || text.length < 2) {
            updateItem(idx, "suggestions", []);
            return;
        }

        try {
            updateItem(idx, "searching", true);

            const res = await axios.get(
                `/${init.appName}/api/inventory-items/search`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        name: text,
                        ndc: text,
                        page: 0,
                        size: 10
                    }
                }
            );

            if (requestId === latestSearchRef.current) {
                updateItem(idx, "suggestions", res.data.content || []);
            }
        } catch (err) {
            console.error("Inventory search failed", err);
        } finally {
            updateItem(idx, "searching", false);
        }
    };

    const debouncedInventorySearch = useDebouncedCallback(
        (idx, text) => {
            searchInventoryItems(idx, text);
        },
        300
    );


    // ------------------------------------------------------------
    // RENDER
    // ------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {notification && <Notification notification={notification} />}

            <div className="max-w-5xl mx-auto">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Prescription Entry</h1>
                    <p className="text-gray-600">
                        Select prescriber and enter prescription details
                    </p>
                </div>

                {/* PRESCRIBER SEARCH */}
                <div className="bg-white border rounded-lg p-6 mb-6">
                    <h2 className="font-semibold text-indigo-700 mb-4">
                        Prescriber
                    </h2>

                    <div className="flex items-center gap-3 mb-4">
                        <Search className="text-gray-400" />
                        <input
                            placeholder="Search by NPI or name..."
                            value={prescriberSearch}
                            onChange={(e) => setPrescriberSearch(e.target.value)}
                            className="flex-1 p-2 border rounded"
                        />
                    </div>

                    {prescriberSearch && (
                        <div className="max-h-48 overflow-y-auto border rounded mb-4">
                            {filteredPrescribers.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => selectPrescriber(p)}
                                    className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {p.lastName}, {p.firstName}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            NPI: {p.npi}
                                        </div>
                                    </div>
                                    <CheckCircle className="text-indigo-600" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PRESCRIBER DETAILS (EDITABLE) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="First Name"
                            className="p-2 border rounded"
                            value={prescriber.firstName}
                            onChange={e =>
                                setPrescriber({ ...prescriber, firstName: e.target.value })
                            }
                        />
                        <input
                            placeholder="Last Name *"
                            className="p-2 border rounded"
                            value={prescriber.lastName}
                            onChange={e =>
                                setPrescriber({ ...prescriber, lastName: e.target.value })
                            }
                        />
                        <input
                            placeholder="NPI"
                            className="p-2 border rounded"
                            value={prescriber.npi}
                            onChange={e =>
                                setPrescriber({ ...prescriber, npi: e.target.value })
                            }
                        />
                        <input
                            placeholder="Clinic Name"
                            className="p-2 border rounded"
                            value={prescriber.clinicName}
                            onChange={e =>
                                setPrescriber({ ...prescriber, clinicName: e.target.value })
                            }
                        />
                    </div>
                </div>

                {/* PRESCRIPTION ITEMS */}
                <div className="bg-white border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-indigo-700">
                            Prescription Items
                        </h2>
                        <button
                            onClick={addItem}
                            className="flex items-center gap-2 text-indigo-600"
                        >
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    {items.map((item, idx) => (
                        <div key={idx} className="border rounded p-4 mb-4">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        placeholder="Search drug by name or NDC *"
                                        className="p-2 border rounded w-full"
                                        value={item.searchText}
                                        onChange={(e) => {
                                            const text = e.target.value;
                                            updateItem(idx, "searchText", text);
                                            debouncedInventorySearch(idx, text);

                                        }}
                                    />

                                    {/* Dropdown */}
                                    {item.suggestions?.length > 0 && (
                                        <div className="absolute z-20 bg-white border rounded shadow w-full max-h-56 overflow-y-auto">
                                            {item.suggestions.map((inv) => (
                                                <div
                                                    key={inv.id}
                                                    className="p-3 hover:bg-indigo-50 cursor-pointer"
                                                    onClick={() => {
                                                        updateItem(idx, "inventoryItemId", inv.id);
                                                        updateItem(idx, "drugName", inv.name);
                                                        updateItem(idx, "strength", inv.strength || "");
                                                        updateItem(idx, "searchText", `${inv.name} ${inv.strength || ""}`);
                                                        updateItem(idx, "suggestions", []);
                                                    }}
                                                >
                                                    <div className="font-medium">
                                                        {inv.name} {inv.strength}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        NDC: {inv.ndc}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <input
                                    placeholder="Strength"
                                    className="p-2 border rounded"
                                    value={item.strength}
                                    onChange={e =>
                                        updateItem(idx, "strength", e.target.value)
                                    }
                                />
                            </div>


                            <div className="grid grid-cols-3 gap-4 mt-3">
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    className="p-2 border rounded"
                                    value={item.quantity}
                                    onChange={e =>
                                        updateItem(idx, "quantity", e.target.value)
                                    }
                                />
                                <input
                                    type="number"
                                    placeholder="Refills"
                                    className="p-2 border rounded"
                                    value={item.refills}
                                    onChange={e =>
                                        updateItem(idx, "refills", e.target.value)
                                    }
                                />
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={item.daw}
                                        onChange={() =>
                                            updateItem(idx, "daw", !item.daw)
                                        }
                                    />
                                    DAW
                                </label>
                            </div>

                            {items.length > 1 && (
                                <div className="mt-3 text-right">
                                    <button
                                        onClick={() => removeItem(idx)}
                                        className="text-red-600 flex items-center gap-1"
                                    >
                                        <Trash2 size={16} /> Remove Item
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={() => navigate("/intake/new")}
                        className="px-6 py-2 border rounded-lg"
                    >
                        Back
                    </button>
                    <button
                        onClick={submitIntake}
                        disabled={submitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                    >
                        {submitting ? "Submitting…" : "Submit Intake"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PrescriptionEntryPage;
