import React from 'react'
import {createRoot} from 'react-dom/client'
import {HashRouter} from 'react-router-dom'
import './style.css'
import App from './App'
import {DocumentsProvider} from './state/DocumentsContext'

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
    <React.StrictMode>
        <HashRouter>
            <DocumentsProvider>
                <App/>
            </DocumentsProvider>
        </HashRouter>
    </React.StrictMode>
)
