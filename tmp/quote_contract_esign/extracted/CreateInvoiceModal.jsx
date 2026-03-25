import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';

export function CreateInvoiceModal(props) {
  var itemsState = useState([{ name: '', quantity: 1, unit_price: 0, billing_type: 'onetime', item_type: 'custom', description: '' }]);
  var items = itemsState[0];
  var setItems = itemsState[1];
  var dueDateState = useState('');
  var dueDate = dueDateState[0];
  var setDueDate = dueDateState[1];
  var locationIdState = useState('');
  var locationId = locationIdState[0];
  var setLocationId = locationIdState[1];
  var notesState = useState('');
  var invoiceNotes = notesState[0];
  var setInvoiceNotes = notesState[1];
  var savingState = useState(false);
  var saving = savingState[0];
  var setSaving = savingState[1];

  var catalogItems = buildCatalog(props.products, props.services, props.leadSales);

  function addItem() {
    setItems(items.concat([{ name: '', quantity: 1, unit_price: 0, billing_type: 'onetime', item_type: 'custom', description: '' }]));
  }

  function removeItem(index) {
    setItems(items.filter(function(_, i) { return i !== index; }));
  }

  function updateItem(index, field, value) {
    var updated = items.map(function(item, i) {
      if (i !== index) return item;
      var copy = {};
      for (var k in item) copy[k] = item[k];
      copy[field] = value;
      return copy;
    });
    setItems(updated);
  }

  function selectCatalogItem(index, itemId) {
    for (var i = 0; i < catalogItems.length; i++) {
      if (catalogItems[i].id === itemId) {
        var c = catalogItems[i];
        var updated = items.map(function(item, idx) {
          if (idx !== index) return item;
          return {
            name: c.name,
            quantity: 1,
            unit_price: c.price,
            billing_type: c.billing_type,
            item_type: c.type,
            item_id: c.id,
            description: item.description
          };
        });
        setItems(updated);
        break;
      }
    }
  }

  function calculateTotal() {
    var total = 0;
    for (var i = 0; i < items.length; i++) total += (items[i].quantity || 0) * (items[i].unit_price || 0);
    return total;
  }

  function handleSave() {
    var validItems = items.filter(function(item) { return item.name && item.quantity > 0; });
    if (validItems.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);
    props.onSave({
      client_id: props.client.id,
      client_name: props.client.name || (props.client.first_name + ' ' + props.client.last_name),
      client_email: props.client.email,
      location_id: locationId || null,
      due_date: dueDate || null,
      notes: invoiceNotes,
      items: validItems,
      status: 'pending'
    });
  }

  var BILLING_TYPES = [
    { value: 'onetime', label: 'One-Time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={props.onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={function(e) { e.stopPropagation(); }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Create Invoice</h3>
          <button onClick={props.onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Bill To</p>
          <p className="font-semibold text-gray-900">{props.client.name || (props.client.first_name + ' ' + props.client.last_name)}</p>
          <p className="text-sm text-gray-600">{props.client.email}</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select value={locationId} onChange={function(e) { setLocationId(e.target.value); }} className="w-full px-4 py-2 border rounded-lg text-sm">
                <option value="">No specific location</option>
                {(props.locations || []).map(function(loc) { return <option key={loc.id} value={loc.id}>{loc.name}</option>; })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={function(e) { setDueDate(e.target.value); }} className="w-full px-4 py-2 border rounded-lg text-sm" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Line Items</label>
              <button onClick={addItem} className="text-sm text-[#014DB7] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map(function(item, index) {
                return <InvoiceLineItem key={index} item={item} index={index} catalogItems={catalogItems} billingTypes={BILLING_TYPES} onSelect={selectCatalogItem} onUpdate={updateItem} onRemove={removeItem} canRemove={items.length > 1} />;
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={invoiceNotes} onChange={function(e) { setInvoiceNotes(e.target.value); }} placeholder="Additional notes..." rows={2} className="w-full px-4 py-2 border rounded-lg resize-none text-sm" />
          </div>

          <div className="bg-gray-900 text-white rounded-lg p-4 flex items-center justify-between">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold">${calculateTotal().toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={props.onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#014DB7]">{saving ? 'Creating...' : 'Create Invoice'}</Button>
        </div>
      </div>
    </div>
  );
}

function InvoiceLineItem({ item, index, catalogItems, billingTypes, onSelect, onUpdate, onRemove, canRemove }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <select onChange={function(e) { onSelect(index, e.target.value); }} className="w-full px-3 py-2 border rounded-lg text-sm" defaultValue="">
            <option value="" disabled>Select product, service, or lead sale...</option>
            {catalogItems.map(function(c) { return <option key={c.id} value={c.id}>[{c.typeLabel}] {c.name} (${c.price.toFixed(2)})</option>; })}
          </select>
        </div>
        {canRemove && <button onClick={function() { onRemove(index); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
      </div>
      <div className="flex gap-2">
        <input type="text" value={item.name} onChange={function(e) { onUpdate(index, 'name', e.target.value); }} placeholder="Item name" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
        <select value={item.billing_type || 'onetime'} onChange={function(e) { onUpdate(index, 'billing_type', e.target.value); }} className="w-28 px-2 py-2 border rounded-lg text-sm">
          {billingTypes.map(function(bt) { return <option key={bt.value} value={bt.value}>{bt.label}</option>; })}
        </select>
      </div>
      <div className="flex gap-2 items-center">
        <div className="w-20">
          <input type="number" min="1" value={item.quantity} onChange={function(e) { onUpdate(index, 'quantity', parseInt(e.target.value) || 1); }} className="w-full px-3 py-2 border rounded-lg text-sm text-center" />
          <p className="text-[10px] text-gray-400 text-center mt-0.5">Qty</p>
        </div>
        <div className="w-28">
          <input type="number" step="0.01" min="0" value={item.unit_price} onChange={function(e) { onUpdate(index, 'unit_price', parseFloat(e.target.value) || 0); }} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <p className="text-[10px] text-gray-400 text-center mt-0.5">Unit Price</p>
        </div>
        <div className="flex-1 text-right">
          <p className="font-semibold text-gray-900">${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</p>
          <p className="text-[10px] text-gray-400">{item.billing_type === 'monthly' ? '/mo' : item.billing_type === 'yearly' ? '/yr' : ''}</p>
        </div>
      </div>
    </div>
  );
}

function buildCatalog(products, services, leadSales) {
  var items = [];
  (products || []).forEach(function(p) {
    items.push({ id: p.id, name: p.name, price: p.price_monthly || p.price_onetime || p.price_yearly || 0, billing_type: p.price_monthly ? 'monthly' : p.price_yearly ? 'yearly' : 'onetime', type: 'product', typeLabel: 'Product' });
  });
  (services || []).forEach(function(s) {
    items.push({ id: s.id, name: s.name, price: s.price_monthly || s.price_onetime || s.hourly_rate || s.price_yearly || 0, billing_type: s.price_monthly ? 'monthly' : s.price_yearly ? 'yearly' : 'onetime', type: 'service', typeLabel: 'Service' });
  });
  (leadSales || []).forEach(function(l) {
    items.push({ id: l.id, name: l.name, price: l.price_onetime || l.price_monthly || l.price_yearly || 0, billing_type: l.price_monthly ? 'monthly' : l.price_yearly ? 'yearly' : 'onetime', type: 'lead_sale', typeLabel: 'Lead Sale' });
  });
  return items;
}
