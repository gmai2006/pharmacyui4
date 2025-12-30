// components/StationInfo.js
import React, { useState, useEffect } from 'react';
import DeviceFingerprintService from '../utils/fingerprinting';
import init from "../init";

const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};
const selectUrl = `/${init.appName}/api/devicefingerprints/selectAll`;
const deviceUrl = `/${init.appName}/api/devicefingerprints/`;


const StationInfo = ({ token, setStationId }) => {
    const [department, setDepartment] = useState('Pharmacy');
    const [location, setLocation] = useState('Main Counter');
    const [error, setError] = useState(null);

    useEffect(() => {
        initializeStation(token);
    }, []);

    const getDevices = async (token) => {
        try {
            const response = await fetch(selectUrl, {
                headers: headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "Authorization": `Bearer ${token}`,
                }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('Failed to load users', 'error');
        } finally {

        }
    };

    const initializeStation = async (token) => {
        try {

            // Check localStorage first
            const savedStationId = localStorage.getItem('stationId');
            const savedTimestamp = localStorage.getItem('stationTimestamp');
            const devices = await getDevices(token);

            if (savedStationId && savedTimestamp) {
                // Verify station is still valid
                const exists = devices.find(device => device.id === savedStationId);
                if (exists) {
                    setStationId(savedStationId);
                    return;
                }
            }

            // Generate device fingerprint
            const fingerprint = await DeviceFingerprintService.generateFingerprint();
            const fingerprintHash = await DeviceFingerprintService.createFingerprintHash(fingerprint);
            const existingDevice = devices.find(device => device.fingerprintHash === fingerprintHash);
            if (existingDevice) {
                setStationId(`RX00-${existingDevice.stationId}`);
                localStorage.setItem('stationId', `RX00-${existingDevice.stationId}`);
                localStorage.setItem('stationTimestamp', new Date().toISOString());
                localStorage.setItem('fingerprintHash', JSON.stringify(fingerprintHash));
                return;
            }

            //not found => register a new station
            const newStation = await registerDevice(token, {
                fingerprintHash: fingerprintHash,
                department,
                location,
                browserUserAgent: navigator.userAgent,
                screenResolution: DeviceFingerprintService.getScreenResolution(),
                timezone: DeviceFingerprintService.getTimezone(),
                accessCount: 1
            });
            setStationId(`RX00-${newStation.stationId}`);
            // Store in localStorage for quick access
            localStorage.setItem('stationId', newStation.id);
            localStorage.setItem('stationTimestamp', new Date().toISOString());
            localStorage.setItem('deviceFingerprint', JSON.stringify(fingerprintHash));

        } catch (err) {
            console.error('Station initialization error:', err);
            setError(err.response?.data?.error || 'Failed to initialize station');
        } finally {

        }
    };

    // Handle add a new station
    const registerDevice = async (token, data) => {
        try {
            const response = await fetch(deviceUrl, {
                method: 'PUT',
                headers: headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...data,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to register new station');
            }

            return await response.json();

        } catch (error) {
            console.error('Error registering a station:', error);
        } finally {
        }
    };

    if (error) {
        return (
            <span className="text-sm text-gray-700">Cannot Register a new station</span>
        );
    }

    return
    { };

};

export default StationInfo;