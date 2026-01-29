import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState ,useRef } from "react";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Chat from "./components/chat/Chat";
import Settings from "./components/chat/settings";
import { App as CapApp } from "@capacitor/app";
import { Dialog } from '@capacitor/dialog';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (on app start / refresh)
    const storedEmail = sessionStorage.getItem('email') || localStorage.getItem('email');
    
    if (storedEmail) {
      setIsAuthenticated(true);
    }
    
    setCheckingAuth(false);
  }, []);



  // Show loading spinner while checking auth (prevents flash)
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-blue-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const historyRef = useRef([]);

  useEffect(() => {
    historyRef.current.push(location.pathname);
  }, [location]);

  useEffect(() => {
    const handler = CapApp.addListener("backButton", async () => {
      const currentPath = location.pathname;

      if (historyRef.current.length > 1) {
        historyRef.current.pop(); 
        const previousPath = historyRef.current[historyRef.current.length - 1];
        navigate(previousPath);
        return;
      }

      const { value } = await Dialog.confirm({
        title: "Exit App",
        message: "Are you sure you want to exit the app?",
        okButtonTitle: "Yes",
        cancelButtonTitle: "No",
      });

      if (value) {
        CapApp.exitApp();
      }
    });

    return () => {
      handler.remove();
    };
  }, [navigate, location]);

  return null;
}

  return (
    <Router>
       <BackButtonHandler />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />}/>    
        <Route path="/settings" element={<Settings/> } />

        {/* Catch-all - redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;