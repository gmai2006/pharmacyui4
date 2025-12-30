import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

/**
 * roles = list of all roles available (from DB)
 * user = UserWithRolesView or undefined
 */
const UserDialog = ({ roles, user, setShowModal, showNotification, addOrUpdate }) => {

    // ---------- BASE EMPTY USER ---------- //
    const emptyUser = {
        userId: undefined,
        username: "",
        displayName: "",
        email: "",
        active: true,
        roles: [],   // MULTI-ROLE SUPPORT
    };

    const [localUser, setLocalUser] = useState(emptyUser);

    // ----------- ON LOAD OR USER CHANGE -------- //
    useEffect(() => {
        if (user) {
            // Convert UserWithRolesView → editable user
            setLocalUser({
                userId: user.userId,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                active: user.active,
                roles: user.roles?.map((r) => ({
                    roleId: r.roleId,
                    roleName: r.roleName,
                })) ?? [],
            });
        } else {
            setLocalUser(emptyUser);
        }
    }, [user]);

    // ----------- HANDLE FORM SUBMIT -------- //
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!localUser.username || !localUser.displayName || !localUser.email) {
            showNotification("Username, display name, and email are required", "error");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(localUser.email)) {
            showNotification("Please enter a valid email", "error");
            return;
        }

        if (localUser.roles.length === 0) {
            showNotification("Please select at least one role", "error");
            return;
        }

        addOrUpdate(localUser);
    };

    // --------- HANDLE INPUT CHANGE -------- //
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setLocalUser((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // ---------- MULTI-ROLE HANDLER ---------- //
    const toggleRole = (role) => {
        const exists = localUser.roles.some((r) => r.roleId === role.id);

        if (exists) {
            // Remove role
            setLocalUser((prev) => ({
                ...prev,
                roles: prev.roles.filter((r) => r.roleId !== role.id),
            }));
        } else {
            // Add role
            setLocalUser((prev) => ({
                ...prev,
                roles: [
                    ...prev.roles,
                    { roleId: role.id, roleName: role.roleName },
                ],
            }));
        }
    };

    return (
        localUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">

                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {localUser?.userId ? "Edit User" : "Add New User"}
                        </h2>

                        <button
                            onClick={() => setShowModal(false)}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Username + Display Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={localUser.username}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={localUser.displayName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={localUser.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                            />
                        </div>

                        {/* MULTI-ROLE CHECKBOXES */}
                        <div className="border p-4 rounded-lg">
                            <label className="block text-sm font-semibold mb-3">User Roles *</label>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {roles.map((role) => {
                                    const checked = localUser.roles.some(
                                        (r) => r.roleId === role.id
                                    );

                                    return (
                                        <label
                                            key={role.id}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleRole(role)}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <span>{role.displayName}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="active"
                                checked={localUser.active}
                                onChange={handleInputChange}
                                className="w-4 h-4"
                            />
                            <span className="font-medium">Active User</span>
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
                                {localUser?.userId ? "Update User" : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );
};

export default UserDialog;
