import { Bell, Pill } from "lucide-react"
import { useUser } from "../../context/UserContext";
import { useEffect, useState } from "react";

const DashboardHeader = () => {
    const { appUser, logout } = useUser();
    const [stationName, setStationName] = useState('');

    useEffect(() => {
        setStationName(localStorage.getItem('stationName'));
    }, [stationName]);

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">WSU Pharmacy Management System</h1>

                            </div>
                        </div>

                    </div>
                

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                        <Bell size={20} className="text-gray-600" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    <span className="text-sm text-gray-700">{appUser?.displayName}</span>
                    <span className="text-sm text-gray-700">Station {localStorage.getItem('stationName') || ''}</span>

                    <button
                        onClick={() => logout()}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DashboardHeader;