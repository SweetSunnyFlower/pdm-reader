export function getDocumentId(model) {
    return model?.filePath || `${model?.name || model?.code || 'pdm'}-${Date.now()}`;
}

export function getTableId(table) {
    return table?.id || table?.code || table?.name || '';
}

export function includesText(value, keyword) {
    return String(value || '').toLowerCase().includes(keyword);
}

export function displayName(item) {
    return item?.name || item?.code || item?.id || '-';
}
