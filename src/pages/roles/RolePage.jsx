// src/pages/roles/RolePage.jsx

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Download } from "lucide-react";
import init from "../../init";
import Notification from "../../components/Notification";
import { useUser } from "../../context/UserContext";
import DeleteDialog from "../../components/DeleteDialog";

import RoleDialog from "./RoleDialog";

const roleUrl = "/" + init.appName + "/api/roles/";

export default function RolePage() {
    const { appUser, token } = useUser();

    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(undefined);
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState(null);

    const [deleteConfirmId, setDeleteConfirmId] = useState(undefined);

    const [searchFilter, setSearchFilter] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // ---------------- FETCH ROLES ---------------- //
    const fetchRoles = () => {
        fetch(roleUrl, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        })
            .then((r) => r.json())
            .then((data) => setRoles(data.content || data))
            .catch((e) => notify("Failed to load roles", "error"));
    };

    useEffect(() => {
        if (appUser?.email) fetchRoles();
    }, [appUser]);

    // Notification helper
    const notify = (message, type = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // ---------------- ADD / UPDATE ROLE ---------------- //
    const handleSubmit = (data) => {
        if (data.id) {
            updateRole(data);
        } else {
            createRole(data);
        }

        setShowModal(false);
        setSelectedRole(undefined);
        setCurrentPage(1);
    };

    const createRole = async (data) => {
        try {
            const response = await fetch(roleUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const newRole = await response.json();
            setRoles((prev) => [newRole, ...prev]);
            notify("Role created successfully");

        } catch (e) {
            notify("Failed to create role", "error");
        }
    };

    const updateRole = async (data) => {
        try {
            const response = await fetch(roleUrl + data.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const updatedRole = await response.json();

            setRoles((prev) =>
                prev.map((r) => (r.id === data.id ? updatedRole : r))
            );

            notify("Role updated successfully");

        } catch (e) {
            notify("Failed to update role", "error");
        }
    };

    // ---------------- DELETE ROLE ---------------- //
    const confirmDelete = async (id) => {
        try {
            await fetch(roleUrl + id, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            setRoles((prev) => prev.filter((r) => r.id !== id));
            notify("Role deleted");
        } catch (e) {
            notify("Failed to delete role", "error");
        }

        setDeleteConfirmId(null);
    };

    // ---------------- SEARCH / FILTER ---------------- //
    const filteredRoles = roles.filter((r) => {
        const s = searchFilter.toLowerCase();
        return (
            r.roleName.toLowerCase().includes(s) ||
            r.displayName.toLowerCase().includes(s)
        );
    });

    // Pagination math
    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentRoles = filteredRoles.slice(start, end);

    // CSV Export
    const exportCSV = () => {
        if (roles.length === 0) {
            notify("No roles available to export", "error");
            return;
        }

        const csv = [
            ["ID", "Role Name", "Display Name", "Active", "Created At", "Updated At"].join(","),
            ...roles.map((r) =>
                [
                    r.id,
                    r.roleName,
                    r.displayName,
                    r.active ? "Active" : "Inactive",
                    r.createdAt || "",
                    r.updatedAt || "",
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = "roles.csv";
        link.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
            {notification && <Notification notification={notification} />}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Role Management</h1>
                <p className="text-gray-600 mb-6">Manage security roles for the pharmacy system</p>

                {/* Actions */}
                <div className="flex gap-4 mb-6 items-center">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                        <Plus size={20} />
                        Add Role
                    </button>

                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="px-4 py-3 border rounded-lg flex-1"
                    />

                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                </div>

                {/* Add/Edit Dialog */}
                {showModal && (
                    <RoleDialog
                        role={selectedRole}
                        setShowModal={setShowModal}
                        showNotification={notify}
                        addOrUpdate={handleSubmit}
                    />
                )}

                {/* Delete Dialog */}
                {deleteConfirmId && (
                    <DeleteDialog
                        deleteConfirmId={deleteConfirmId}
                        setDeleteConfirmId={setDeleteConfirmId}
                        confirmDelete={confirmDelete}
                        name="role"
                    />
                )}

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {roles.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No roles found. Add one to begin.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left">Role Name</th>
                                    <th className="px-6 py-3 text-left">Display Name</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRoles.map((r) => (
                                    <tr key={r.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{r.roleName}</td>
                                        <td className="px-6 py-4">{r.displayName}</td>
                                        <td className="px-6 py-4">
                                            {r.active ? (
                                                <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRole(r);
                                                        setShowModal(true);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                >
                                                    <Edit2 size={18} />
                                                </button>

                                                <button
                                                    onClick={() => setDeleteConfirmId(r.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {roles.length > 0 && (
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </div>

                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-2 border rounded-lg"
                            >
                                Prev
                            </button>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() =>
                                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                                }
                                className="px-3 py-2 border rounded-lg"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
