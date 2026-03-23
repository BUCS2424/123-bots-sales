export const getManualOptionGroups = (product) => product?.custom_fields_data?.manual_option_groups || [];

export const hasManualOptionGroups = (product) => getManualOptionGroups(product).length > 0;

export const getDefaultOptionSelections = (product) => {
  const groups = getManualOptionGroups(product);
  return groups.reduce((acc, group) => {
    const firstValue = (group.values || []).find((value) => value?.label?.trim());
    if (firstValue) {
      acc[group.id] = firstValue.id;
    }
    return acc;
  }, {});
};

export const buildManualOptionSelectionKey = (groups = [], selections = {}) => (
  groups
    .map((group) => {
      const selectedValueId = selections[group.id];
      return selectedValueId ? `${group.id}:${selectedValueId}` : null;
    })
    .filter(Boolean)
    .join('|')
);

export const getSelectedOptionEntries = (groups = [], selections = {}) => (
  groups
    .map((group) => {
      const values = group.values || [];
      const selectedValue = values.find((value) => value.id === selections[group.id]) || values[0];
      if (!selectedValue?.label) {
        return null;
      }
      return {
        groupId: group.id,
        groupName: group.name || 'Option',
        valueId: selectedValue.id,
        valueLabel: selectedValue.label,
      };
    })
    .filter(Boolean)
);

export const getSelectedManualCombination = (product, selections = {}) => {
  const groups = getManualOptionGroups(product);
  const combinations = product?.custom_fields_data?.manual_option_combinations || [];
  if (!groups.length || !combinations.length) {
    return null;
  }

  const selectionKey = buildManualOptionSelectionKey(groups, selections);
  return combinations.find((combo) => combo.key === selectionKey) || combinations[0] || null;
};

export const getDefaultManualCombination = (product) => getSelectedManualCombination(product, getDefaultOptionSelections(product));

export const getDisplayOptionSummary = (item) => {
  if (Array.isArray(item?.selected_options) && item.selected_options.length > 0) {
    return item.selected_options
      .map((entry) => {
        const group = entry?.group_name || entry?.groupName || entry?.name || entry?.label || '';
        const value = entry?.value_label || entry?.valueLabel || entry?.value || entry?.selected || '';
        if (!group && !value) return null;
        if (!group) return `${value}`;
        if (!value) return `${group}`;
        return `${group}: ${value}`;
      })
      .filter(Boolean)
      .join(' • ');
  }

  return [item?.selected_strength, item?.selected_package].filter(Boolean).join(' • ');
};

export const getProductCustomizationSettings = (product) => {
  const settings = product?.custom_fields_data?.customer_customization || {};
  const enabled = Boolean(settings.allow_image_upload || settings.allow_notes);
  return {
    enabled,
    allowImageUpload: Boolean(settings.allow_image_upload),
    allowNotes: settings.allow_notes !== false && enabled,
  };
};

export const getDefaultProductPrice = (product) => {
  const combo = getDefaultManualCombination(product);
  if (combo?.price != null) {
    return Number(combo.price);
  }

  const optionData = product?.custom_fields_data || {};
  const strength = optionData.default_strength || optionData.strength_options?.[0] || null;
  const packageOption = optionData.default_package || optionData.package_options?.[0] || null;
  return optionData.pricing_matrix?.[strength]?.[packageOption] ?? Number(product?.price || 0);
};

export const getDefaultProductInventory = (product) => {
  const combo = getDefaultManualCombination(product);
  if (combo) {
    const quantity = Number(combo.stock_quantity || 0);
    return {
      quantity,
      inStock: Boolean(combo.in_stock) && quantity > 0,
      estimatedRestock: combo.estimated_restock || '',
      allowPreorder: Boolean(combo.allow_preorder),
    };
  }

  const optionData = product?.custom_fields_data || {};
  const strength = optionData.default_strength || optionData.strength_options?.[0] || null;
  const packageOption = optionData.default_package || optionData.package_options?.[0] || null;
  const stockRow = optionData.option_stock?.[strength]?.[packageOption] || null;
  const quantity = stockRow ? Number(stockRow.stock_quantity || 0) : Number(product?.quantity || 0);
  return {
    quantity,
    inStock: stockRow ? Boolean(stockRow.in_stock) && quantity > 0 : Boolean(product?.in_stock),
    estimatedRestock: stockRow?.estimated_restock || '',
    allowPreorder: Boolean(stockRow?.allow_preorder),
  };
};