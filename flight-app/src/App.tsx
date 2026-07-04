import { Navigate, Route, Routes } from "react-router-dom"
import { RadarShell } from "@/components/shell/RadarShell"
import { FlightPlannerPage } from "@/pages/FlightPlannerPage"

export function App() {
  return (
    <Routes>
      <Route element={<RadarShell />}>
        <Route path="/" element={<FlightPlannerPage />} />
      </Route>
      <Route path="/routes" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
