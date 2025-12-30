// src/pages/roles/RoleDialog.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function RoleDialog({ role, setShowModal, showNotification, addOrUpdate }) {
    const emptyRole = {
        id: undefined,
        roleName: "",
        displayName: "",
        description: "",
        active: true,
    };

    const [localRole, setLocalRole] = useState(emptyRole);

    useEffect(() => {
        if (role) {
            setLocalRole({
                id: role.id,
                roleName: role.roleName,
                displayName: role.displayName,
                description: role.description,
                active: role.active,
            });
        } else {
            setLocalRole(emptyRole);
        }
    }, [role]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setLocalRole((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!localRole.roleName || !localRole.displayName) {
            showNotification("Role name and display name are required.", "error");
            return;
        }

        addOrUpdate(localRole);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold">
                        {localRole.id ? "Edit Role" : "Add New Role"}
                    </h2>

                    <button onClick={() => setShowModal(false)}>
                        <X size={24} className="text-gray-600 hover:text-gray-800" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Role Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Role Name *
                        </label>
                        <input
                            type="text"
                            name="roleName"
                            value={localRole.roleName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Display Name *
                        </label>
                        <input
                            type="text"
                            name="displayName"
                            value={localRole.displayName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={localRole.description}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg"
                            rows={3}
                        />
                    </div>

                    {/* Active Flag */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="active"
                            checked={localRole.active}
                            onChange={handleInputChange}
                            className="w-4 h-4"
                        />
                        <span className="font-medium">Active Role</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-6 py-2 border rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
                        >
                            {localRole.id ? "Update Role" : "Create Role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
