import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyAppointments from './pages/MyAppointments';
import BookAppointment from './pages/BookAppointment';
import HealthRecords from './pages/HealthRecords';
import BookLabTest from './pages/BookLabTest';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (Only accessible when logged out) */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Routes (Only accessible when logged in, with shared Layout) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/book-opd-consultation" element={<BookAppointment />} />
            <Route path="/booking" element={<BookAppointment />} />
            <Route path="/book-lab-test" element={<BookLabTest />} />
            {/* <Route path="/book-lab" element={<BookLabTest />} /> */}
            {/* <Route path="/lab-booking" element={<BookLabTest />} /> */}
            <Route path="/appointments" element={<MyAppointments />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/health-records" element={<HealthRecords />} />
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
