import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  FileText, Printer, Check, X, Loader2, Download, Shield, 
  PenTool, AlertCircle, CheckCircle, Calendar, User
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import SignaturePad from './SignaturePad';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Contract type configurations
const CONTRACT_CONFIGS = {
  pawn: {
    title: 'Contract Agreement',
    color: '#c41e3a',
    icon: '💎',
  },
  storage: {
    title: 'Storage Rental Agreement',
    color: '#2563eb',
    icon: '📦',
  },
  rv_service: {
    title: 'RV Service Work Order',
    color: '#059669',
    icon: '🚐',
  }
};

const ContractSigningModal = ({
  isOpen,
  onClose,
  contractType, // 'pawn', 'storage', 'rv_service'
  contractId,
  contractNumber,
  contractData, // The contract details to display
  customerName,
  customerEmail = '',
  customerPhone = '',
  onSignComplete,
  requireWitness = false,
}) => {
  const [step, setStep] = useState(1); // 1: Review, 2: Sign, 3: Complete
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signature, setSignature] = useState(null);
  const [witnessSignature, setWitnessSignature] = useState(null);
  const [witnessName, setWitnessName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signedResult, setSignedResult] = useState(null);
  const [printAfterSign, setPrintAfterSign] = useState(false);
  const printRef = useRef(null);

  const config = CONTRACT_CONFIGS[contractType] || CONTRACT_CONFIGS.pawn;

  const handleSign = async () => {
    if (!signature?.hasSignature) {
      toast({ title: 'Signature Required', description: 'Please provide your signature', variant: 'destructive' });
      return;
    }

    if (requireWitness && (!witnessSignature?.hasSignature || !witnessName)) {
      toast({ title: 'Witness Required', description: 'Please provide witness signature and name', variant: 'destructive' });
      return;
    }

    setSigning(true);
    try {
      const token = localStorage.getItem('token');
      
      const signaturePayload = {
        contract_type: contractType,
        contract_id: contractId,
        contract_number: contractNumber,
        contract_data: contractData,
        signature: {
          signature_image: signature.image,
          signature_type: signature.type,
          typed_name: signature.typedName,
          signer_name: customerName,
          signer_email: customerEmail,
          signer_phone: customerPhone,
          device_info: navigator.userAgent,
        },
        print_requested: printAfterSign,
      };

      if (requireWitness && witnessSignature?.hasSignature) {
        signaturePayload.witness_signature = {
          signature_image: witnessSignature.image,
          signature_type: witnessSignature.type,
          typed_name: witnessSignature.typedName,
          signer_name: witnessName,
        };
      }

      const response = await axios.post(`${API}/esignature/sign`, signaturePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSignedResult(response.data);
      setStep(3);

      if (printAfterSign) {
        setTimeout(() => handlePrint(), 500);
      }

      toast({ title: '✅ Contract Signed!', description: `Signature ID: ${response.data.signature_id}` });

      if (onSignComplete) {
        onSignComplete(response.data);
      }
    } catch (error) {
      toast({ 
        title: 'Signing Failed', 
        description: error.response?.data?.detail || 'Failed to sign contract', 
        variant: 'destructive' 
      });
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${config.title} - ${contractNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: ${config.color}; border-bottom: 2px solid ${config.color}; padding-bottom: 10px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; margin-bottom: 10px; color: #333; }
            .field { margin: 5px 0; }
            .field-label { font-weight: bold; display: inline-block; width: 150px; }
            .signature-box { border: 1px solid #ccc; padding: 20px; margin-top: 20px; }
            .signature-img { max-width: 300px; height: auto; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderContractContent = () => {
    if (!contractData) return null;

    switch (contractType) {
      case 'pawn':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Contract Number</Label>
                <p className="font-mono font-semibold">{contractData.contract_number}</p>
              </div>
              <div>
                <Label className="text-gray-500">Ticket Number</Label>
                <p className="font-mono">{contractData.ticket_number}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Borrower Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Name:</span> {contractData.customer_name}</div>
                <div><span className="text-gray-500">DL:</span> {contractData.customer_dl}</div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Pledged Items</h3>
              {contractData.items?.map((item, idx) => (
                <Card key={idx} className="mb-2">
                  <CardContent className="p-3">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-gray-500">
                      {item.category} | {item.condition}
                      {item.serial_number && ` | S/N: ${item.serial_number}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Loan Terms</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <Label className="text-gray-500">Loan Amount</Label>
                  <p className="text-2xl font-bold">${contractData.loan_amount?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <Label className="text-gray-500">Payoff Amount</Label>
                  <p className="text-2xl font-bold text-green-600">${contractData.current_payoff?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <Label className="text-gray-500">Interest Rate</Label>
                  <p className="text-lg font-semibold">{contractData.interest_rate}% / month</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <Label className="text-gray-500">Due Date</Label>
                  <p className="text-lg font-semibold">{new Date(contractData.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Agreement Number</Label>
                <p className="font-mono font-semibold">{contractData.contract_number || contractData.id}</p>
              </div>
              <div>
                <Label className="text-gray-500">Unit Number</Label>
                <p className="font-mono">{contractData.unit_number || contractData.size_name}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Tenant Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Name:</span> {contractData.customer_name}</div>
                <div><span className="text-gray-500">Phone:</span> {contractData.customer_phone}</div>
                <div><span className="text-gray-500">Email:</span> {contractData.customer_email}</div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Unit Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded">
                  <Label className="text-gray-500">Monthly Rate</Label>
                  <p className="text-2xl font-bold">${contractData.monthly_rate?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <Label className="text-gray-500">Unit Size</Label>
                  <p className="text-lg font-semibold">{contractData.size_name || contractData.unit_size}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'rv_service':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Work Order</Label>
                <p className="font-mono font-semibold">{contractData.work_order_number || contractData.id}</p>
              </div>
              <div>
                <Label className="text-gray-500">Date</Label>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Vehicle:</span> {contractData.vehicle_info}</div>
                <div><span className="text-gray-500">VIN:</span> {contractData.vin}</div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Services</h3>
              {contractData.services?.map((service, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b">
                  <span>{service.description}</span>
                  <span className="font-semibold">${service.estimated_cost?.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold text-lg">
                <span>Estimated Total</span>
                <span className="text-green-600">${contractData.estimated_total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      default:
        return <pre className="text-sm">{JSON.stringify(contractData, null, 2)}</pre>;
    }
  };

  const renderTermsAndConditions = () => {
    const terms = {
      pawn: [
        "The Pledgor hereby pawns the above-described property to secure a loan.",
        "The Pledgor may redeem the pledged property by paying the full payoff amount on or before the due date.",
        "If the Pledgor fails to redeem the property by the due date plus grace period, ownership transfers to Gingerkare Custom Emporium.",
        "Interest accrues monthly on the outstanding principal balance.",
        "The Pledgor certifies they are the rightful owner of the pledged property.",
        "All transactions are subject to Alabama state regulations."
      ],
      storage: [
        "Tenant agrees to pay rent monthly in advance.",
        "Tenant shall not store hazardous materials, illegal items, or perishables.",
        "Tenant is responsible for their own insurance on stored items.",
        "Gingerkare Custom Emporium is not liable for loss, theft, or damage to stored items.",
        "Tenant must provide 30 days notice to vacate.",
        "Failure to pay rent may result in lien on stored property per Alabama law."
      ],
      rv_service: [
        "Customer authorizes the above repairs/services.",
        "Final cost may vary based on actual parts and labor required.",
        "Customer will be contacted if costs exceed estimate by more than 10%.",
        "Payment is due upon completion of services.",
        "Vehicles not picked up within 30 days may be subject to storage fees.",
        "Gingerkare Custom Emporium is not liable for pre-existing conditions."
      ]
    };

    return terms[contractType] || [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: config.color }}>
            <FileText className="w-5 h-5" />
            {config.title}
            {signedResult && <Badge variant="success" className="ml-2 bg-green-600">SIGNED</Badge>}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Review the contract details below"}
            {step === 2 && "Please sign the contract"}
            {step === 3 && "Contract signed successfully"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Review Contract */}
          {step === 1 && (
            <ScrollArea className="h-[500px] pr-4">
              <div ref={printRef}>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold" style={{ color: config.color }}>{config.title}</h2>
                  <p className="text-sm text-gray-500">Gingerkare Custom Emporium | 7860 Eddins Road, Dothan, AL 36301</p>
                </div>
                
                {renderContractContent()}
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Terms and Conditions
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    {renderTermsAndConditions().map((term, idx) => (
                      <li key={idx}>{term}</li>
                    ))}
                  </ol>
                </div>

                {signedResult && (
                  <div className="mt-6 p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Signature</h3>
                    {signature?.image && (
                      <img src={signature.image} alt="Signature" className="max-w-[300px] border" />
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Signed by {customerName} on {new Date().toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Signature ID: {signedResult.signature_id}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Step 2: Sign Contract */}
          {step === 2 && (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Legal Notice</p>
                      <p className="text-sm text-amber-700">
                        By signing below, you acknowledge that you have read, understand, and agree to all terms and conditions
                        of this {config.title.toLowerCase()}. Your electronic signature is legally binding.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-lg font-semibold">Your Signature</Label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{customerName}</span>
                    </div>
                  </div>
                  <SignaturePad
                    onSignatureChange={setSignature}
                    width={600}
                    height={200}
                  />
                </div>

                {requireWitness && (
                  <div className="border-t pt-6">
                    <div className="mb-3">
                      <Label>Witness Name</Label>
                      <Input
                        value={witnessName}
                        onChange={(e) => setWitnessName(e.target.value)}
                        placeholder="Enter witness full name"
                      />
                    </div>
                    <Label className="text-lg font-semibold">Witness Signature</Label>
                    <SignaturePad
                      onSignatureChange={setWitnessSignature}
                      width={600}
                      height={150}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox 
                    id="print-after" 
                    checked={printAfterSign}
                    onCheckedChange={setPrintAfterSign}
                  />
                  <Label htmlFor="print-after" className="cursor-pointer">
                    Print contract after signing
                  </Label>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-600">Contract Signed Successfully!</h2>
                <p className="text-gray-500 mt-2">The contract has been electronically signed and recorded.</p>
              </div>

              <Card className="w-full max-w-md">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Signature ID:</span>
                    <span className="font-mono font-semibold">{signedResult?.signature_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Document Hash:</span>
                    <span className="font-mono text-sm">{signedResult?.document_hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Signed At:</span>
                    <span>{new Date(signedResult?.signed_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep(1); }}>
                  <FileText className="w-4 h-4 mr-2" /> View Contract
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button onClick={onClose} style={{ backgroundColor: config.color }}>
                  <Check className="w-4 h-4 mr-2" /> Done
                </Button>
              </div>
            </div>
          )}
        </div>

        {step !== 3 && (
          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {step === 1 && (
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" /> Print Only
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {step === 1 && (
                  <Button 
                    onClick={() => setStep(2)}
                    style={{ backgroundColor: config.color }}
                    data-testid="proceed-to-sign-btn"
                  >
                    <PenTool className="w-4 h-4 mr-2" /> Proceed to Sign
                  </Button>
                )}
                {step === 2 && (
                  <>
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={handleSign}
                      disabled={signing || !signature?.hasSignature}
                      style={{ backgroundColor: config.color }}
                      data-testid="complete-signature-btn"
                    >
                      {signing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {signing ? 'Signing...' : 'Sign Contract'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContractSigningModal;
