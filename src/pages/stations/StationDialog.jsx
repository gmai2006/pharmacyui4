import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function StationDialog({ station, close, submit, showNotification }) {
  const empty = {
    id: undefined,
    stationPrefix: "",
    department: "",
    location: "",
  };

  const [local, setLocal] = useState(empty);

  useEffect(() => {
    setLocal(station ?? empty);
  }, [station]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!local.stationPrefix || !local.department || !local.location) {
            showNotification('stations prefix, department, and location are required', 'error');
            return;
        }

    submit(local);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">

        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">
            {local.id ? "Edit Station" : "Add Station"}
          </h2>
          <button
            onClick={close}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Station Prefix *
            </label>
            <input
              type="text"
              value={local.stationPrefix}
              onChange={(e) =>
                setLocal({ ...local, stationPrefix: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Department *
            </label>
            <input
              type="text"
              value={local.department}
              onChange={(e) =>
                setLocal({ ...local, department: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Location *
            </label>
            <input
              type="text"
              value={local.location}
              onChange={(e) =>
                setLocal({ ...local, location: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={close}
              className="px-6 py-2 border rounded-lg bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {local.id ? "Update" : "Create"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
