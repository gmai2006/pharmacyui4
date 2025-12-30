import React, { useEffect, useRef, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation
} from "react-router-dom";

import {
  LayoutDashboard,
  TriangleAlert,
  Computer,
  ShieldAlert,
  User,
  Lock,
  Phone
} from 'lucide-react';
import axios from "axios";

import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useUser } from "../../context/UserContext";

import '../../index.css';
import '../../App.css';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

import DeviceFingerprintPage from '../devices/DeviceFingerprintPage';
import UserPage from '../users/UserPage';
import StationPage from '../stations/StationPage';
import PrescriberPage from '../prescribers/PrescriberPage';
import AuthLogPage from '../authlogs/AuthLogPage';
import InsuranceCompanyWithPlansPage from '../insurances/InsuranceCompanyWithPlansPage';
import PatientInsurancePage from '../patients/PatientInsurancePage';

import PrescriptionListPage from '../prescriptions/PrescriptionListPage';
import PrescriptionDetailPage from '../prescriptions/PrescriptionDetailPage';
import WorkflowQueuePage from '../prescriptions/WorkflowQueuePage';
import FillQueuePage from '../prescriptions/FillQueuePage';
import PrescriptionDashboard from '../prescriptions2/PrescriptionDashboard';
import RolePage from '../roles/RolePage';
import ClaimsDashboard from '../claims/ClaimsDashboard.jsx';
import FaxJobPage from '../fax/FaxJobPage.jsx';

import init from "../../init";
import DeviceFingerprintService from '../../utils/fingerprinting';

const baseUrl = `/${init.appName}/api/device-fingerprints`;

export default function Dashboard() {
  const { appUser, token } = useUser();
  const [stationName, setStationName] = useState(`Not Found`);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState('');
  const wsRef = useRef(null);

  const location = useLocation();

  const getStations = async () => {
    const response = await axios.get(`/${init.appName}/api/stations?page=0&size=200`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })
    return response.data.content;
  }

  const getDevices = async () => {
    try {
      const response = await axios
        .get(`${baseUrl}?page=0&size=200`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

      return await response.data.content;
    } catch (error) {
      console.error('Error fetching data:', error);
      // showNotification('Failed to load devices', 'error');
    } finally {

    }
  };

  // Handle add a new station
  // const registerDevice = async (data) => {
  //   try {
  //     const response = await fetch(deviceUrl, {
  //       method: 'PUT',
  //       headers: headers,
  //       body: JSON.stringify({
  //         ...data,
  //       })
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Failed to register new station');
  //     }

  //     return await response.json();

  //   } catch (error) {
  //     console.error('Error registering a station:', error);
  //   } finally {
  //   }
  // };


  const initializeStation = async () => {
    try {

      // Check localStorage first
      const savedStationId = localStorage.getItem('stationId');
      const savedStationName = localStorage.getItem('stationName');
      const savedTimestamp = localStorage.getItem('stationTimestamp');
      const devices = await getDevices();

      if (savedStationId && savedTimestamp) {
        // Verify station is still valid
        const exists = devices.find(device => device.id === savedStationId);
        if (exists) {
          setStationName(savedStationName);
          // updateLastSeen(savedStationId);
          // onStationReady(savedStationId);
          return;
        }
      }

      const stations = await getStations();

      // Generate device fingerprint
      const fingerprint = await DeviceFingerprintService.generateFingerprint();
      const fingerprintHash = await DeviceFingerprintService.createFingerprintHash(fingerprint);
      const existingDevice = devices.find(device => device.fingerprintHash === fingerprintHash);

      if (existingDevice) {
        const station = stations.find(s => s.id == existingDevice.stationId);
        const localStationName = station.stationPrefix + station.id;
        setStationName(localStationName);
        localStorage.setItem('stationId', existingDevice.id);
        localStorage.setItem('stationName', localStationName);
        localStorage.setItem('stationTimestamp', new Date().toISOString());
        localStorage.setItem('fingerprintHash', JSON.stringify(fingerprintHash));
      }

      //not found => admin will need to resgister a new device
      // const newStation = await registerDevice({
      //   fingerprintHash: fingerprintHash,
      //   department: department,
      //   location: location,
      //   browserUserAgent: navigator.userAgent,
      //   screenResolution: DeviceFingerprintService.getScreenResolution(),
      //   timezone: DeviceFingerprintService.getTimezone(),
      //   accessCount: 1
      // });

      // const station = stations.find(s => s.id == newStation.stationId);
      // const localStationName = station.stationPrefix + station.id;
      // setStationName(localStationName);

      // // Store in localStorage for quick access
      // localStorage.setItem('stationId', newStation.id);
      // localStorage.setItem('stationName', localStationName);
      // localStorage.setItem('stationTimestamp', new Date().toISOString());
      // localStorage.setItem('deviceFingerprint', JSON.stringify(fingerprintHash));

    } catch (err) {
      console.error('Station initialization error:', err);
    } finally {

    }
  };

  useEffect(() => {
    if (!appUser) return;
    initializeStation();
  }, [appUser]);

  const menuItems = [
    { id: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Dashboard', perm: [''] },
    { id: 'prescriber', path: '/prescriber', icon: TriangleAlert, label: 'Prescriber', perm: [] },
    { id: 'insurances', path: '/insurances', icon: TriangleAlert, label: 'Insurances', perm: [] },
    { id: 'patients', path: '/patients', icon: TriangleAlert, label: 'Patients', perm: [] },
    { id: 'authlogs', path: '/authlogs', icon: TriangleAlert, label: 'AuthLogs', perm: [] },
    { id: 'claims', path: '/claims', icon: ShieldAlert, label: 'Claims', perm: [] },
    { id: 'roles', path: '/roles', icon: Lock, label: 'Roles', perm: [] },
    { id: 'users', path: '/users', icon: User, label: 'Users', perm: [] },
    { id: 'faxes', path: '/faxes', icon: Phone, label: 'Faxes', perm: [] },
    { id: 'stations', path: '/stations', icon: Computer, label: 'Stations', perm: [] },
    { id: 'devices', path: '/devices', icon: Computer, label: 'devices', perm: [] },
  ];


  if (!appUser) {
    return <LoadingSpinner />
  }


  return (
    <div className="flex h-screen bg-gray-50">

      <DashboardSidebar menuItems={menuItems} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <DashboardHeader stationName={stationName} />

        {/* Routes */}
        <div className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<PrescriptionDashboard />} />

            <Route path="/prescriber" element={<PrescriberPage />} />
            <Route path="/insurances" element={<InsuranceCompanyWithPlansPage />} />
            <Route path="/patients" element={<PatientInsurancePage />} />
            <Route path="/prescriptions/:id" element={<PrescriptionDetailPage />} />
            <Route path="/claims" element={<ClaimsDashboard />} />
            <Route path="/roles" element={<RolePage />} />
            <Route path="/authlogs" element={<AuthLogPage />} />
            <Route path="/users" element={<UserPage />} />
            <Route path="/faxes" element={<FaxJobPage />} />
            <Route path="/stations" element={<StationPage />} />
            <Route path="/devices" element={<DeviceFingerprintPage />} />
          </Routes>
        </div>

      </div>
    </div>
  );
}
