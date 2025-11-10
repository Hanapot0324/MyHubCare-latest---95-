// web/src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import Login from "./components/Login.jsx";
import PatientRegistration from "./components/Register.jsx";

const socket = io("http://localhost:5000"); // global socket

export default function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("🧠 Connected to Socket.IO:", socket.id);
    });

    socket.on("newNotification", (data) => {
      console.log("📩 Real-time notification:", data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login socket={socket} />} />
        <Route path="/register" element={<PatientRegistration socket={socket} />} />
      </Routes>
    </BrowserRouter>
  );
}
