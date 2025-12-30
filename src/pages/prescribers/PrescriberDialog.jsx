// PrescriberDialog.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { US_STATES } from '../../utils/util';

// Validation Patterns
const NPI_REGEX = /^[0-9]{10}$/;
const DEA_REGEX = /^[A-Z]{2}[0-9]{7}$/;

const PrescriberDialog = ({ prescriber, onSave, onClose, notify }) => {

    const empty = {
        id: null,
        npi: "",
        deaNumber: "",
        stateLicenseNumber: "",
        taxonomyCode: "",
        firstName: "",
        lastName: "",
        middleName: "",
        suffix: "",
        clinicName: "",
        clinicContact: {},
        erxIdentifier: "",
        ncpdpProviderId: "",
        epcsEnabled: false,
        active: true,
        contactAddress: "",
        contactCity: "",
        contactState: "",
        contactPhone: "",
        contactFax: "",
    };

    const [data, setData] = useState(empty);

    useEffect(() => {
        if (prescriber) {
            const c = prescriber.contact || {};
            setData({
                ...prescriber,
                contactAddress: c.address || "",
                contactCity: c.city || "",
                contactState: c.state || "",
                contactPhone: c.phone || "",
                contactFax: c.fax || "",
            });
        } else {
            setData(empty);
        }
    }, [prescriber]);

    const handleField = (e) => {
        const { name, type, value, checked } = e.target;
        setData(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    };

    const validate = () => {
        if (!NPI_REGEX.test(data.npi)) {
            notify("error", "Invalid NPI — must be 10 digits.");
            return false;
        }
        if (data.deaNumber && !DEA_REGEX.test(data.deaNumber)) {
            notify("error", "Invalid DEA Number (Format: AA0000000)");
            return false;
        }
        return true;
    };

    const save = () => {
        if (!validate()) return;

        const payload = {
            ...data,
            contact: {
                address: data.contactAddress,
                city: data.contactCity,
                state: data.contactState,
                phone: data.contactPhone,
                fax: data.contactFax,
            },
        };

        onSave(payload);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

            <div
                className="
                    bg-white rounded-xl shadow-2xl border border-gray-200 
                    w-full max-w-2xl max-h-[85vh] 
                    flex flex-col
                "
            >
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {data.id ? "Edit Prescriber" : "Add Prescriber"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={22} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="px-5 py-4 overflow-y-auto space-y-8">

                    {/* IDENTIFIERS */}
                    <section>
                        <h3 className="text-lg font-semibold text-indigo-700 mb-3">Identifiers</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                name="npi"
                                value={data.npi}
                                onChange={handleField}
                                placeholder="NPI (10 digits)"
                                className={`border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400 ${
                                    !NPI_REGEX.test(data.npi) ? "border-red-500" : ""
                                }`}
                            />
                            <input
                                name="deaNumber"
                                value={data.deaNumber}
                                onChange={handleField}
                                placeholder="DEA Number"
                                className={`border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400 ${
                                    data.deaNumber && !DEA_REGEX.test(data.deaNumber) ? "border-red-500" : ""
                                }`}
                            />
                            <input
                                name="stateLicenseNumber"
                                value={data.stateLicenseNumber}
                                onChange={handleField}
                                placeholder="State License Number"
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                            />
                            <input
                                name="taxonomyCode"
                                value={data.taxonomyCode}
                                onChange={handleField}
                                placeholder="Taxonomy Code"
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                    </section>

                    {/* NAME */}
                    <section>
                        <h3 className="text-lg font-semibold text-indigo-700 mb-3">Name</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                name="firstName"
                                placeholder="First Name"
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                                value={data.firstName}
                                onChange={handleField}
                            />
                            <input
                                name="lastName"
                                placeholder="Last Name"
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                                value={data.lastName}
                                onChange={handleField}
                            />
                            <input
                                name="middleName"
                                placeholder="Middle Name"
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                                value={data.middleName}
                                onChange={handleField}
                            />
                            <input
                                name="suffix"
                                placeholder="Suffix"
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                                value={data.suffix}
                                onChange={handleField}
                            />
                        </div>
                    </section>

                    {/* CLINIC */}
                    <section>
                        <h3 className="text-lg font-semibold text-indigo-700 mb-3">Clinic Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                name="clinicName"
                                placeholder="Clinic Name"
                                value={data.clinicName}
                                onChange={handleField}
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400 col-span-2"
                            />

                            <input
                                name="contactAddress"
                                placeholder="Address"
                                value={data.contactAddress}
                                onChange={handleField}
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400 col-span-2"
                            />

                            <input
                                name="contactCity"
                                placeholder="City"
                                value={data.contactCity}
                                onChange={handleField}
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                            />

                            <select
                                name="contactState"
                                value={data.contactState}
                                onChange={handleField}
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                            >
                                <option value="">State</option>
                                {US_STATES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            <input
                                name="contactPhone"
                                placeholder="Phone"
                                value={data.contactPhone}
                                onChange={handleField}
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400 col-span-2"
                            />

                            <input
                                name="contactFax"
                                placeholder="Fax"
                                value={data.contactFax}
                                onChange={handleField}
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400 col-span-2"
                            />
                        </div>
                    </section>

                    {/* ERX */}
                    <section>
                        <h3 className="text-lg font-semibold text-indigo-700 mb-3">eRx Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                name="erxIdentifier"
                                placeholder="eRx Identifier"
                                value={data.erxIdentifier}
                                onChange={handleField}
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                            />
                            <input
                                name="ncpdpProviderId"
                                placeholder="NCPDP Provider ID"
                                value={data.ncpdpProviderId}
                                onChange={handleField}
                                className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                    </section>

                    {/* STATUS */}
                    <section>
                        <h3 className="text-lg font-semibold text-indigo-700 mb-3">Status</h3>

                        <div className="flex gap-6">
                            <label className="flex gap-2 items-center">
                                <input type="checkbox" name="active" checked={data.active} onChange={handleField} />
                                Active
                            </label>

                            <label className="flex gap-2 items-center">
                                <input type="checkbox" name="epcsEnabled" checked={data.epcsEnabled} onChange={handleField} />
                                EPCS Enabled
                            </label>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-200 bg-white sticky bottom-0 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
                    >
                        Save Prescriber
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PrescriberDialog;
