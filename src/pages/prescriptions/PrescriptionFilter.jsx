import { Filter } from "lucide-react";

const PrescriptionFilter = ({data, filterList, filterStatus, setFilterStatus}) => {
    return (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center gap-4">
                    <Filter size={18} className="text-gray-400" />
                    <button
                        onClick={() => setFilterStatus(0)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All ({data.length})
                    </button>
                    {
                        filterList.map(step => (
                            (
                                <button key={step.id}
                                    onClick={() => setFilterStatus(step.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === step.id ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {step.displayName} ({data.filter(pre => pre.workflowStepId === step.id).length})
                                </button>
                            )
                        ))
                    }

                </div>
            </div>
    )
};
export default PrescriptionFilter;