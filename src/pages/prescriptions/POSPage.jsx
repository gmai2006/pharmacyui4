import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, User, Pill, Clock, CreditCard, DollarSign, ShoppingCart, Printer, PenTool, RefreshCw, Search, Package, History, Tag, Percent } from 'lucide-react';

export default function POSPage() {
  const [activeStation, setActiveStation] = useState('station-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // POS State with real-time updates
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'RX001',
      patientName: 'John Smith',
      patientDOB: '1965-03-15',
      medication: 'Lisinopril 10mg',
      quantity: 30,
      price: 15.99,
      status: 'ready',
      prescriber: 'Dr. Williams',
      refillsRemaining: 3,
      copay: 10.00,
      insuranceCoverage: 5.99,
      dateSubmitted: '2025-11-05 08:30',
      dateReady: '2025-11-05 09:00'
    },
    {
      id: 'RX002',
      patientName: 'Mary Johnson',
      patientDOB: '1978-07-22',
      medication: 'Metformin 500mg',
      quantity: 60,
      price: 12.50,
      status: 'in-progress',
      prescriber: 'Dr. Chen',
      refillsRemaining: 5,
      copay: 5.00,
      insuranceCoverage: 7.50,
      dateSubmitted: '2025-11-05 09:15',
      dateReady: null
    },
    {
      id: 'RX003',
      patientName: 'Robert Davis',
      patientDOB: '1952-11-08',
      medication: 'Atorvastatin 20mg',
      quantity: 90,
      price: 25.99,
      status: 'ready',
      prescriber: 'Dr. Patel',
      refillsRemaining: 2,
      copay: 15.00,
      insuranceCoverage: 10.99,
      dateSubmitted: '2025-11-05 07:45',
      dateReady: '2025-11-05 08:30'
    },
    {
      id: 'RX004',
      patientName: 'Sarah Wilson',
      patientDOB: '1990-05-30',
      medication: 'Levothyroxine 50mcg',
      quantity: 30,
      price: 8.99,
      status: 'ready',
      prescriber: 'Dr. Brown',
      refillsRemaining: 11,
      copay: 5.00,
      insuranceCoverage: 3.99,
      dateSubmitted: '2025-11-05 09:45',
      dateReady: '2025-11-05 10:15'
    },
    {
      id: 'RX005',
      patientName: 'Michael Brown',
      patientDOB: '1985-09-12',
      medication: 'Amlodipine 5mg',
      quantity: 30,
      price: 10.50,
      status: 'filling',
      prescriber: 'Dr. Smith',
      refillsRemaining: 4,
      copay: 8.00,
      insuranceCoverage: 2.50,
      dateSubmitted: '2025-11-05 09:30',
      dateReady: null
    },
    {
      id: 'RX006',
      patientName: 'Emily Taylor',
      patientDOB: '1972-12-25',
      medication: 'Omeprazole 20mg',
      quantity: 30,
      price: 14.99,
      status: 'ready',
      prescriber: 'Dr. Johnson',
      refillsRemaining: 6,
      copay: 10.00,
      insuranceCoverage: 4.99,
      dateSubmitted: '2025-11-05 08:00',
      dateReady: '2025-11-05 09:30'
    }
  ]);

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

  // Simulate real-time prescription status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrescriptions(prev => prev.map(rx => {
        if (rx.status === 'filling' && Math.random() > 0.5) {
          return { 
            ...rx, 
            status: 'ready',
            dateReady: new Date().toLocaleString()
          };
        }
        return rx;
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
      rx.id === id ? { ...rx, status: newStatus } : rx
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

  const printReceipt = () => {
    alert('Receipt sent to printer!');
    setShowReceiptModal(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'filling': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'filling': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rx.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || rx.status === filterStatus;
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
                      <p className="text-gray-900">{item.medication}</p>
                      <p className="text-xs text-gray-500">{item.patientName} - {item.id}</p>
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
                <p className="font-bold text-green-900">{prescriptions.filter(p => p.status === 'ready').length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Filling</p>
                <p className="font-bold text-blue-900">{prescriptions.filter(p => p.status === 'filling').length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-xs text-gray-600">In Progress</p>
                <p className="font-bold text-yellow-900">{prescriptions.filter(p => p.status === 'in-progress').length}</p>
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
                    <option value="ready">Ready</option>
                    <option value="filling">Filling</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[650px] overflow-y-auto">
                {filteredPrescriptions.filter(rx => rx.status !== 'completed').map(rx => (
                  <div key={rx.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <h3 className="font-semibold text-gray-900">{rx.patientName}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(rx.status)}`}>
                            {getStatusIcon(rx.status)}
                            {rx.status.toUpperCase().replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-700 font-medium">{rx.medication}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div>Rx #: <strong>{rx.id}</strong></div>
                          <div>Qty: <strong>{rx.quantity}</strong></div>
                          <div>DOB: <strong>{rx.patientDOB}</strong></div>
                          <div>Refills: <strong>{rx.refillsRemaining}</strong></div>
                          <div className="col-span-2">Dr: <strong>{rx.prescriber}</strong></div>
                          {rx.dateReady && (
                            <div className="col-span-2 text-green-600">Ready: <strong>{rx.dateReady}</strong></div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-gray-900">${rx.copay.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Copay</p>
                        <p className="text-xs text-blue-600">+${rx.insuranceCoverage.toFixed(2)} ins</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(rx)}
                      disabled={rx.status !== 'ready' || cart.find(item => item.id === rx.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {cart.find(item => item.id === rx.id) ? 'In Cart' : rx.status === 'ready' ? 'Add to Cart' : 'Not Ready'}
                    </button>
                  </div>
                ))}
                {filteredPrescriptions.filter(rx => rx.status !== 'completed').length === 0 && (
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
                          <p className="font-medium text-gray-900 text-sm">{item.patientName}</p>
                          <p className="text-xs text-gray-600">{item.medication}</p>
                          <p className="text-xs text-gray-500">Rx: {item.id} • Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-gray-900">${item.copay.toFixed(2)}</p>
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