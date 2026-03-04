import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div style={{ display: 'flex', flex: 1, paddingTop: '64px' }}>
                <Sidebar />
                <main style={{
                    flex: 1, padding: '24px', marginLeft: '240px',
                    minHeight: 'calc(100vh - 64px)', overflowY: 'auto'
                }}>
                    <Outlet />
                </main>
            </div>
            <style>{`
                @media (max-width: 1023px) {
                    main { margin-left: 0 !important; }
                }
            `}</style>
        </div>
    )
}
