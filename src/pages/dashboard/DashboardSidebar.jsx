import { BarChart3, ChevronRight, LayoutDashboard, Menu, Package, Settings, TriangleAlert, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";

import '../../index.css';
import '../../App.css';

const DashboardSidebar = ({ menuItems, sidebarOpen, setSidebarOpen }) => {
    const { appUser } = useUser();

    return (
        <div className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'
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
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-emerald-800 text-gray-300 
                ${location.pathname === item.path ? 'bg-emerald-600 text-white' : ''}`}
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
                            <div className="text-xs text-gray-400">{appUser?.displayName || 'Invalid User'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default DashboardSidebar;