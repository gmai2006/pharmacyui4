import {
  LayoutDashboard, Users, Package, BarChart3, Settings,
  Bell, Search, Menu, X, ChevronRight,
  Eye,
  TriangleAlert,
} from 'lucide-react';

 const menuItems = [
    { id: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'inventory', path: '/inventory', icon: Users, label: 'Inventory' },
    { id: 'users', path: '/users', icon: Users, label: 'Users' },
    { id: 'patients', path: '/patients', icon: Users, label: 'Patients' },
    // { id: 'review', path: '/review', icon: Eye, label: 'Review' },
    // { id: 'pos', path: '/pos', icon: Package, label: 'POS' },
    { id: 'pickup', path: '/pickup', icon: TriangleAlert, label: 'Pickup' },
    { id: 'alert', path: '/alert', icon: TriangleAlert, label: 'Alert' },
    { id: 'analytics', path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'logs', path: '/logs', icon: TriangleAlert, label: 'Auth Logs' },
    { id: 'systemlogs', path: '/systemlogs', icon: TriangleAlert, label: 'Auth Dashboard' },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const Link = ({ to, children, className, activeClassName, isActive }) => (
  <a
    href={`#${to}`}
    className={`${className} ${isActive ? activeClassName : ''}`}
    onClick={(e) => {
      e.preventDefault();
      window.location.hash = to;
    }}
  >
    {children}
  </a>
);

const Sidebar = ({sidebarOpen, setSidebarOpen,appUser}) => {
    return (
        <div
            className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'
                }`}
        >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                {sidebarOpen ? (
                    <>
                        <h1 className="text-xl font-bold">AdminPanel</h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1 hover:bg-gray-800 rounded transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1 hover:bg-gray-800 rounded transition-colors mx-auto"
                    >
                        <Menu size={20} />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map(item => (
                    <Link
                        key={item.id}
                        to={item.path}
                        isActive={location.pathname === item.path}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-gray-800 text-gray-300"
                        activeClassName="bg-blue-600 text-white"
                    >
                        <item.icon size={20} />
                        {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        {sidebarOpen && location.pathname === item.path && (
                            <ChevronRight size={16} className="ml-auto" />
                        )}
                    </Link>
                ))}
            </nav>

            {sidebarOpen && (
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="font-semibold">AD</span>
                        </div>
                        <div className="flex-1">
                            {/* <div className="text-sm font-medium">Admin User</div> */}
                            <div className="text-xs text-gray-400">{appUser?.displayName || 'Invalid User'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default Sidebar;