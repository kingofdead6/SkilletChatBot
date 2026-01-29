import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login"
import Register from "./components/Register"
import Chat from "./components/Chat"
import Settings from "./components/settings";

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