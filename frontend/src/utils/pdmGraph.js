import {MarkerType} from '@xyflow/react';

const NODE_WIDTH = 380;
const X_GAP = 460;
const ROW_GAP = 120;
const COLUMNS_PER_ROW = 10;
const NODE_CHROME_HEIGHT = 152;
const COLUMN_ROW_HEIGHT = 50;

export function buildGraph(model, selectedTableId, nodePositions = {}) {
    const tables = model?.tables || [];
    const validNodeIds = new Set(tables.map(getTableNodeId));
    const rowHeights = getRowHeights(tables);

    const nodes = tables.map((table, index) => {
        const rowIndex = Math.floor(index / COLUMNS_PER_ROW);
        const columnIndex = index % COLUMNS_PER_ROW;
        const id = getTableNodeId(table);
        const fallbackPosition = {
            x: columnIndex * X_GAP,
            y: getRowOffset(rowHeights, rowIndex),
        };

        return {
            id,
            type: 'tableNode',
            position: nodePositions[id] || fallbackPosition,
            data: {
                table,
                selected: id === selectedTableId || table.id === selectedTableId,
            },
            style: {width: NODE_WIDTH},
        };
    });

    const edges = [];
    tables.forEach((table) => {
        const childId = getTableNodeId(table);
        (table.foreignKeys || []).forEach((foreignKey, index) => {
            const source = foreignKey.childTableId || childId;
            const target = foreignKey.parentTableId;
            if (!source || !target || !validNodeIds.has(source) || !validNodeIds.has(target)) {
                return;
            }

            edges.push({
                id: foreignKey.id || `${source}-${target}-${index}`,
                source,
                target,
                label: foreignKey.code || foreignKey.name || 'FK',
                type: 'smoothstep',
                animated: false,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 18,
                    height: 18,
                },
                data: {
                    foreignKey,
                    joins: foreignKey.joins || [],
                },
                style: {
                    stroke: '#6C63FF',
                    strokeWidth: 2.5,
                },
                labelStyle: {
                    fill: '#3D4852',
                    fontWeight: 800,
                    fontSize: 12,
                },
                labelBgStyle: {
                    fill: '#E0E5EC',
                    fillOpacity: 0.92,
                },
            });
        });
    });

    return {nodes, edges};
}

export function getTableNodeId(table) {
    return table?.id || table?.code || table?.name;
}

function getRowHeights(tables) {
    const rowCount = Math.ceil(tables.length / COLUMNS_PER_ROW);
    return Array.from({length: rowCount}, (_, rowIndex) => {
        const rowTables = tables.slice(rowIndex * COLUMNS_PER_ROW, (rowIndex + 1) * COLUMNS_PER_ROW);
        const maxColumns = Math.max(0, ...rowTables.map((table) => table.columns?.length || 0));
        return NODE_CHROME_HEIGHT + maxColumns * COLUMN_ROW_HEIGHT;
    });
}

function getRowOffset(rowHeights, rowIndex) {
    return rowHeights.slice(0, rowIndex).reduce((offset, rowHeight) => offset + rowHeight + ROW_GAP, 0);
}
