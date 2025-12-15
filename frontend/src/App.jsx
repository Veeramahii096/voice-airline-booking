import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import VoiceDemo from './pages/VoiceDemo';
import VoiceBooking from './pages/VoiceBooking';
import AIVoiceBooking from './pages/AIVoiceBooking';
import PassengerInfo from './pages/PassengerInfo';
import SeatSelection from './pages/SeatSelection';
import SpecialAssistance from './pages/SpecialAssistance';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app" role="application">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/demo" element={<VoiceDemo />} />
          <Route path="/voice-booking" element={<AIVoiceBooking />} />
          <Route path="/voice-booking-old" element={<VoiceBooking />} />
          <Route path="/passenger-info" element={<PassengerInfo />} />
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/special-assistance" element={<SpecialAssistance />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
