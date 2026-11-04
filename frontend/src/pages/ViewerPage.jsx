import {memo, useCallback, useDeferredValue, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import DocumentTabs from '../components/DocumentTabs';
import PDMCanvas from '../components/PDMCanvas';
import TableDetails from '../components/TableDetails';
import {useDocuments} from '../state/DocumentsContext';
import {displayName, getTableId} from '../utils/pdmView';

function ViewerPage() {
    const [canvasOpen, setCanvasOpen] = useState(true);
    const [globalSearchInput, setGlobalSearchInput] = useState('');
    const {
        documents,
        activeDocument,
        filteredTables,
        selectedTable,
        globalSearch,
        setGlobalSearch,
        searchMatchesByDocumentId,
        loading,
        error,
        openFiles,
        updateActiveDocument,
        selectTable,
        updateDocumentNodePositions,
        activateDocument,
        closeDocument,
    } = useDocuments();

    const selectedTableId = getTableId(selectedTable);
    const deferredSelectedTable = useDeferredValue(selectedTable);
    const handleSelectTable = useCallback((tableId) => {
        selectTable(tableId);
    }, [selectTable]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setGlobalSearch(globalSearchInput);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [globalSearchInput, setGlobalSearch]);

    if (!activeDocument) {
        return (
            <main className="viewer-empty soft-page">
                <section className="viewer-empty-card soft-card">
                    <span className="soft-chip">Viewer is ready</span>
                    <h1>还没有打开 PDM 文件</h1>
                    <p>从首页或这里打开 .pdm 文件后，会进入多 Tab 关系画布。</p>
                    <div className="viewer-empty-actions">
                        <button className="soft-button soft-button-primary" onClick={openFiles} disabled={loading}>
                            {loading ? '正在解析...' : '打开 PDM'}
                        </button>
                        <Link className="soft-button soft-button-secondary" to="/">返回首页</Link>
                    </div>
                    {error && <div className="home-error soft-card-inset">{error}</div>}
                </section>
            </main>
        );
    }

    return (
        <main className="viewer-page soft-page">
            <header className="viewer-toolbar soft-card">
                <Link className="viewer-brand" to="/" aria-label="返回首页">
                    <span className="home-brand-mark small">P</span>
                    <span>
                        <strong>PDM Reader</strong>
                        <em>Relation Canvas</em>
                    </span>
                </Link>
                <button className="soft-button soft-button-primary toolbar-open" onClick={openFiles} disabled={loading}>
                    {loading ? '解析中...' : '继续打开'}
                </button>
                <div className="viewer-path-row">
                    <div className="viewer-path soft-card-inset" title={activeDocument.model.filePath || ''}>
                        {activeDocument.model.filePath || '未命名模型'}
                    </div>
                    <div className="global-search-box">
                        <input
                            className="global-search-input soft-input"
                            value={globalSearchInput}
                            onChange={(event) => setGlobalSearchInput(event.target.value)}
                            placeholder="全局搜索所有 PDM 文件..."
                        />
                        {globalSearchInput && (
                            <button
                                className="global-search-clear"
                                onClick={() => {
                                    setGlobalSearchInput('');
                                    setGlobalSearch('');
                                }}
                                aria-label="清空全局搜索"
                                title="清空"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
                <Summary summary={activeDocument.model.summary}/>
            </header>

            {error && <div className="viewer-error soft-card-inset">{error}</div>}

            <DocumentTabs
                documents={documents}
                activeDocumentId={activeDocument.id}
                searchMatchesByDocumentId={searchMatchesByDocumentId}
                hasGlobalSearch={globalSearch.trim().length > 0}
                onActivate={activateDocument}
                onClose={closeDocument}
            />

            <section className={`graph-workspace ${canvasOpen ? '' : 'canvas-collapsed'}`}>
                <aside className="graph-sidebar soft-card">
                    <input
                        className="search-input soft-input"
                        value={globalSearch || activeDocument.search}
                        onChange={(event) => updateActiveDocument({search: event.target.value})}
                        placeholder={globalSearch ? '正在显示全局搜索结果' : '搜索表名、表 Code、字段...'}
                        disabled={Boolean(globalSearch)}
                    />
                    <div className="sidebar-count">
                        {filteredTables.length} / {activeDocument.model.tables?.length || 0} 张表
                    </div>
                    <div className="table-list">
                        {filteredTables.map((table) => (
                            <TableListItem
                                key={getTableId(table)}
                                table={table}
                                active={selectedTableId === getTableId(table)}
                                onSelect={handleSelectTable}
                            />
                        ))}
                    </div>
                </aside>

                <section className="graph-canvas-wrap">
                    <button
                        className="canvas-toggle soft-button"
                        onClick={() => setCanvasOpen((open) => !open)}
                        aria-label={canvasOpen ? '折叠画布' : '展开画布'}
                        title={canvasOpen ? '折叠画布' : '展开画布'}
                    >
                        {canvasOpen ? '‹' : '›'}
                    </button>
                    {canvasOpen && (
                        <PDMCanvas
                            model={activeDocument.model}
                            selectedTableId={getTableId(selectedTable)}
                            nodePositions={activeDocument.nodePositions || {}}
                            onSelectTable={selectTable}
                            onSaveNodePositions={(nodePositions) => updateDocumentNodePositions(activeDocument.id, nodePositions)}
                        />
                    )}
                </section>

                <aside className="detail-drawer soft-card">
                    <TableDetails table={deferredSelectedTable} warnings={activeDocument.model.warnings || []}/>
                </aside>
            </section>
        </main>
    );
}

const TableListItem = memo(function TableListItem({table, active, onSelect}) {
    const tableId = getTableId(table);

    return (
        <button
            className={`table-item ${active ? 'active' : ''}`}
            onClick={() => onSelect(tableId)}
        >
            <div className="table-item-main">
                <span className="table-name">{displayName(table)}</span>
                <span className="table-count">{table.columns?.length || 0}</span>
            </div>
            <div className="table-code">{table.code}</div>
            <div className="table-badges">
                {(table.primaryKeys?.length || 0) > 0 && <span className="badge pk">PK</span>}
                {(table.foreignKeys?.length || 0) > 0 && <span className="badge fk">FK {table.foreignKeys.length}</span>}
                {(table.indexes?.length || 0) > 0 && <span className="badge index">IDX {table.indexes.length}</span>}
            </div>
        </button>
    );
});

function Summary({summary}) {
    return (
        <div className="summary">
            <span>{summary?.tableCount || 0} 表</span>
            <span>{summary?.columnCount || 0} 字段</span>
            <span>{summary?.referenceCount || 0} 关系</span>
            <span>{summary?.indexCount || 0} 索引</span>
        </div>
    );
}

export default ViewerPage;
