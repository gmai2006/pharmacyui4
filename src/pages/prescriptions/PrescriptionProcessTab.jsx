import React, { useEffect, useState } from "react";
import axios from "axios";
import init from "../../init";
import PrescriptionFilter from "./PrescriptionFilter";
import Notification from "../../components/Notification";
import BarcodePreviewDialog from "../../components/BarcodePreviewDialog";
import ContactPrescriberDialog from "./ContactPrescriberDialog";
import { useUser } from "../../context/UserContext";
import { AlertCircle, Clock } from "lucide-react";

/**
 * TASKS PER WORKFLOW STEP
 */
const EXTRA_TASKS = {
    INTAKE: [
        { code: "CONTACT_PRESCRIBER", label: "Contact Prescriber" }
    ],
    REVIEW: [
        { code: "PHARMACIST_NOTE", label: "Pharmacist Note" }
    ],
    FILL: [
        { code: "PRINT_BARCODE", label: "Print Barcode" }
    ],
    QA: [],
    READY: []
};

/**
 * WORKFLOW TRANSITIONS
 * Normally this would be loaded from DB.
 */
const WORKFLOW_TRANSITIONS = [
    { from: "INTAKE", to: "REVIEW" },
    { from: "REVIEW", to: "FILL" },
    { from: "FILL", to: "QA" },
    { from: "QA", to: "READY" },
    { from: "READY", to: "PICKUP" }
];

const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
};

const PrescriptionProcessTab = () => {
    const { appUser, token } = useUser();

    const [notification, setNotification] = useState(null);
    // const [workflowSteps, setWorkflowSteps] = useState([]);

    const [prescriptions, setPrescriptions] = useState([]); // now from VPrescriptionAggregate
    const [filterQueue, setFilterQueue] = useState("");

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

    // const loadWorkflowSteps = async () => {
    //     const res = await axios.get(
    //         `/${init.appName}/api/workflowsteps/selectAll`,
    //         { headers }
    //     );
    //     setWorkflowSteps(res.data);
    // };

    const loadAggregated = async () => {
        const res = await axios.get(
            `/${init.appName}/api/prescription-aggregate?max=200`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        setPrescriptions(res.data || []);
    };

    useEffect(() => {
        (async () => {
            // await loadWorkflowSteps();
            await loadAggregated();
        })();
    }, [appUser]);

    // -------------------------
    // FILTERED VIEW (by queue name)
    // -------------------------
    const filteredPrescriptions = prescriptions.filter((rx) =>
        !filterQueue
            ? true
            : rx.items.some((it) => it.workflow?.activeQueueName === filterQueue)
    );

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

    const sendPrescriberMessage = async (payload) => {
        try {
            await axios.post(
                `/${init.appName}/api/prescriber/contact`,
                payload,
                { headers }
            );
            showNotification("Message sent to prescriber.");
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

    // -------------------------
    // WORKFLOW ACTIONS
    // -------------------------

    const moveToNextStep = async (item) => {
        const transition = WORKFLOW_TRANSITIONS.find(
            (t) => t.from === item.workflowStep
        );
        if (!transition) {
            showNotification("No transition available.", "error");
            return;
        }

        try {
            await axios.post(
                `/${init.appName}/api/prescription-items/${item.prescriptionItemId}/transition`,
                { toStep: transition.to },
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            showNotification(`Moved to ${transition.to}`);

            // Refresh
            await loadAggregated();
        } catch (err) {
            console.error(err);
            showNotification("Transition failed.", "error");
        }
    };

    const runTask = (item, task) => {
        switch (task.code) {
            case "CONTACT_PRESCRIBER":
                openPrescriberDialog({
                    prescriptionId: item.prescriptionItemId,
                    prescriberId: item.prescriberId,
                    prescriberName: item.prescriberName
                });
                break;

            case "PRINT_BARCODE":
                openBarcodeDialog(item.prescriptionItemId, "code128");
                break;

            case "PHARMACIST_NOTE":
                alert("Pharmacist note dialog not yet implemented");
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

    // -------------------------
    // UI RENDER
    // -------------------------
    return (
        <div>
            {notification && <Notification notification={notification} />}

            {/* Filter Bar */}
            <PrescriptionFilter
                data={prescriptions}
                filterList={workflowSteps}
                filterStatus={filterQueue}
                setFilterStatus={setFilterQueue}
            />

            <div className="grid gap-4 mt-4">
                {filteredPrescriptions.map((rx) =>
                    rx.items
                        .filter((it) =>
                            filterQueue
                                ? it.workflow?.queueName === filterQueue
                                : true
                        )
                        .map((item) => {
                            const tasks = EXTRA_TASKS[item.workflowStep] || [];
                            const transition = WORKFLOW_TRANSITIONS.find(
                                (t) => t.from === item.workflowStep
                            );

                            return (
                                <div
                                    key={item.prescriptionItemId}
                                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            {getPriorityIcon(rx.priority)}
                                            <div>
                                                <div className="text-sm font-semibold">
                                                    {item.workflowStep}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {item.workflowStatus}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Core Info */}
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                Patient
                                            </div>
                                            <div className="font-medium">
                                                {rx.firstName} {rx.lastName}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                Drug
                                            </div>
                                            <div className="font-medium">
                                                {item.drug?.name}{" "}
                                                {item.drug?.strength}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                SIG
                                            </div>
                                            <div className="font-medium">
                                                {item.sig}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">

                                        {/* Task Buttons */}
                                        {tasks.map((task) => (
                                            <button
                                                key={task.code}
                                                onClick={() => runTask(item, task)}
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                                            >
                                                {task.label}
                                            </button>
                                        ))}

                                        {/* Workflow Transition Button */}
                                        {transition && (
                                            <button
                                                onClick={() => moveToNextStep(item)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                            >
                                                Move to {transition.to}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                )}
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
        </div>
    );
};

export default PrescriptionProcessTab;
