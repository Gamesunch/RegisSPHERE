import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Enrollment from './pages/Enrollment';
import MyCourses from './pages/MyCourses';
import Grades from './pages/Grades';
import CourseManagement from './pages/CourseManagement';
import StudentManagement from './pages/StudentManagement';
import ProfessorDashboard from './pages/ProfessorDashboard';
import ProfessorCourses from './pages/ProfessorCourses';
import ProfessorClassDetails from './pages/ProfessorClassDetails';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/admin/courses" element={<CourseManagement />} />
          <Route path="/admin/students" element={<StudentManagement />} />
          <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
          <Route path="/professor/courses" element={<ProfessorCourses />} />
          <Route path="/professor/courses/:courseId" element={<ProfessorClassDetails />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
