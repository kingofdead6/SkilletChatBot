import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/auth/Login"
import Register from "./components/auth/Register"
import Chat from "./components/chat/Chat"
import Settings from "./components/chat/settings";

function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;