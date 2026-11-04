import {createContext, useContext, useMemo, useState} from 'react';
import {ChoosePDMFiles} from '../../wailsjs/go/main/App';
import {getDocumentId, getTableId, includesText} from '../utils/pdmView';

const DocumentsContext = createContext(null);

export function DocumentsProvider({children}) {
    const [documents, setDocuments] = useState([]);
    const [activeDocumentId, setActiveDocumentId] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const activeDocument = useMemo(() => {
        return documents.find((document) => document.id === activeDocumentId) || documents[0] || null;
    }, [documents, activeDocumentId]);

    const searchMatchesByDocumentId = useMemo(() => {
        const keyword = globalSearch.trim().toLowerCase();
        if (!keyword) {
            return {};
        }

        return Object.fromEntries(documents.map((document) => [
            document.id,
            (document.model?.tables || []).filter((table) => matchesTable(table, keyword)),
        ]));
    }, [documents, globalSearch]);

    const filteredTables = useMemo(() => {
        const tables = activeDocument?.model?.tables || [];
        const globalKeyword = globalSearch.trim().toLowerCase();
        const localKeyword = activeDocument?.search?.trim().toLowerCase() || '';
        const keyword = globalKeyword || localKeyword;
        if (!keyword) {
            return tables;
        }

        return tables.filter((table) => matchesTable(table, keyword));
    }, [activeDocument, globalSearch]);

    const selectedTable = useMemo(() => {
        const tables = activeDocument?.model?.tables || [];
        return tables.find((table) => getTableId(table) === activeDocument?.selectedTableId)
            || filteredTables[0]
            || tables[0]
            || null;
    }, [activeDocument, filteredTables]);

    async function openFiles() {
        setLoading(true);
        setError('');
        try {
            const models = await ChoosePDMFiles();
            if (!models?.length) {
                return false;
            }

            let nextActiveId = '';
            const nextDocuments = [...documents];

            models.forEach((model) => {
                const documentId = getDocumentId(model);
                const existing = nextDocuments.find((document) => document.id === documentId);
                if (existing) {
                    nextActiveId = existing.id;
                    return;
                }

                nextDocuments.push({
                    id: documentId,
                    model,
                    selectedTableId: getTableId(model.tables?.[0]) || '',
                    search: '',
                    nodePositions: {},
                });
                nextActiveId = documentId;
            });

            setDocuments(nextDocuments);
            if (nextActiveId) {
                setActiveDocumentId(nextActiveId);
            }
            return true;
        } catch (err) {
            const message = err?.message || String(err);
            if (message !== '已取消选择文件') {
                setError(message);
            }
            return false;
        } finally {
            setLoading(false);
        }
    }

    function updateActiveDocument(patch) {
        if (!activeDocument) {
            return;
        }
        setDocuments((currentDocuments) => currentDocuments.map((document) => (
            document.id === activeDocument.id ? {...document, ...patch} : document
        )));
    }

    function selectTable(tableId) {
        updateActiveDocument({selectedTableId: tableId});
    }

    function updateDocumentNodePositions(documentId, nodePositions) {
        setDocuments((currentDocuments) => currentDocuments.map((document) => (
            document.id === documentId ? {...document, nodePositions} : document
        )));
    }

    function activateDocument(documentId) {
        setActiveDocumentId(documentId);
    }

    function closeDocument(documentId) {
        setDocuments((currentDocuments) => {
            const index = currentDocuments.findIndex((document) => document.id === documentId);
            const nextDocuments = currentDocuments.filter((document) => document.id !== documentId);
            if (documentId === activeDocumentId) {
                const nextActiveDocument = nextDocuments[index] || nextDocuments[index - 1] || nextDocuments[0];
                setActiveDocumentId(nextActiveDocument?.id || '');
            }
            return nextDocuments;
        });
    }

    const value = {
        documents,
        activeDocumentId,
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
        clearError: () => setError(''),
    };

    return (
        <DocumentsContext.Provider value={value}>
            {children}
        </DocumentsContext.Provider>
    );
}

function matchesTable(table, keyword) {
    return includesText(table.name, keyword)
        || includesText(table.code, keyword)
        || includesText(table.comment, keyword)
        || (table.columns || []).some((column) => (
            includesText(column.name, keyword)
            || includesText(column.code, keyword)
            || includesText(column.comment, keyword)
            || includesText(column.dataType, keyword)
        ));
}

export function useDocuments() {
    const context = useContext(DocumentsContext);
    if (!context) {
        throw new Error('useDocuments must be used within DocumentsProvider');
    }
    return context;
}
