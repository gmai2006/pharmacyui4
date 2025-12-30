import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import DeviceFingerprintService from '../../utils/fingerprinting';

export default function UpdateDeviceHashDialog({ device, close, submit, notify }) {
    const [existingHash, setExistingHash] = useState("");
    const [newHash, setNewHash] = useState("");

    useEffect(() => {
        const getHash = async () => {
            const finger = await DeviceFingerprintService.generateFingerprint();
            const hash = await DeviceFingerprintService.createFingerprintHash(finger);
            setNewHash(hash);
        }
        getHash();
    }, []);

    useEffect(() => {
        if (device) {
            setExistingHash(device.fingerprintHash || "");
        }
    }, [device]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newHash) {
            notify("error", "New hashcode is required");
            return;
        }


        submit({
            ...device, fingerprintHash: newHash
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">

                {/* HEADER */}
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        Update Device Hashcode
                    </h2>

                    <button onClick={close} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Existing Hashcode (from DB)
                        </label>
                        <textarea
                            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-sm"
                            value={existingHash}
                            readOnly
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            New Hashcode (from the current station)
                        </label>
                        <textarea
                            className="w-full px-4 py-2 border rounded-lg text-sm"
                            value={newHash}
                            readOnly
                            placeholder="Local fingerprint hash"
                            rows={2}
                            required
                        />
                    </div>

                    {/* FOOTER BUTTONS */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={close}
                            className="px-5 py-2 border border-gray-300 rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
