import {memo} from 'react';
import {Handle, Position} from '@xyflow/react';

function TableNode({data}) {
    const table = data.table;
    const columns = table.columns || [];
    const visibleColumns = columns;
    const hiddenCount = 0;

    return (
        <div className={`table-node ${data.selected ? 'selected' : ''}`}>
            <Handle type="target" position={Position.Left} className="node-handle"/>
            <div className="table-node-header">
                <div className="table-node-title" title={table.name || table.code}>{table.name || table.code}</div>
                <div className="table-node-code" title={table.code}>{table.code}</div>
            </div>
            <div className="table-node-meta">
                <span>{columns.length} 字段</span>
                {(table.foreignKeys?.length || 0) > 0 && <span>{table.foreignKeys.length} 外键</span>}
                {(table.indexes?.length || 0) > 0 && <span>{table.indexes.length} 索引</span>}
            </div>
            <div className="table-node-columns">
                {visibleColumns.map((column) => (
                    <div className="table-node-column" key={column.id || column.code || column.name}>
                        <div className="column-name" title={column.name || column.code}>{column.name || column.code}</div>
                        <div className="column-tags">
                            {column.isPrimaryKey && <span className="node-badge pk">PK</span>}
                            {column.isForeignKey && <span className="node-badge fk">FK</span>}
                            <span className="column-type">{column.dataType || '-'}</span>
                        </div>
                    </div>
                ))}
                {hiddenCount > 0 && <div className="table-node-more">+{hiddenCount} more</div>}
            </div>
            <Handle type="source" position={Position.Right} className="node-handle"/>
        </div>
    );
}

export default memo(TableNode);
