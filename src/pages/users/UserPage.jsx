import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Download } from 'lucide-react';

import init from "../../init";
import UserSummary from './UserSummary';
import Notification from '../../components/Notification';
import UserDialog from './UserDialog';
import { useUser } from "../../context/UserContext";
import DeleteDialog from '../../components/DeleteDialog';
import { getErrorMessage } from '../../utils/util';

const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

const roleUrl = '/' + init.appName + '/api/' + 'roles/';
const userUrl = `/${init.appName}/api/users-with-roles/`;

const roleOptions = {
    1: { color: 'bg-red-100 text-red-800' },
    2: { color: 'bg-blue-100 text-blue-800' },
    3: { color: 'bg-green-100 text-green-800' },
    4: { color: 'bg-gray-100 text-gray-800' },
    5: { color: 'bg-amber-100 text-amber-800' },
    6: { color: 'bg-yellow-100 text-yellow-800' },
    7: { color: 'bg-lime-100 text-lime-800' },
    8: { color: 'bg-teal-100 teal-gray-800' },
};

const UserPage = () => {
    const { appUser, token } = useUser();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(undefined);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [deleteConfirmId, setDeleteConfirmId] = useState(undefined);
    const [notification, setNotification] = useState(undefined);
    const [searchFilter, setSearchFilter] = useState('');
    const roles = useRef();

    const getRoles = async () => {
        try {
            const response = await fetch(roleUrl, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch roles');
            const jsonData = await response.json();
            const userRoles = jsonData.content.toSorted((a, b) => a.roleName - b.roleName);
            roles.current = userRoles;
            console.log('Roles fetched:', userRoles);
        } catch (error) {
            const errorMesage = getErrorMessage(error);
            console.error('Error fetching data:', errorMesage);
            showNotification('Failed to load users', errorMesage);
        } finally {

        }
    };

    // ============================================================
    // FETCH USERS
    // ============================================================
    const fetchUsers = async () => {
        if (!appUser?.email) return;
        try {
                const response = await fetch(`/${init.appName}/api/users-with-roles`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                })
                if (!response.ok) throw new Error('Failed to fetch users');
                const jsonData = await response.json();
                setUsers(jsonData);
        } catch (error) {
            const errorMesage = getErrorMessage(error);
            console.error('Error fetching data:', errorMesage);
            showNotification('Failed to load users', errorMesage);
        } finally {

        }        
    };

    useEffect(() => {
        getRoles();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [appUser]);

    // Auto-dismiss notification after 3 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const handleSubmit = (userData) => {
        if (userData.userId) {
            handleUpdateUser(userData);
            showNotification('User updated successfully', 'success');
        } else {
            handleAddUser(userData);
            showNotification('User created successfully', 'success');
        }

        setShowModal(false);
        setCurrentPage(1);
        setSelectedUser(undefined);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = (id) => {
        handleDeleteUser(id);
        setDeleteConfirmId(null);
        showNotification('User deleted successfully', 'success');
    };

    // Export users to CSV
    const exportToCSV = () => {
        if (users.length === 0) {
            showNotification('No users to export', 'error');
            return;
        }

        // Prepare CSV headers
        const csvHeaders = ['ID', 'Display Name', 'Username', 'Email', 'Role', 'Status', 'Created At', 'Update At'];

        // Prepare CSV rows
        const csvRows = users.map(user => {
            const role = roles.find(r => r.id === user.roleId)?.name || 'Unknown';
            const status = user.active ? 'Active' : 'Inactive';
            return [
                user.id,
                user.displayName || '',
                user.username,
                user.email,
                role,
                status,
                user.createdAt ? new Date(user.createdAt).toISOString() : '',
                user.updatedAt ? new Date(user.updatedAt).toISOString() : ''
            ];
        });

        // Combine headers and rows
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row =>
                row.map(cell =>
                    // Escape quotes and wrap in quotes if contains comma
                    typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
                        ? `"${cell.replace(/"/g, '""')}"`
                        : cell
                ).join(',')
            )
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Users exported successfully', 'success');
    };

    // Filter users based on search
    const filteredUsers = users.filter((user) => {
        const searchLower = searchFilter.toLowerCase();
        return (
            user.username.toLowerCase().includes(searchLower) ||
            user.displayName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    // Handle delete user
    const handleDeleteUser = async (id) => {
        try {
            const response = await fetch(`${userUrl}${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            setUsers(prev => prev.filter(user => user.id !== id));
            setDeleteConfirmId(undefined);
            showNotification('User deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification(error.message || 'Failed to delete user', 'error');
        } finally {
        }
    };

    // Handle add user
    const handleAddUser = async (userData) => {
        try {
            const response = await fetch(userUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...userData
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create user');
            }

            const newUser = await response.json();
            setUsers(prev => [newUser, ...prev]);
            setShowModal(false);
            setSelectedUser(undefined);
            showNotification('User created successfully', 'success');
        } catch (error) {
            console.error('Error adding user:', error);
            showNotification(error.message || 'Failed to create user', 'error');
        } finally {
        }
    };

    const handleUpdateUser = async (data) => {
        try {
            const response = await fetch(`${userUrl}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...data
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }

            const updatedUser = await response.json();
            setUsers(prev =>
                prev.map(user =>
                    user.id === data.id ? updatedUser : user
                )
            );
            setShowModal(false);
            showNotification('User updated successfully', 'success');
        } catch (error) {
            console.error('Error updating user:', error);
            showNotification(error.message || 'Failed to update user', 'error');
        } finally {

        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
            {/* Notification Toast */}
            {notification && (
                <Notification notification={notification} />
            )}
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-600">Manage application users and their roles</p>
                </div>

                {/* Action Buttons and Search */}
                <div className="flex gap-4 mb-8 flex-wrap items-center">
                    <button
                        onClick={() => {
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                        <Plus size={20} />
                        Add User
                    </button>
                    <input
                        type="text"
                        placeholder="Search by username, name, or email..."
                        value={searchFilter}
                        onChange={(e) => {
                            setSearchFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-1 min-w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {/* <div className="text-lg font-semibold text-gray-700">
                        Total Users: <span className="text-indigo-600">{users.length}</span>
                    </div> */}

                    <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold text-gray-700">
                            Total Users: <span className="text-indigo-600">{users.length}</span>
                        </div>
                        <button
                            onClick={exportToCSV}
                            disabled={users.length === 0}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                            title="Export users to CSV"
                        >
                            <Download size={20} />
                            Export CSV
                        </button>
                    </div>

                </div>

                {/* Form Modal */}
                {showModal && (
                    <UserDialog roles={roles.current} user={selectedUser} setShowModal={setShowModal} showNotification={showNotification} addOrUpdate={handleSubmit} />
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmId && (
                    <DeleteDialog deleteConfirmId={deleteConfirmId}
                        setDeleteConfirmId={setDeleteConfirmId}
                        confirmDelete={confirmDelete}
                        name='user' />
                )}

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {users.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 text-lg">No users yet. Add one to get started!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Display Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Username
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Updated
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                {user.displayName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {user.username}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleOptions[user.roles[0].roleId].color
                                                        }`}
                                                >
                                                    {user.roles.map(r => r.roleName).join(',')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${user.active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {user.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(user.createdAt * 1000).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(user.updatedAt * 1000).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="text-indigo-600 hover:text-indigo-800 transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.userId)}
                                                        className="text-red-600 hover:text-red-800 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {users.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Items Per Page Selector */}
                            <div className="flex items-center gap-3">
                                <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                                    Rows per page:
                                </label>
                                <select
                                    id="itemsPerPage"
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>

                            {/* Page Info */}
                            <div className="text-sm text-gray-600 font-medium">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentPage === page
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (
                                            (page === 2 && currentPage > 3) ||
                                            (page === totalPages - 1 && currentPage < totalPages - 2)
                                        ) {
                                            return (
                                                <span key={page} className="px-2 text-gray-500">
                                                    ...
                                                </span>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Role Summary */}
                {users.length > 0 && (
                    <UserSummary roles={roles} users={users} />
                )}
            </div>
        </div>
    );
};

export default UserPage;