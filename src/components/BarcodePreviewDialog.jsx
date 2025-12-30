import React, { useState, useRef } from 'react';
import { Download, Image as ImageIcon, Printer } from 'lucide-react';
import init from '../init';

const BarcodePreviewDialog = ({ isOpen, prescriptionId, barcodeType, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [barcodeImage, setBarcodeImage] = useState(null);
    const printRef = useRef(null);

    // Fetch barcode image when dialog opens
    React.useEffect(() => {
        if (isOpen && prescriptionId) {
            fetchBarcodeImage();
        }
    }, [isOpen, prescriptionId, barcodeType]);

    const fetchBarcodeImage = async () => {
        try {
            setLoading(true);
            setError(null);

            // Call API to get barcode as Base64 with metadata
            const response = await fetch(
                `/${init.appName}/api/prescription/${prescriptionId}/image-base64/${barcodeType}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch barcode image');
            }

            const data = await response.json();
            setBarcodeImage(data.data);

        } catch (err) {
            setError(err.message || 'Error loading barcode image');
            console.error('Error fetching barcode:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (printRef.current) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printRef.current.innerHTML);
            printWindow.document.close();
            
            // Wait for content to load, then print
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    const handleDownload = async () => {
        try {
            if (barcodeImage && barcodeImage.base64) {
                // Convert Base64 to blob
                const byteCharacters = atob(barcodeImage.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: barcodeImage.mimeType || 'image/png' });

                // Create download link
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `barcode_${prescriptionId}_${barcodeType}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Error downloading barcode:', err);
            setError('Failed to download barcode');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={24} />
                        <h2 className="text-xl font-bold">
                            {barcodeType === 'code128' ? 'CODE128' : 'QR'} Barcode Preview
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-blue-800 rounded p-1 transition"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Info Section */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Prescription ID</p>
                                <p className="text-lg font-semibold text-gray-900">{prescriptionId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Barcode Type</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {barcodeType === 'code128' ? 'CODE128' : 'QR Code'}
                                </p>
                            </div>
                        </div>
                        {barcodeImage && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <p className="text-sm text-gray-600">File Size</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {(barcodeImage.fileSize / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Format</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {barcodeImage.format?.toUpperCase() || 'PNG'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">Dimensions</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {barcodeImage.width} × {barcodeImage.height} px
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-600">Loading barcode image...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                            <p className="font-semibold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Image Display */}
                    {barcodeImage && !loading && (
                        <div
                            ref={printRef}
                            className="bg-white border-2 border-gray-200 rounded-lg p-8 mb-6 flex flex-col items-center justify-center"
                        >
                            <img
                                src={barcodeImage.dataUri}
                                alt={`${barcodeType} Barcode`}
                                className="max-w-full h-auto"
                            />
                            <p className="text-gray-600 text-sm mt-4">
                                Prescription: {prescriptionId}
                            </p>
                            <p className="text-gray-600 text-sm">
                                Type: {barcodeType === 'code128' ? 'CODE128' : 'QR Code'}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Close
                        </button>

                        {barcodeImage && !loading && (
                            <>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                    title="Download barcode as PNG"
                                >
                                    <Download size={18} />
                                    Download
                                </button>

                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                    title="Print barcode"
                                >
                                    <Printer size={18} />
                                    Print
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default BarcodePreviewDialog;