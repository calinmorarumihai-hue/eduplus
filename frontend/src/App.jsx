import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importăm toate componentele tale
import Admin from './Admin';
import Dashboard from './Dashboard';
import Evaluation from './Evaluation';
import Home from './Home';
import Leaderboard from './Leaderboard';
import LiveSessions from './LiveSessions';
import Login from './Login';
import Packages from './Packages';
import ParentDashboard from './ParentDashboard';
import PaymentSuccess from './PaymentSuccess';
import Register from './Register';
import Simulation from './Simulation';
import Team from './Team';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/evaluation" element={<Evaluation />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/live-sessions" element={<LiveSessions />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/team" element={<Team />} />
      </Routes>
    </Router>
  );
}

export default App;
