export const READY_TO_FILL = 'READY_FOR_FILL';
export const IN_REVIEW = 'IN_REVIEW';
export const AWAITING_PICKUP = 'AWAITING_PICKUP';
export const COMPLETED = 'COMPLETED';
export const READY_FOR_DELIVERY = 'READY_FOR_DELIVERY';
export const CANCELLED = 'CANCELLED';
export const PICKUP_READY = 'PICKUP_READY';
export const QA_CHECK = 'QA_CHECK';
export const PHARMACIST_REVIEW = 'PHARMACIST_REVIEW';
export const INTAKE_RECEIVED = 'INTAKE_RECEIVED';
export const FILL = 'FILL';
export const NEEDS_PATIENT_INFO = 'NEEDS_PATIENT_INFO';
export const NEEDS_PROVIDER_INFO = 'NEEDS_PROVIDER_INFO';
export const CONTACT_PRESCRIBER = 'CONTACT_PRESCRIBER';
export const PHARMACIST_NOTE = 'PHARMACIST_NOTE';
export const PRINT_BARCODE = 'PRINT_BARCODE';


export const WORKFLOW_STEP_TOOLTIPS = {
    INTAKE_RECEIVED: "Prescription received and awaiting initial processing.",
    PHARMACIST_REVIEW: "Pharmacist must review clinical appropriateness, allergies, and interactions.",
    NEEDS_PATIENT_INFO: "Prescription cannot continue without required patient information.",
    NEEDS_PROVIDER_INFO: "Prescriber clarification required before filling.",
    FILL: "Prescription is being filled in the pharmacy.",
    QA_CHECK: "Quality assurance verification before dispensing.",
    PICKUP_READY: "Prescription is ready for patient pickup.",
    READY_FOR_DELIVERY: "Prescription ready to be delivered.",
    CANCELLED: "Prescription has been cancelled. Requires pharmacist documentation.",
    COMPLETED: "Prescription has been dispensed and finalized."
};

/**
 * TASKS PER WORKFLOW STEP
 */
export const EXTRA_TASKS = {
    INTAKE_RECEIVED: [
        { code: CONTACT_PRESCRIBER, label: "Contact Prescriber" }
    ],
    PHARMACIST_REVIEW: [
        { code: PHARMACIST_NOTE, label: "Pharmacist Note" },
        { code: CONTACT_PRESCRIBER, label: "Contact Prescriber" }
    ],
    NEEDS_PATIENT_INFO: [
        { code: PHARMACIST_NOTE, label: "Pharmacist Note" },
        { code: CONTACT_PRESCRIBER, label: "Contact Prescriber" }
    ],
    NEEDS_PROVIDER_INFO: [
        { code: PHARMACIST_NOTE, label: "Pharmacist Note" },
        { code: CONTACT_PRESCRIBER, label: "Contact Prescriber" }
    ],
    FILL: [
        { code: PRINT_BARCODE, label: "Print Barcode" }
    ],
    QA_CHECK: [],
    PICKUP_READY: [],
    READY_FOR_DELIVERY: []
};

export const TASK_TOOLTIPS = {
    CONTACT_PRESCRIBER: "Send a message or fax to the prescriber regarding this prescription.",
    PRINT_BARCODE: "Generate and print the barcode label.",
    PHARMACIST_NOTE: "Add a pharmacist clinical documentation note.",
};

