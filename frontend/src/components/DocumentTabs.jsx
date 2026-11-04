import {useMemo, useRef} from 'react';

function DocumentTabs({documents, activeDocumentId, searchMatchesByDocumentId = {}, hasGlobalSearch = false, onActivate, onClose}) {
    const scrollRef = useRef(null);
    const visibleDocuments = useMemo(() => {
        if (!hasGlobalSearch) {
            return documents;
        }

        return documents.filter((document) => (searchMatchesByDocumentId[document.id]?.length || 0) > 0);
    }, [documents, hasGlobalSearch, searchMatchesByDocumentId]);

    if (documents.length === 0) {
        return null;
    }

    function scrollTabs(direction) {
        const scrollElement = scrollRef.current;
        if (!scrollElement) {
            return;
        }

        scrollElement.scrollBy({
            left: direction * Math.max(260, scrollElement.clientWidth * 0.72),
            behavior: 'smooth',
        });
    }

    return (
        <div className="document-tabs-shell soft-card">
            <button className="document-tab-scroll" onClick={() => scrollTabs(-1)} aria-label="向左滚动标签">‹</button>
            <div className="document-tabs" role="tablist" aria-label="已打开的 PDM 文件" ref={scrollRef}>
                {visibleDocuments.map((document) => {
                    const active = document.id === activeDocumentId;
                    const matchCount = searchMatchesByDocumentId[document.id]?.length || 0;
                    const hasMatches = hasGlobalSearch && matchCount > 0;
                    return (
                        <div key={document.id} className={`document-tab-shell ${active ? 'active' : ''}`}>
                            <button
                                className="document-tab-main"
                                role="tab"
                                aria-selected={active}
                                onClick={() => onActivate(document.id)}
                                title={document.model.filePath}
                            >
                                <span className="document-tab-title">{document.model.name || document.model.code || '未命名模型'}</span>
                                {hasMatches && <span className="document-tab-match-dots" aria-label={`匹配 ${matchCount} 张表`}><i/><i/></span>}
                                <span className="document-tab-count">{hasMatches ? `${matchCount} 匹配` : `${document.model.summary?.tableCount || 0} 表`}</span>
                            </button>
                            <button
                                className="document-tab-close"
                                onClick={() => onClose(document.id)}
                                aria-label={`关闭 ${document.model.name || document.model.code || '文档'}`}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
                {visibleDocuments.length === 0 && <div className="document-tabs-empty">没有匹配的 PDM 文件</div>}
            </div>
            <button className="document-tab-scroll" onClick={() => scrollTabs(1)} aria-label="向右滚动标签">›</button>
        </div>
    );
}

export default DocumentTabs;
