import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, User, Pill, Clock, CreditCard, DollarSign, ShoppingCart, Printer, PenTool, RefreshCw, Search, Package, History, Tag, Percent } from 'lucide-react';
import axios from "axios";
import { useUser } from "../../context/UserContext";
import init from "../../init";
import { IN_REVIEW, READY_TO_FILL, AWAITING_PICKUP, COMPLETED } from '../prescriptions2/PrescriptionDictionary';

export default function POSPage() {
  const [activeStation, setActiveStation] = useState('station-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [prescriptions, setPrescriptions] = useState([]);
  const { appUser, token } = useUser();
  const [cart, setCart] = useState([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [lastTransaction, setLastTransaction] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Signature State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatures, setSignatures] = useState({});

  const loadPrescriptionSummary = async () => {
    const res = await axios.get(
      `/${init.appName}/api/prescription-aggregate?max=200`,
      { headers: { "Authorization": `Bearer ${token}` } }
    );
    setPrescriptions(res.data || []);
  };


  // POS Functions
  const addToCart = (prescription) => {
    if (!cart.find(item => item.id === prescription.id)) {
      setCart([...cart, { ...prescription, cartId: Date.now() }]);
    }
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.copay, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return (subtotal - discount).toFixed(2);
  };

  const updatePrescriptionStatus = (id, newStatus) => {
    setPrescriptions(prescriptions.map(rx =>
      rx.mrn === id ? { ...rx, currentStatus: newStatus } : rx
    ));
  };

  const applyDiscount = (percent) => {
    const subtotal = calculateSubtotal();
    setDiscount((subtotal * percent) / 100);
  };

  // Signature Functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();
    setSignatures({
      ...signatures,
      [activeStation]: {
        data: signatureData,
        timestamp: new Date().toLocaleString(),
        prescriptions: cart.map(item => item.id)
      }
    });
    setShowSignatureModal(false);
    setShowPaymentModal(true);
  };

  const processPayment = () => {
    const transaction = {
      id: 'TXN' + Date.now(),
      items: [...cart],
      subtotal: calculateSubtotal().toFixed(2),
      discount: discount.toFixed(2),
      total: calculateTotal(),
      paymentMethod,
      timestamp: new Date().toLocaleString(),
      station: activeStation,
      signature: signatures[activeStation]
    };

    cart.forEach(item => {
      updatePrescriptionStatus(item.id, 'completed');
    });

    setTransactionHistory([transaction, ...transactionHistory]);
    setLastTransaction(transaction);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    setCart([]);
    setDiscount(0);
  };

  useEffect(() => {
    loadPrescriptionSummary();
  }, [appUser]);

  const printReceipt = () => {
    alert('Receipt sent to printer!');
    setShowReceiptModal(false);
  };

  const getStatusColor = (currentStatus) => {
    switch (currentStatus) {
      case AWAITING_PICKUP: return 'bg-green-100 text-green-800';
      case IN_REVIEW: return 'bg-yellow-100 text-yellow-800';
      case READY_TO_FILL: return 'bg-blue-100 text-blue-800';
      case COMPLETED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (currentStatus) => {
    switch (currentStatus) {
      case AWAITING_PICKUP: return <CheckCircle className="w-4 h-4" />;
      case READY_TO_FILL: return <Package className="w-4 h-4" />;
      case COMPLETED: return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = rx.patientLastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patientFirstName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || rx.currentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Patient Signature</h3>
                <p className="text-sm text-gray-600 mt-1">Station: {activeStation.toUpperCase()}</p>
              </div>
              <button onClick={() => setShowSignatureModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="border-2 border-gray-300 rounded-lg bg-white mb-2">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={300}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full cursor-crosshair"
                />
              </div>
              <p className="text-sm text-gray-600">Please sign above to acknowledge receipt of medications</p>
            </div>

            <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-lg">
              <button onClick={clearSignature} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Clear
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowSignatureModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Cancel
                </button>
                <button onClick={saveSignature} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Accept Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Process Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-gray-700 font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">${calculateTotal()}</span>
                </div>
                <p className="text-sm text-gray-600">{cart.length} prescription(s)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-3" />
                    <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                    <span>Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-3" />
                    <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
                    <span>Cash</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={processPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Complete Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Transaction Complete</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900">Payment Successful</h4>
                <p className="text-sm text-gray-600">Transaction ID: {lastTransaction.id}</p>
                <p className="text-xs text-gray-500">{lastTransaction.timestamp}</p>
              </div>

              <div className="border-t border-b py-4 mb-4 space-y-2">
                {lastTransaction.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.patientFirstName} {item.patientLastName} - {item.id}</p>
                    </div>
                    <span className="font-medium">${item.copay.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${lastTransaction.subtotal}</span>
                </div>
                {lastTransaction.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${lastTransaction.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total Paid:</span>
                  <span>${lastTransaction.total}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Payment Method:</span>
                  <span className="capitalize">{lastTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Station:</span>
                  <span className="uppercase">{lastTransaction.station}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button onClick={printReceipt} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>
                <button onClick={() => setShowReceiptModal(false)} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Status Summary Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Ready</p>
                <p className="font-bold text-green-900">{prescriptions.filter(p => p.currentStatus === AWAITING_PICKUP).length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Filling</p>
                <p className="font-bold text-blue-900">{prescriptions.filter(p => p.currentStatus === READY_TO_FILL).length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-xs text-gray-600">In Progress</p>
                <p className="font-bold text-yellow-900">{prescriptions.filter(p => p.currentStatus === IN_REVIEW).length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <History className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Transactions</p>
                <p className="font-bold text-gray-900">{transactionHistory.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prescription List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Available Prescriptions</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patient or Rx..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value={AWAITING_PICKUP}>Ready</option>
                    <option value={READY_TO_FILL}>Filling</option>
                    <option value={IN_REVIEW}>In Progress</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto">
                {filteredPrescriptions.filter(rx => rx.currentStatus !== COMPLETED).map(rx => (
                  <div key={rx.prescriptionId} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <h3 className="font-semibold text-gray-900">{rx.patientFirstName} {rx.patientLastName}</h3>

                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">DOB: <strong>{rx.dob}</strong></div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(rx.currentStatus)}`}>
                            {getStatusIcon(rx.currentStatus)}
                            {rx.currentStatus.toUpperCase().replace('-', ' ')}
                          </span>
                          
                        </div>
                        <div className="col-span-2">Dr: <strong>{rx.prescriberFirstName} {rx.prescriberLastName}</strong></div>
                        {rx.items.map(drug => (
                          <div key={drug.inventoryItemId}>
                            <div className="flex items-center gap-2 mb-2">
                              <Pill className="w-4 h-4 text-gray-500" />
                              <p className="text-sm text-gray-700 font-medium">{drug.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <div>Rx #: <strong>{drug.inventoryItemId}</strong></div>
                              <div>Qty: <strong>{drug.quantity}</strong> <strong>{drug.strength}</strong></div>
                              <div>Refills: <strong>{drug.refillsAllowed}</strong></div>
                              
                              {rx.dateReady && (
                                <div className="col-span-2 text-green-600">Ready: <strong>{rx.dateReady}</strong></div>
                              )}
                            </div>
                          </div>
                        ))
                        }
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-gray-900">${rx.copay?.toFixed(2) || 0.00}</p>
                        <p className="text-xs text-gray-500">Copay</p>
                        <p className="text-xs text-blue-600">+${rx.insurancePaid?.toFixed(2)} ins</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(rx)}
                      disabled={rx.currentStatus !== AWAITING_PICKUP || cart.find(item => item.mrn === rx.mrn)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {cart.find(item => item.id === rx.mrn) ? 'In Cart' : rx.currentStatus === AWAITING_PICKUP ? 'Add to Cart' : 'Not Ready'}
                    </button>
                  </div>
                ))}
                {filteredPrescriptions.filter(rx => rx.currentStatus !== COMPLETED).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <p>No prescriptions found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Current Transaction
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">No items in cart</p>
                  <p className="text-xs mt-1">Add prescriptions to start transaction</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.cartId} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.patientFirstName} {item.patientLastName}</p>
                          {item.items.map(drug => (
                            <div>
                              <p className="text-xs text-gray-600">{drug.name}</p>
                              <p className="text-xs text-gray-500">Rx: {drug.itemId} • Qty: {drug.quantity}</p>
                            </div>
                          ))
                          }
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-gray-900">${item.copay?.toFixed(2) || 0}</p>
                          <button
                            onClick={() => removeFromCart(item.cartId)}
                            className="text-red-600 hover:text-red-800 text-xs mt-1 underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Apply Discount:</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => applyDiscount(5)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                      >
                        5%
                      </button>
                      <button
                        onClick={() => applyDiscount(10)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                      >
                        10%
                      </button>
                      <button
                        onClick={() => applyDiscount(15)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                      >
                        15%
                      </button>
                      <button
                        onClick={() => setDiscount(0)}
                        className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-colors"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount:</span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-gray-900">${calculateTotal()}</span>
                      </div>
                      <p className="text-xs text-gray-600">{cart.length} prescription(s)</p>
                    </div>

                    <button
                      onClick={() => setShowSignatureModal(true)}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                    >
                      <PenTool className="w-5 h-5" />
                      Proceed to Checkout
                    </button>

                    <button
                      onClick={() => {
                        setCart([]);
                        setDiscount(0);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Clear Cart
                    </button>

                    {signatures[activeStation] && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Signature on file
                        </p>
                        <p className="text-xs text-green-600 mt-1">{signatures[activeStation].timestamp}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Transaction History */}
            {transactionHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Transactions
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactionHistory.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{txn.id}</p>
                          <p className="text-xs text-gray-500">{txn.timestamp}</p>
                        </div>
                        <span className="font-bold text-gray-900">${txn.total}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{txn.items.length} item(s)</span>
                        <span className="capitalize">{txn.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}