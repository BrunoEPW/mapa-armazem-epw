import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeUnifiedSystem } from '@/utils/unifiedMaterialManager'

// Initialize the unified material management system
initializeUnifiedSystem();

createRoot(document.getElementById("root")!).render(<App />);
