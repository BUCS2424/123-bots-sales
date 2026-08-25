import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import { 
  FileText, CheckCircle, AlertCircle, RefreshCw, 
  ChevronLeft, ChevronRight, PenTool, Shield, FileCheck, FilePlus, ScrollText, Package
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DOCUMENT_TYPE_ICONS = {
  service_agreement: FileText,
  nda: Shield,
  hipaa_baa: FileCheck,
  addendum: FilePlus,
  terms_of_service: ScrollText,
  product_agreement: Package,
  custom: FileText
};

const DOCUMENT_TYPE_COLORS = {
  service_agreement: 'bg-blue-100 text-blue-700 border-blue-300',
  nda: 'bg-purple-100 text-purple-700 border-purple-300',
  hipaa_baa: 'bg-green-100 text-green-700 border-green-300',
  addendum: 'bg-orange-100 text-orange-700 border-orange-300',
  terms_of_service: 'bg-gray-100 text-gray-700 border-gray-300',
  product_agreement: 'bg-teal-100 text-teal-700 border-teal-300',
  custom: 'bg-slate-100 text-slate-700 border-slate-300'
};

const QuoteSigningPage = () => {
  const { quoteId } = useParams();
  const sigCanvas = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signResult, setSignResult] = useState(null);
  
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [billingChoices, setBillingChoices] = useState({});
  
  // Multi-document wizard state
  const [currentStep, setCurrentStep] = useState(0); // 0 = quote review, 1+ = documents
  const [documentSignatures, setDocumentSignatures] = useState({});

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/public/quote/${quoteId}`);
      setQuoteData(res.data);
      setDocuments(res.data.documents || []);
      setAlreadySigned(res.data.already_signed);
      
      // Pre-fill signer info from lead
      if (res.data.lead) {
        setSignerName(`${res.data.lead.first_name || ''} ${res.data.lead.last_name || ''}`.trim());
        setSignerEmail(res.data.lead.email || '');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Quote not found');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSignDocument = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Please provide your signature');
      return;
    }

    const signatureData = sigCanvas.current.toDataURL('image/png');
    const currentDoc = documents[currentStep - 1];
    
    setDocumentSignatures(prev => ({
      ...prev,
      [currentDoc.id]: signatureData
    }));

    // Move to next document or final submission
    if (currentStep < documents.length) {
      setCurrentStep(currentStep + 1);
      sigCanvas.current?.clear();
    }
  };

  const handleFinalSubmit = async () => {
    // Validate all documents are signed
    const unsignedDocs = documents.filter(d => !documentSignatures[d.id]);
    if (unsignedDocs.length > 0) {
      alert(`Please sign all documents. Missing: ${unsignedDocs.map(d => d.name).join(', ')}`);
      return;
    }

    if (!signerName.trim()) {
      alert('Please enter your full name');
      return;
    }
    if (!signerEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    setSigning(true);
    try {
      const documentSignaturesArray = documents.map(doc => ({
        document_id: doc.id,
        signature_data: documentSignatures[doc.id]
      }));

      const res = await axios.post(`${API_URL}/api/public/quote/${quoteId}/sign`, {
        signer_name: signerName,
        signer_email: signerEmail,
        document_signatures: documentSignaturesArray,
        billing_choices: billingChoices,
        effective_total: totalWithFees
      });
      
      setSigned(true);
      setSignResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to sign documents');
    } finally {
      setSigning(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const totalSteps = documents.length + 1; // Quote review + documents

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading contract documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (alreadySigned || signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {signed ? 'Contract Book Signed!' : 'Already Signed'}
          </h1>
          <p className="text-gray-600 mb-6">
            {signed 
              ? `All ${signResult?.documents_signed || documents.length} documents have been signed and stored securely.`
              : 'This quote has already been signed.'}
          </p>
          
          {signResult && (
            <div className="bg-blue-50 rounded-xl p-6 text-left mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">Next Steps:</h3>
              <div className="space-y-2 text-blue-800">
                <p>✓ Contract book created with {signResult.documents_signed} signed documents</p>
                <p>✓ Your project has been created</p>
                <p>✓ 65% Deposit Due: <strong>{formatCurrency(signResult.deposit_amount)}</strong></p>
                <p>✓ Balance at Go-Live: <strong>{formatCurrency(signResult.balance_amount)}</strong></p>
              </div>
            </div>
          )}

          {signed && signResult?.deposit_amount > 0 && (
            <button
              onClick={async () => {
                try {
                  const res = await axios.post(`${API_URL}/api/payments/checkout/deposit`, {
                    quote_id: quoteId,
                    origin_url: window.location.origin
                  });
                  window.location.href = res.data.url;
                } catch (err) {
                  alert(err.response?.data?.detail || 'Failed to start payment');
                }
              }}
              className="w-full py-4 bg-[#84CC16] text-white font-bold rounded-xl hover:bg-[#65a30d] transition-colors mb-4 text-lg"
            >
              Pay Deposit Now — {formatCurrency(signResult.deposit_amount)}
            </button>
          )}
          
          <p className="text-sm text-gray-500">
            Questions? Contact us at (941) 466-4-DME
          </p>
        </div>
      </div>
    );
  }

  const { quote, lead, company_name } = quoteData;
  const currentDocument = currentStep > 0 ? documents[currentStep - 1] : null;

  // Determine which items have both monthly & yearly pricing options
  const itemsWithChoices = (quote?.items || []).map((item, idx) => {
    const hasMonthly = item.price_monthly > 0 || item.billing_type === 'monthly';
    const hasYearly = item.price_yearly > 0 || item.billing_type === 'yearly';
    const hasBothOptions = (item.price_monthly > 0 && item.price_yearly > 0);
    return { ...item, _idx: idx, _hasBothOptions: hasBothOptions };
  });

  // Get the effective billing type and price for an item based on client choice
  const getEffectiveItem = (item, idx) => {
    if (item._hasBothOptions && billingChoices[idx]) {
      const choice = billingChoices[idx];
      return {
        ...item,
        billing_type: choice,
        unit_price: choice === 'yearly' ? item.price_yearly : item.price_monthly,
      };
    }
    return item;
  };

  // Recalculate totals based on client billing choices
  const effectiveItems = itemsWithChoices.map((item, idx) => getEffectiveItem(item, idx));
  const calcTotal = effectiveItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const calcOnetime = effectiveItems.filter(i => i.billing_type === 'onetime').reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const calcMonthly = effectiveItems.filter(i => i.billing_type === 'monthly').reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const calcYearly = effectiveItems.filter(i => i.billing_type === 'yearly').reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const STRIPE_RATE = 0.029;
  const STRIPE_FLAT = 0.30;
  const ccFee = (amount) => amount > 0 ? (amount * STRIPE_RATE) + STRIPE_FLAT : 0;
  const shippingAmount = Number(quote.shipping_cost || 0);
  const taxRatePercent = quote.tax_exempt ? 0 : Number(quote.tax_rate || 0);
  const taxAmount = calcTotal * (taxRatePercent / 100);
  const totalWithFees = calcTotal + taxAmount + shippingAmount + ccFee(calcTotal);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <div className="bg-[#014DB7] text-white py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">{company_name}</h1>
              <p className="text-blue-200 text-sm">Contract Signing</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Step {currentStep + 1} of {totalSteps}</p>
              <p className="text-xs text-blue-300">
                {currentStep === 0 ? 'Review Quote' : `Sign: ${currentDocument?.name}`}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  idx < currentStep ? 'bg-green-400' : 
                  idx === currentStep ? 'bg-white' : 'bg-blue-400/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 0: Quote Review */}
        {currentStep === 0 && (
          <div className="space-y-6">
            {/* Quote Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{quote.name}</h2>
                  <p className="text-gray-500">For {lead?.company_name || `${lead?.first_name} ${lead?.last_name}`}</p>
                </div>
              </div>

              {/* Quote Items Table */}
              <div className="border rounded-xl overflow-hidden mb-6">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-3">Billing</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>
                
                <div className="divide-y">
                  {itemsWithChoices.map((item, index) => {
                    const effective = getEffectiveItem(item, index);
                    const chosen = billingChoices[index];
                    return (
                      <div key={index} className="px-4 py-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <p className="font-medium text-gray-900">{item.description}</p>
                          </div>
                          <div className="col-span-3">
                            {item._hasBothOptions ? (
                              <div className="space-y-1.5">
                                <label
                                  onClick={() => setBillingChoices(prev => ({ ...prev, [index]: 'monthly' }))}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-2 cursor-pointer transition-all text-xs ${
                                    chosen === 'monthly' || (!chosen && item.billing_type === 'monthly')
                                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                                      : 'border-gray-200 text-gray-500 hover:border-blue-300'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    chosen === 'monthly' || (!chosen && item.billing_type === 'monthly')
                                      ? 'border-blue-500' : 'border-gray-300'
                                  }`}>
                                    {(chosen === 'monthly' || (!chosen && item.billing_type === 'monthly')) && (
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    )}
                                  </div>
                                  {formatCurrency(item.price_monthly)}/mo
                                </label>
                                <label
                                  onClick={() => setBillingChoices(prev => ({ ...prev, [index]: 'yearly' }))}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-2 cursor-pointer transition-all text-xs ${
                                    chosen === 'yearly' || (!chosen && item.billing_type === 'yearly')
                                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold'
                                      : 'border-gray-200 text-gray-500 hover:border-purple-300'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    chosen === 'yearly' || (!chosen && item.billing_type === 'yearly')
                                      ? 'border-purple-500' : 'border-gray-300'
                                  }`}>
                                    {(chosen === 'yearly' || (!chosen && item.billing_type === 'yearly')) && (
                                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    )}
                                  </div>
                                  {formatCurrency(item.price_yearly)}/yr
                                </label>
                              </div>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                item.billing_type === 'monthly' ? 'bg-blue-100 text-blue-700' :
                                item.billing_type === 'yearly' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.billing_type === 'monthly' ? 'Monthly' :
                                 item.billing_type === 'yearly' ? 'Yearly' : 'One-Time'}
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 text-center text-gray-600">{item.quantity}</div>
                          <div className="col-span-3 text-right font-medium">
                            {formatCurrency(effective.quantity * effective.unit_price)}
                            {effective.billing_type === 'monthly' && <span className="text-gray-400">/mo</span>}
                            {effective.billing_type === 'yearly' && <span className="text-gray-400">/yr</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Totals */}
                <div className="bg-gray-50 px-4 py-4 border-t space-y-2">
                  {calcOnetime > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">One-Time Charges:</span>
                      <span className="font-medium">{formatCurrency(calcOnetime)}</span>
                    </div>
                  )}
                  {calcMonthly > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Monthly Recurring:</span>
                      <span className="font-medium text-blue-700">{formatCurrency(calcMonthly)}/mo</span>
                    </div>
                  )}
                  {calcYearly > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-600">Yearly Recurring:</span>
                      <span className="font-medium text-purple-700">{formatCurrency(calcYearly)}/yr</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calcTotal)}</span>
                  </div>
                  {shippingAmount > 0 && (
                    <div className="flex justify-between text-sm" data-testid="quote-sign-shipping-line">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">{formatCurrency(shippingAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm" data-testid="quote-sign-tax-line">
                      <span className="text-gray-600">Tax ({taxRatePercent.toFixed(2).replace(/\.?0+$/, '')}%):</span>
                      <span className="font-medium">{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Credit Card Processing Fee (2.9% + $0.30):</span>
                    <span className="font-medium text-gray-600">{formatCurrency(ccFee(calcTotal))}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-xl text-[#014DB7]">{formatCurrency(totalWithFees)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Terms</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">65% Deposit Due Now</p>
                    <p className="text-lg font-bold text-[#014DB7]">{formatCurrency(totalWithFees * 0.65)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Balance at Go-Live</p>
                    <p className="text-lg font-bold text-gray-700">{formatCurrency(totalWithFees * 0.35)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents to Sign */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Documents Requiring Your Signature ({documents.length})
              </h3>
              
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents attached to this quote.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, idx) => {
                    const DocIcon = DOCUMENT_TYPE_ICONS[doc.document_type] || FileText;
                    const isSigned = !!documentSignatures[doc.id];
                    return (
                      <div 
                        key={doc.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
                          isSigned 
                            ? 'bg-green-50 border-green-300' 
                            : DOCUMENT_TYPE_COLORS[doc.document_type] || 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                          {isSigned ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <DocIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{doc.document_type?.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="text-sm">
                          {isSigned ? (
                            <span className="text-green-600 font-medium">Signed ✓</span>
                          ) : (
                            <span className="text-gray-400">Document {idx + 1}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Signer Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Next Button */}
            {documents.length > 0 ? (
              <button
                onClick={() => setCurrentStep(1)}
                disabled={!signerName.trim() || !signerEmail.trim()}
                className="w-full py-4 bg-[#014DB7] text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue to Sign Documents
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-yellow-800">No documents attached to this quote. Please contact the sender.</p>
              </div>
            )}
          </div>
        )}

        {/* Document Signing Steps */}
        {currentStep > 0 && currentDocument && (
          <div className="space-y-6">
            {/* Document Header */}
            <div className={`rounded-2xl p-6 border-2 ${DOCUMENT_TYPE_COLORS[currentDocument.document_type] || 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-4">
                {(() => {
                  const DocIcon = DOCUMENT_TYPE_ICONS[currentDocument.document_type] || FileText;
                  return (
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <DocIcon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{currentDocument.name}</h2>
                  <p className="text-gray-600 capitalize">{currentDocument.document_type?.replace(/_/g, ' ')}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium text-gray-700">Document {currentStep} of {documents.length}</p>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-4 border-b">
                Please read carefully before signing
              </h3>
              <div 
                className="prose prose-sm max-w-none max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-xl border"
                dangerouslySetInnerHTML={{ __html: currentDocument.content }}
              />
            </div>

            {/* Signature Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <PenTool className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Signature Required</p>
                    <p className="text-sm text-amber-700">
                      By signing below, you acknowledge that you have read and agree to the terms of this document.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sign Here for "{currentDocument.name}" *
                  </label>
                  <button 
                    onClick={clearSignature}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/50">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: 'w-full h-40 rounded-xl',
                      style: { width: '100%', height: '160px' }
                    }}
                    penColor="#0A1628"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Draw your signature above using your mouse or finger • Signing as: <strong>{signerName}</strong>
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setCurrentStep(currentStep - 1);
                    sigCanvas.current?.clear();
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                
                {currentStep < documents.length ? (
                  <button
                    onClick={handleSignDocument}
                    className="flex-1 py-3 bg-[#84CC16] text-white font-semibold rounded-xl hover:bg-[#65a30d] transition-colors flex items-center justify-center gap-2"
                  >
                    Sign & Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Sign last document then submit
                      if (sigCanvas.current?.isEmpty()) {
                        alert('Please provide your signature');
                        return;
                      }
                      const signatureData = sigCanvas.current.toDataURL('image/png');
                      const updatedSignatures = {
                        ...documentSignatures,
                        [currentDocument.id]: signatureData
                      };
                      setDocumentSignatures(updatedSignatures);
                      
                      // Now submit
                      handleFinalSubmitWithSignatures(updatedSignatures);
                    }}
                    disabled={signing}
                    className="flex-1 py-3 bg-[#014DB7] text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {signing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Sign & Complete
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Questions? Contact us at (941) 466-4-DME</p>
          <p className="mt-1">© {new Date().getFullYear()} {company_name}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );

  // Helper function to submit with the final signature
  async function handleFinalSubmitWithSignatures(allSignatures) {
    if (!signerName.trim() || !signerEmail.trim()) {
      alert('Please enter your name and email');
      return;
    }

    setSigning(true);
    try {
      const documentSignaturesArray = documents.map(doc => ({
        document_id: doc.id,
        signature_data: allSignatures[doc.id]
      }));

      const res = await axios.post(`${API_URL}/api/public/quote/${quoteId}/sign`, {
        signer_name: signerName,
        signer_email: signerEmail,
        document_signatures: documentSignaturesArray,
        billing_choices: billingChoices,
        effective_total: totalWithFees
      });
      
      setSigned(true);
      setSignResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to sign documents');
    } finally {
      setSigning(false);
    }
  }
};

export default QuoteSigningPage;
