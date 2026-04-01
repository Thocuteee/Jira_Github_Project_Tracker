import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
// import Login from './pages/Login'; // Khi nào bạn làm trang Login thì mở ra

function App() {
  return (
    <Router>
      <Routes>
        {/* Nếu vào path "/" thì hiện Dashboard */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Ví dụ trang login sau này */}
        {/* <Route path="/login" element={<Login />} /> */}

        {/* Nếu vào đường dẫn linh tinh thì quay về Dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;