const DeleteDialog = ({deleteConfirmId, setDeleteConfirmId, confirmDelete, name}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User</h3>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete this {name}? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setDeleteConfirmId(undefined)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => confirmDelete()}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default DeleteDialog;