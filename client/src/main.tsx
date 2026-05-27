import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './i18n'
import './stores/themeStore'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, retry: 1 } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } }} />
    </QueryClientProvider>
  </React.StrictMode>
)
