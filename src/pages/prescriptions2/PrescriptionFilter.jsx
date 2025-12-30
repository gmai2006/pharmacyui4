import { Filter, List, Truck } from "lucide-react";
import { AlertCircle, CheckCircle, Clock, Package } from "lucide-react";

const PrescriptionFilter = ({ data, filterList, filterStatus, setFilterStatus }) => {
    const reviewQueues = data.filter(datum => datum.activeQueueName === `PHARMACIST_REVIEW`).length;
    const fillQueues = data.filter(datum => datum.activeQueueName === `FILL`).length;
    const readyQueues = data.filter(datum => datum.activeQueueName === `PICKUP`).length;
    const deliverQueues = data.filter(datum => datum.activeQueueName === `DELIVERY`).length;
    return (
        <div>
    
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-4 overflow-x-auto">
                        <Filter size={18} className="text-gray-400" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-200">
                            <List className="w-5 h-5 text-gray-600" />
                            <div>
                                <button
                                    onClick={() => setFilterStatus('')}
                                >
                                    All ({data.length})
                                </button>
                            </div>
                        </div>

                        {reviewQueues > 0 && <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-200">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <div>
                                <button
                                    onClick={() => setFilterStatus('PHARMACIST_REVIEW')}
                                >
                                    In Progress ({reviewQueues})
                                </button>
                            </div>
                        </div>}

                        {fillQueues > 0 && <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200  hover:bg-blue-200">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div>
                                <button
                                    onClick={() => setFilterStatus('FILL')}
                                >
                                    Fill ({fillQueues})
                                </button>
                            </div>
                        </div>}

                        {readyQueues > 0 && <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200 hover:bg-green-200">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                                <button
                                    onClick={() => setFilterStatus('PICKUP')}
                                >
                                    Pick up ({readyQueues})
                                </button>
                            </div>
                        </div>}

                        {deliverQueues > 0 && <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200 hover:bg-green-200">
                            <Truck className="w-5 h-5 text-green-600" />
                            <div>
                                <button
                                    onClick={() => setFilterStatus('DELIVERY')}
                                >
                                    Delivery ({readyQueues})
                                </button>
                            </div>
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    )
};
export default PrescriptionFilter;