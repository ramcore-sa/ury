import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@ury/ui'
import { loadTranslations } from '@ury/core'
import './index.css'
import App from './App.tsx'

// Strings are translated as they render, so the catalogue must be in place
// before the first one does.
loadTranslations().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter basename="/ury">
        <App />
        <ToastProvider />
      </BrowserRouter>
    </StrictMode>,
  )
})
