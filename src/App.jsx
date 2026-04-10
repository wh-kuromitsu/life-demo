import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Transport from './pages/Transport'
import RouteOptimize from './pages/RouteOptimize'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import './App.css'

export const FACILITIES = [
  'すべて',
  'にじいろPLUS',
  'にじいろPALETTE',
  'にじいろLABO',
  'NIJIIRONOBA',
  'にじいろPROGRESS',
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [facility, setFacility] = useState('すべて')

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard facility={facility} />
      case 'customers':      return <Customers facility={facility} />
      case 'transport':      return <Transport facility={facility} />
      case 'route':          return <RouteOptimize facility={facility} />
      case 'notifications':  return <Notifications />
      case 'settings':       return <Settings />
      default:               return <Dashboard facility={facility} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        current={page}
        onNavigate={setPage}
        facility={facility}
        onFacilityChange={setFacility}
        facilities={FACILITIES}
      />
      <main className="main-content">{renderPage()}</main>
    </div>
  )
}
