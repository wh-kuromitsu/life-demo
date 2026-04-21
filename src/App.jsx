import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import RouteOptimize from './pages/RouteOptimize'
import Transport from './pages/Transport'
import Children from './pages/Children'
import Attendance from './pages/Attendance'
import SupportPlan from './pages/SupportPlan'
import Facility from './pages/Facility'
import Equipment from './pages/Equipment'
import HugSync from './pages/HugSync'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import './App.css'

export default function App() {
  const [page, setPage] = useState('route')
  const [facilityId, setFacilityId] = useState('all')

  const props = { facilityId, setFacilityId, setPage }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':     return <Dashboard {...props} />
      case 'route':         return <RouteOptimize {...props} />
      case 'transport':     return <Transport {...props} />
      case 'children':      return <Children {...props} />
      case 'attendance':    return <Attendance {...props} />
      case 'support':       return <SupportPlan {...props} />
      case 'facility':      return <Facility {...props} />
      case 'equipment':     return <Equipment {...props} />
      case 'hug':           return <HugSync {...props} />
      case 'notifications': return <Notifications {...props} />
      case 'settings':      return <Settings {...props} />
      default:              return <Dashboard {...props} />
    }
  }

  return (
    <div className="shell">
      <Sidebar current={page} onNavigate={setPage} facilityId={facilityId} onFacilityChange={setFacilityId} />
      <div className="main">
        <Header facilityId={facilityId} />
        <div className="main-scroll fade-in" key={page}>{renderPage()}</div>
      </div>
    </div>
  )
}
