import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { ContractEditor } from '../components/ContractEditor';
import { 
  ScrollText, Plus, Save, Trash2, Edit, X, RefreshCw, FileText, 
  Shield, FileCheck, Briefcase, FilePlus, GripVertical, Printer
} from 'lucide-react';

const DOCUMENT_TYPES = [
  { id: 'service_agreement', label: 'Service Agreement', icon: FileText, color: 'blue' },
  { id: 'nda', label: 'NDA', icon: Shield, color: 'purple' },
  { id: 'hipaa_baa', label: 'HIPAA BAA', icon: FileCheck, color: 'green' },
  { id: 'addendum', label: 'Addendum', icon: FilePlus, color: 'orange' },
  { id: 'terms_of_service', label: 'Terms of Service', icon: ScrollText, color: 'gray' },
  { id: 'product_agreement', label: 'Product Agreement', icon: Briefcase, color: 'teal' },
  { id: 'custom', label: 'Custom Document', icon: FileText, color: 'slate' },
];

const MERGE_FIELDS = [
  { field: '{{client_name}}', description: 'Client/owner full name' },
  { field: '{{company_name}}', description: 'Client business/company name' },
  { field: '{{business_name}}', description: 'Your business name (DME R\'US)' },
  { field: '{{provider_name}}', description: 'Your business name (DME R\'US)' },
  { field: '{{quote_name}}', description: 'Quote/project name' },
  { field: '{{quote_total}}', description: 'Total quote amount' },
  { field: '{{date}}', description: 'Current date' },
  { field: '{{valid_until}}', description: 'Quote expiration date' },
  { field: '{{email}}', description: 'Client email' },
];

const getDocTypeInfo = (typeId) => {
  return DOCUMENT_TYPES.find(dt => dt.id === typeId) || DOCUMENT_TYPES[0];
};

const getDocTypeColor = (typeId) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-700',
    teal: 'bg-teal-100 text-teal-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  const info = getDocTypeInfo(typeId);
  return colors[info.color] || colors.blue;
};

export default function AdminContractsPage() {
  const { api } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    description: '',
    document_type: 'service_agreement',
    is_default: false,
    is_required: false,
    sort_order: 0
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await api.get('/api/contract-templates');
      setContracts(res.data.templates || []);
    } catch (error) {
      console.log('No contracts found');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Contract name is required');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Contract content is required');
      return;
    }

    setSaving(true);
    try {
      if (editingContract) {
        await api.put('/api/contract-templates/' + editingContract.id, formData);
        toast.success('Contract updated');
      } else {
        await api.post('/api/contract-templates', formData);
        toast.success('Contract created');
      }
      await fetchContracts();
      resetForm();
    } catch (error) {
      toast.error('Failed to save contract');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete this contract template?')) return;
    try {
      await api.delete('/api/contract-templates/' + contractId);
      toast.success('Contract deleted');
      await fetchContracts();
    } catch (error) {
      toast.error('Failed to delete contract');
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      name: contract.name || '',
      content: contract.content || '',
      description: contract.description || '',
      document_type: contract.document_type || 'service_agreement',
      is_default: contract.is_default || false,
      is_required: contract.is_required || false,
      sort_order: contract.sort_order || 0
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingContract(null);
    setFormData({
      name: '',
      content: '',
      description: '',
      document_type: 'service_agreement',
      is_default: false,
      is_required: false,
      sort_order: 0
    });
    setShowForm(false);
  };

  const handlePrint = (contract) => {
    const docType = getDocTypeInfo(contract.document_type);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${contract.name}</title><style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; line-height: 1.6; }
      h1 { font-size: 22px; border-bottom: 2px solid #014DB7; padding-bottom: 8px; margin-bottom: 4px; }
      .doc-meta { color: #666; font-size: 13px; margin-bottom: 24px; }
      .doc-content { font-size: 14px; }
      .doc-content h1, .doc-content h2, .doc-content h3 { color: #0A1628; }
      .doc-content table { border-collapse: collapse; width: 100%; margin: 12px 0; }
      .doc-content td, .doc-content th { border: 1px solid #ddd; padding: 8px; text-align: left; }
      @media print { body { padding: 20px; } }
    </style></head><body>
      <h1>${contract.name}</h1>
      <div class="doc-meta">${docType.label} &bull; Created: ${new Date(contract.created_at).toLocaleDateString()}</div>
      <div class="doc-content">${contract.content}</div>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="space-y-6" data-testid="admin-contracts-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Contract Documents</h1>
          <p className="text-gray-500">Create and manage contract templates for quotes. Each document can be individually signed.</p>
        </div>
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)} 
            className="bg-[#84CC16] hover:bg-[#65a30d] text-white rounded-xl"
            data-testid="new-contract-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> New Document
          </Button>
        )}
      </div>

      {/* Contract Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5" data-testid="contract-form">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#0A1628] text-lg">
              {editingContract ? 'Edit Document' : 'New Document'}
            </h3>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Row 1: Name and Document Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Document Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Service Agreement"
                className="mt-1"
                data-testid="contract-name-input"
              />
            </div>
            <div>
              <Label>Document Type *</Label>
              <Select 
                value={formData.document_type} 
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger className="mt-1" data-testid="contract-type-select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <Label>Description (Internal)</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description for internal reference"
              className="mt-1"
            />
          </div>

          {/* Row 3: Options */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                data-testid="contract-default-switch"
              />
              <div>
                <Label className="cursor-pointer font-medium">Default Document</Label>
                <p className="text-xs text-gray-500">Auto-selected for new quotes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_required}
                onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                data-testid="contract-required-switch"
              />
              <div>
                <Label className="cursor-pointer font-medium">Required</Label>
                <p className="text-xs text-gray-500">Always include in quotes</p>
              </div>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="mt-1 w-24"
                min="0"
              />
            </div>
          </div>

          {/* Document Content */}
          <div>
            <Label>Document Content *</Label>
            <p className="text-xs text-gray-500 mb-2">
              This is what the client will see. Each document starts on a new page when printed.
            </p>
            <div className="mt-1 border rounded-xl overflow-hidden">
              <ContractEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Enter contract terms and conditions..."
              />
            </div>
          </div>

          {/* Merge Fields */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Available Merge Fields - Click to insert:
            </p>
            <div className="flex flex-wrap gap-2">
              {MERGE_FIELDS.map((mf) => (
                <button
                  key={mf.field}
                  type="button"
                  onClick={() => setFormData({ ...formData, content: formData.content + ' ' + mf.field })}
                  className="text-xs bg-white hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-md transition-colors border border-blue-300"
                  title={mf.description}
                >
                  {mf.field}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="bg-[#84CC16] hover:bg-[#65a30d]"
              data-testid="save-contract-btn"
            >
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </div>
      )}

      {/* Contracts List */}
      {!showForm && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading documents...
            </div>
          ) : contracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Contract Documents</h3>
              <p className="text-gray-500 mb-4">Create contract templates to attach to quotes. Each document will require a separate e-signature.</p>
              <Button onClick={() => setShowForm(true)} className="bg-[#84CC16] hover:bg-[#65a30d]">
                <Plus className="w-4 h-4 mr-2" /> Create Document
              </Button>
            </div>
          ) : (
            contracts.map((contract, index) => {
              const docType = getDocTypeInfo(contract.document_type);
              const DocIcon = docType.icon;
              return (
                <div 
                  key={contract.id} 
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#84CC16]/30 transition-colors"
                  data-testid={`contract-item-${contract.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <div className="pt-1 text-gray-300 cursor-grab">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getDocTypeColor(contract.document_type)}`}>
                      <DocIcon className="w-5 h-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#0A1628]">{contract.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getDocTypeColor(contract.document_type)}`}>
                          {docType.label}
                        </span>
                        {contract.is_default && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>
                        )}
                        {contract.is_required && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Required</span>
                        )}
                      </div>
                      {contract.description && (
                        <p className="text-sm text-gray-600 mt-1">{contract.description}</p>
                      )}
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                        {contract.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Order: {contract.sort_order || 0} • Created: {new Date(contract.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePrint(contract)}
                        className="text-[#014DB7] hover:bg-[#014DB7]/5"
                        data-testid={`print-contract-${contract.id}`}
                      >
                        <Printer className="w-4 h-4 mr-1" /> Print
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(contract)}
                        data-testid={`edit-contract-${contract.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(contract.id)} 
                        className="text-red-600 hover:bg-red-50"
                        data-testid={`delete-contract-${contract.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-[#84CC16]/5 rounded-xl p-4 border border-[#84CC16]/20">
        <h4 className="font-medium text-[#0A1628] mb-3">How Contract Documents Work</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900 mb-1">Document Types:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• <strong>Service Agreement:</strong> Main contract scope</li>
              <li>• <strong>NDA:</strong> Non-disclosure agreements</li>
              <li>• <strong>HIPAA BAA:</strong> Business Associate Agreement</li>
              <li>• <strong>Addendum:</strong> Additional terms</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">E-Signature Flow:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• Each document requires individual signature</li>
              <li>• Documents appear in sort order</li>
              <li>• New page starts for each document</li>
              <li>• Signed documents stored permanently</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
