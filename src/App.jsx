import { Routes, Route } from 'react-router-dom'
import Login from '@/modules/auth/components/login/Login'
import FlowBuilder from '@/modules/flow-builder/components/flowBuilder/FlowBuilder'
import ProtectedRoute from '@/components/ProtectedRoute'
import PublicRoute from '@/components/PublicRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />

      <Route path="/flowBuilder" element={
        <ProtectedRoute>
          <FlowBuilder />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App