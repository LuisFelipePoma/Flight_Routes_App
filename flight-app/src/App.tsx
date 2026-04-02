import { Navigate, Route, Routes } from "react-router-dom"
import { RoutesPage } from "@/pages/RoutesPage"
import { SelectionPage } from "@/pages/SelectionPage"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<SelectionPage />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
