import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import init from "../../init";
import PrescriptionFilter from "./PrescriptionFilter";
import Notification from "../../components/Notification";
import BarcodePreviewDialog from "../../components/BarcodePreviewDialog";
import ContactPrescriberDialog from "./ContactPrescriberDialog";
import { useUser } from "../../context/UserContext";
import { AlertCircle, CheckCircle, Clock, Package } from "lucide-react";
import { getErrorMessage, convertStrToCamelCase } from '../../utils/util';
import PharmacistNoteDialog from "./PharmacistNoteDialog";
import CancelPrescriptionDialog from "./CancelPrescriptionDialog";
import { PHARMACIST_REVIEW, QA_CHECK, PICKUP_READY, CANCELLED, COMPLETED, READY_FOR_DELIVERY, EXTRA_TASKS, WORKFLOW_STEP_TOOLTIPS, TASK_TOOLTIPS } from "./PrescriptionDictionary";
import { Tooltip } from "../../components/Tooltip";

const PrescriptionProcessTab = () => {
    const { appUser, token } = useUser();

    const [notification, setNotification] = useState(null);
    const [queue, setQueue] = useState([]);

    const [prescriptions, setPrescriptions] = useState([]);
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [filterQueue, setFilterQueue] = useState("");
    const steps = useRef([]);
    const [transitions, setTransitions] = useState([]);
    // Dialogs
    const [barcodeDialog, setBarcodeDialog] = useState({
        isOpen: false,
        prescriptionId: null,
        barcodeType: "code128"
    });

    const [prescriberDialog, setPrescriberDialog] = useState({
        isOpen: false,
        prescription: null
    });

    const [pharmacistDialog, setPharmacistDialog] = useState({
        isOpen: false,
        prescription: null
    });

    const [cancelDialog, setCancelDialog] = useState({
        isOpen: false,
        prescription: null
    });


    // -------------------------
    // Notification Auto-close
    // -------------------------
    useEffect(() => {
        if (notification) {
            const t = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(t);
        }
    }, [notification]);

    const showNotification = (msg, type = "success") =>
        setNotification({ message: msg, type });

    // -------------------------
    // LOAD WORKFLOW + DATA
    // -------------------------
    const loadWorkflowSteps = async () => {
        const res = await axios.get(
            `/${init.appName}/api/workflow-steps/`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        steps.current = res.data?.content || [];
    };

    const loadTransitions = async () => {
        const res = await axios.get(
            `/${init.appName}/api/vworkflow-transitions?max=200`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        setTransitions(res.data || []);
    };

    const loadPrescriptionSummary = async () => {
        const res = await axios.get(
            `/${init.appName}/api/prescription-aggregate/active?max=200`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        setPrescriptions(res.data || []);
        const queues = [...new Set(res.data.map(d => d.activeQueueName))];
        setQueue(queues);
        setFilterQueue('');
        setFilteredPrescriptions(res.data || []);
    };

    const updateQueueAndFilter = (queue) => {
        setFilterQueue(queue);
        const filtered = prescriptions.filter((rx) =>
            !queue
                ? true
                : rx.activeQueueName === queue);
        setFilteredPrescriptions(filtered);
    }

    const goToNextStep = async (item, toStep) => {
        const transition = transitions.find(t => t.toStep === item.toStep);
        if (!transition) {
            showNotification("No transition available.", "error");
            return;
        }
        //cancelled step requires a confirmation
        console.log(`goto next step ${toStep}`);
        try {
            const res = await axios.post(
                `/${init.appName}/api/workflow/transition/`,
                { prescriptionId: item.prescriptionId, fromStep: item.currentStep, toStep: toStep, userAgent: navigator.userAgent },
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            await loadPrescriptionSummary();
            console.log(`successfully move to next step ${item.currentStep}`);
            showNotification(`Moved to ${toStep}`, 'success');
        } catch (error) {
            if (error.response) {
                const errorMesage = getErrorMessage(error);
                console.error('Error update prescription:', errorMesage);
                showNotification(errorMesage, 'error');
            } else if (error.request) {
                // The request was made but NO response was received
                // This usually means a Network Error (connectivity issues, firewall, API down)
                console.log(error.request);
                showNotification('Network error. Please check your internet connection.', 'error');

            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
                showNotification('An unexpected error occurred.', 'error');
            }
        }
    };

    const submitCancellation = async () => {
        try {
            await loadPrescriptionSummary();
            closeCancelDialog();
            showNotification("Prescription cancelled successfully.", "success");

        } catch (error) {
            const msg = getErrorMessage(error);
            console.error("Cancel error:", msg);
            showNotification(msg, "error");
        }
    };


    useEffect(() => {
        console.log(`loading steps and transitions...`);
        loadWorkflowSteps();
        loadTransitions();
    }, []);

    useEffect(() => {
        loadPrescriptionSummary();
    }, [appUser]);

    // // -------------------------
    // // FILTERED VIEW (by queue name)
    // // -------------------------
    // const filteredPrescriptions = prescriptions.filter((rx) =>
    //     !filterQueue
    //         ? true
    //         : rx.activeQueueName === filterQueue);


    // -------------------------
    // TASK DIALOG HANDLERS
    // -------------------------
    const openPrescriberDialog = (prescription) => {
        setPrescriberDialog({
            isOpen: true,
            prescription
        });
    };

    const closePrescriberDialog = () => {
        setPrescriberDialog({ isOpen: false, prescription: null });
    };

    const openPharmacistDialog = (prescriptionId) => {
        setPharmacistDialog({ isOpen: true, prescriptionId });
    };

    const closePharmacistDialog = () => {
        setPharmacistDialog({ isOpen: false, prescriptionId: null });
    };

    const sendPrescriberMessage = async (payload, jobType) => {
        try {
            const res = await axios.post(
                `/${init.appName}/api/prescriber-fax/${jobType}`,
                payload,
                { responseType: "blob", headers: { "Authorization": `Bearer ${token}` } }
            );

            if (`generate` === jobType) {
                const blob = new Blob([res.data], { type: "application/pdf" });
                const url = window.URL.createObjectURL(blob);
                window.open(url, "_blank");
            }

            showNotification("Message sent to prescriber.");
            closePrescriberDialog();
        } catch (err) {
            console.error(err);
            showNotification("Failed to send message.", "error");
        }
    };

    const updatePrescriptionWithPharmacistNote = async () => {
        try {
            showNotification("Pharmacist note has been saved.");
            closePrescriberDialog();
        } catch (err) {
            console.error(err);
            showNotification("Failed to send message.", "error");
        }
    };

    const openBarcodeDialog = (prescriptionId, barcodeType = "code128") => {
        setBarcodeDialog({ isOpen: true, prescriptionId, barcodeType });
    };

    const closeBarcodeDialog = () => {
        setBarcodeDialog({
            isOpen: false,
            prescriptionId: null,
            barcodeType: "code128"
        });
    };


    const runTask = (item, task) => {
        switch (task.code) {
            case "CONTACT_PRESCRIBER":
                openPrescriberDialog(item);
                break;

            case "PRINT_BARCODE":
                openBarcodeDialog(item.prescriptionItemId, "code128");
                break;

            case "PHARMACIST_NOTE":
                openPharmacistDialog(item.prescriptionId);
                break;
        }
    };

    // -------------------------
    // STEP COLORS (optional)
    // -------------------------
    const getPriorityIcon = (priority) => {
        if (priority === "urgent")
            return <AlertCircle className="text-red-500" size={16} />;
        if (priority === "high")
            return <Clock className="text-orange-500" size={16} />;
        return <Clock className="text-gray-400" size={16} />;
    };


    const getWorkflowStepColor = (wokflowStepId) => {
        const colors = {
            INTAKE_RECEIVED: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            PHARMACIST_REVIEW: 'bg-lime-100 text-lime-800 border-lime-300',
            FILL: 'bg-orange-100 text-blue-800 border-blue-300',
            QA_CHECK: 'bg-amber-100 text-green-800 border-green-300',
            PICKUP_READY: 'bg-green-100  text-green-800 border-green-300',
            CANCELLED: 'bg-gray-200 text-red-300 border-gray-600',
            COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
            READY_FOR_DELIVERY: 'bg-green-100 text-green-800 border-green-300',
        };
        return colors[wokflowStepId] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const openCancelDialog = (prescription) => {
        setCancelDialog({ isOpen: true, prescription });
    };

    const closeCancelDialog = () => {
        setCancelDialog({ isOpen: false, prescription: null });
    };


    const DrugInfoComponent = ({ prescription }) => {
        return (
            <div>
                {prescription.items.map(rx => {
                    return (
                        <div className="grid grid-cols-3 gap-4 mb-4" key={rx.inventoryItemId}>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Drug</div>
                                <div className="font-medium">
                                    {rx?.name} {rx?.strength}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Copay</div>
                                <div className="text-sm text-gray-700">${rx.copay || 0}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">SIG</div>
                                <div className="font-medium">{rx?.sig}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const InsuranceInfoComponent = ({ prescription }) => {
        return (
            <div>
                {prescription.insurances.map(insurance => {
                    const type = (insurance.isPrimary) ? 'Primary' : (insurance.isSecondary) ? 'Secondary' : 'Ternary';
                    return (
                        <div className="grid grid-cols-3 gap-4 mb-4" key={insurance.planName}>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Plan</div>
                                <div className="font-medium">{insurance.planName}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Insurance Type</div>
                                <div className="font-medium">{type}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Group #</div>
                                <div className="font-medium">{insurance.groupNumber}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // -------------------------
    // UI RENDER
    // -------------------------
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Notification */}
            {notification && <Notification notification={notification} />}

            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* White bordered panel (like POSPage) */}
                <div className="bg-white rounded-lg shadow-sm border p-4">

                    {/* Filter Bar */}
                    {queue && (
                        <div className="mb-4">
                            <PrescriptionFilter
                                data={prescriptions}
                                filterList={queue}
                                filterStatus={filterQueue}
                                setFilterStatus={updateQueueAndFilter}
                            />
                        </div>
                    )}

                    {/* Scrollable Content Area */}
                    <div className="max-h-[55vh] overflow-y-auto pr-2">

                        {filteredPrescriptions.length > 0 && transitions.length > 0 && (
                            <div className="grid gap-4">
                                {filteredPrescriptions.map(item => {
                                    const tasks = EXTRA_TASKS[item.currentStep] || [];
                                    const transition = transitions.find(t => t.fromStep === item.currentStep);
                                    const toSteps = transition?.toSteps.filter(step => step !== item.currentStep) || [];
                                    const numberOfButtons = tasks.length + toSteps.length;
                                    return (
                                        <div
                                            key={item.prescriptionId}
                                            className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md"
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className={`flex p-2 rounded text-xs font-medium border ${getWorkflowStepColor(item.currentStep)}`}>
                                                            {getPriorityIcon(item.priority)} <span>{" " + item.currentStep.replace("_", " ")} </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Status: {item.currentStatus.replace("_", " ")}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Patient / Prescriber Info */}
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Patient</div>
                                                    <div className="font-medium">
                                                        {item.patientFirstName} {item.patientLastName}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Prescriber</div>
                                                    <div className="font-medium">
                                                        {item.prescriberFirstName} {item.prescriberLastName}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Clinic</div>
                                                    <div className="font-medium">{item.clinicName}</div>
                                                </div>
                                            </div>

                                            {/* Insurance Info */}
                                            <InsuranceInfoComponent prescription={item} />

                                            {/* Drug Info */}
                                            <DrugInfoComponent prescription={item} />

                                            {/* Actions */}

                                            <div className="grid grid-flow-col auto-cols-fr gap-2 mt-3 w-full">
                                                {tasks.map(task => (
                                                    <Tooltip key={task.code} text={TASK_TOOLTIPS[task.code]}>
                                                        <button
                                                            onClick={() => runTask(item, task)}
                                                            className="cursor-pointer w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-center"
                                                        >
                                                            {task.label}
                                                        </button>
                                                    </Tooltip>
                                                ))}

                                                {toSteps.map(step => (
                                                    <Tooltip key={step} text={WORKFLOW_STEP_TOOLTIPS[step]}>
                                                        <button
                                                            onClick={() =>
                                                                step === CANCELLED
                                                                    ? openCancelDialog(item)
                                                                    : goToNextStep(item, step)
                                                            }
                                                            className={`cursor-pointer w-full px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors ${getWorkflowStepColor(step)}`}
                                                        >
                                                            {convertStrToCamelCase(step)}
                                                        </button>
                                                    </Tooltip>
                                                ))}
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <BarcodePreviewDialog
                isOpen={barcodeDialog.isOpen}
                prescriptionId={barcodeDialog.prescriptionId}
                barcodeType={barcodeDialog.barcodeType}
                onClose={closeBarcodeDialog}
            />

            <ContactPrescriberDialog
                isOpen={prescriberDialog.isOpen}
                prescription={prescriberDialog.prescription}
                onClose={closePrescriberDialog}
                onSubmit={sendPrescriberMessage}
            />

            <PharmacistNoteDialog
                open={pharmacistDialog.isOpen}
                mode='create'
                existingNote={null}
                prescriptionId={pharmacistDialog.prescriptionId}
                onClose={closePharmacistDialog}
                onSaved={updatePrescriptionWithPharmacistNote}
            />

            <CancelPrescriptionDialog
                open={cancelDialog.isOpen}
                prescription={cancelDialog.prescription}
                onClose={closeCancelDialog}
                onSubmit={submitCancellation}
            />

        </div>
    );


};

export default PrescriptionProcessTab;
