
import React, { useState } from 'react';
import { FileText, ShoppingCart } from 'lucide-react';

import Header from './Header';
import POSPage from '../pos/POSPage';
import { useUser } from "../../context/UserContext";
// import WorkflowQueuePage from './WorkflowQueuePage';
import PrescriptionProcessTab from './PrescriptionProcessTab';

export default function PrescriptionDashboard() {
  const [activeTab, setActiveTab] = useState('processing');
  const { appUser } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex gap-1 px-6">
          <button
            onClick={() => setActiveTab('processing')}
            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'processing'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <FileText size={18} className="inline mr-2" />
            Prescription Processing
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'pos'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <ShoppingCart size={18} className="inline mr-2" />
            Point of Sale
          </button>

          {/* <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'pos'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <ShoppingCart size={18} className="inline mr-2" />
            Contact Timeline Logs
          </button> */}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'processing' && (
          <PrescriptionProcessTab />
        )}

        {activeTab === 'pos' && (
          <POSPage />
        )}

      </div>
    </div>
  );
}