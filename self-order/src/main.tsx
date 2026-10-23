import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadTranslations } from '@ury/core'

// Strings are translated as they render, so the catalogue must be in place
// before the first one does.
loadTranslations().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
