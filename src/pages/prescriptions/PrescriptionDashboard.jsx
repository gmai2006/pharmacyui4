
import React, { useEffect, useState } from 'react';
import { Package, FileText, DollarSign, ShoppingCart } from 'lucide-react';
import init from '../../init';
import Header from './Header';
// import PrescriptionProcessTab from './PrescriptionProcessTab';
import POSPage from './POSPage';
// import ContactLogTimeline from './ContactLogTimeline';
import WorkflowDashboard from './WorkflowDashboard';
import WorkflowQueuePage from './WorkflowQueuePage';
import PrescriptionProcessTab from './PrescriptionProcessTab';

export const dummyContactLog = {
  id: "log-001",
  prescriptionId: "rx-2025-001",
  prescriberId: "prescriber-100",
  contactMethod: "ncpdp_rxchange",
  contactReason: "dose_issue",
  contactDetails: "AI detected unusually high dosage for pediatric patient. Requested prescriber clarification.",
  aiTriggerId: "ai-7788",
  status: "resolved",
  sentAt: "2025-01-15T10:22:00Z",
  acknowledgedAt: "2025-01-15T12:10:00Z",
  resolvedAt: "2025-01-15T13:45:00Z",
  createdBy: "pharmacist-22",
  createdAt: "2025-01-15T10:20:00Z",
  updatedAt: "2025-01-15T13:45:00Z"
};


export const dummyActions = [
  {
    id: "action-01",
    contactLogId: "log-001",
    actionType: "message_sent",
    details: "Sent RxChangeRequest to prescriber for dosage clarification.",
    createdBy: "pharmacist-22",
    createdAt: "2025-01-15T10:22:00Z"
  },
  {
    id: "action-02",
    contactLogId: "log-001",
    actionType: "fax_sent",
    details: "Auto-generated fax sent due to no response on initial RxChange request.",
    createdBy: "tech-11",
    createdAt: "2025-01-15T10:40:00Z"
  },
  {
    id: "action-03",
    contactLogId: "log-001",
    actionType: "message_received",
    details: "Prescriber responded: 'Reduce dose to 250mg BID'.",
    createdBy: null,
    createdAt: "2025-01-15T12:10:00Z"
  },
  {
    id: "action-04",
    contactLogId: "log-001",
    actionType: "pharmacy_updated_rx",
    details: "Updated prescription to new clarified dose. Updated workflow logs.",
    createdBy: "pharmacist-22",
    createdAt: "2025-01-15T13:45:00Z"
  }
];

export const dummyAttachments = [
  {
    id: "att-01",
    contactLogId: "log-001",
    fileName: "DoseClarificationFax.pdf",
    fileType: "pdf",
    metadata: { pages: 2, sender: "Pharmacy Fax Service" },
    createdAt: "2025-01-15T10:41:00Z"
  },
  {
    id: "att-02",
    contactLogId: "log-001",
    fileName: "PrescriberReply.txt",
    fileType: "text",
    metadata: { encoding: "utf-8" },
    createdAt: "2025-01-15T12:15:00Z"
  }
];

export default function PrescriptionDashboard() {
  const [activeTab, setActiveTab] = useState('processing');


  const getWorkflowStepColor = (wokflowStepId) => {
    const colors = {
      0: 'bg-purple-600 hover:bg-purple-700 text-white',
      1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      2: 'bg-orange-100 text-blue-800 border-blue-300',
      3: 'bg-amber-100 text-green-800 border-green-300',
      4: 'bg-lime-100  text-orange-800 border-orange-300',
      5: 'bg-teal-100 text-red-800 border-red-300',
      6: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[wokflowStepId] || 'bg-gray-100 text-gray-800 border-gray-300';
  };


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

           <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'pos'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <ShoppingCart size={18} className="inline mr-2" />
            Contact Timeline Logs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'processing' && (
          <PrescriptionProcessTab />
        )}

        {activeTab === 'pos' && (
          <POSPage getWorkflowStepColor={getWorkflowStepColor} />
        )}

        {activeTab === 'logs' && (
          <WorkflowQueuePage log={dummyContactLog}
                  actions={dummyActions}
                  attachments={dummyAttachments} />
        )}

        {/* {activeTab === 'claims' && (
          <ClaimTab getWorkflowStepColor={getWorkflowStepColor} />
        )} */}
      </div>
    </div>
  );
}