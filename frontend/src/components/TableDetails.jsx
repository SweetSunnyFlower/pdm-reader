import {memo} from 'react';

function TableDetails({table, warnings}) {
    if (!table) {
        return <div className="empty-state">请选择一张表查看详情。</div>;
    }

    return (
        <div className="table-detail compact">
            <div className="detail-header compact">
                <div>
                    <h1>{displayName(table)}</h1>
                    <div className="detail-code">{table.code}</div>
                </div>
                <div className="detail-stats">
                    <span>{table.columns?.length || 0} 字段</span>
                    <span>{table.primaryKeys?.length || 0} PK</span>
                    <span>{table.foreignKeys?.length || 0} FK</span>
                    <span>{table.indexes?.length || 0} IDX</span>
                </div>
            </div>

            {table.comment && <p className="comment-block">{table.comment}</p>}

            <section className="section-card">
                <div className="section-title">字段</div>
                <div className="table-scroll">
                    <table className="columns-table compact">
                        <thead>
                        <tr>
                            <th>标记</th>
                            <th>字段</th>
                            <th>Code</th>
                            <th>类型</th>
                            <th>必填</th>
                        </tr>
                        </thead>
                        <tbody>
                        {(table.columns || []).map((column) => (
                            <tr key={column.id || column.code || column.name} title={column.comment || ''}>
                                <td>
                                    <div className="mark-list">
                                        {column.isPrimaryKey && <span className="badge pk">PK</span>}
                                        {column.isForeignKey && <span className="badge fk">FK</span>}
                                    </div>
                                </td>
                                <td>{column.name}</td>
                                <td className="mono">{column.code}</td>
                                <td>{formatType(column)}</td>
                                <td>{column.mandatory ? '是' : '否'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <RelationSection table={table}/>
            <IndexSection table={table}/>
            <Warnings warnings={warnings || []}/>
        </div>
    );
}

function RelationSection({table}) {
    const foreignKeys = table.foreignKeys || [];
    if (foreignKeys.length === 0) {
        return null;
    }

    return (
        <section className="section-card">
            <div className="section-title">外键关系</div>
            <div className="relation-list">
                {foreignKeys.map((fk) => (
                    <div className="relation-card" key={fk.id || fk.code || fk.name}>
                        <div className="relation-title">{displayName(fk)}</div>
                        <div className="relation-meta">
                            {fk.childTable || table.code} → {fk.parentTable || fk.parentTableId || '未知父表'}
                        </div>
                        {(fk.joins || []).map((join, index) => (
                            <div className="join-row" key={`${fk.id}-${index}`}>
                                <span>{join.childColumn || join.childColumnId || '-'}</span>
                                <span>→</span>
                                <span>{join.parentColumn || join.parentColumnId || '-'}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
}

function IndexSection({table}) {
    const indexes = table.indexes || [];
    if (indexes.length === 0) {
        return null;
    }

    return (
        <section className="section-card">
            <div className="section-title">索引</div>
            <div className="index-list">
                {indexes.map((index) => (
                    <div className="index-card" key={index.id || index.code || index.name}>
                        <div className="index-title">
                            {displayName(index)}
                            {index.unique && <span className="badge unique">UNIQUE</span>}
                        </div>
                        <div className="index-columns">{(index.columns || []).join(', ') || '未解析到字段'}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function Warnings({warnings}) {
    if (!warnings.length) {
        return null;
    }

    return (
        <section className="section-card warning-card">
            <div className="section-title">解析提示</div>
            <ul>
                {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
            </ul>
        </section>
    );
}

function displayName(item) {
    return item?.name || item?.code || item?.id || '-';
}

function formatType(column) {
    const size = column.precision && column.scale
        ? `${column.precision}, ${column.scale}`
        : column.length || column.precision || '';
    return size ? `${column.dataType || '-'} (${size})` : column.dataType || '-';
}

export default memo(TableDetails);
