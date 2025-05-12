import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import config from './config';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AttendanceManage from './pages/admin/AttendanceManage';
import MarksManage from './pages/admin/MarksManage';
import QuizzesManage from './pages/admin/QuizzesManage';
import ReportsManage from './pages/admin/ReportsManage';
import NotificationsManage from './pages/admin/NotificationsManage';
import AdminStudentRequests from './pages/admin/StudentRequests';

import AdminLayout from './layouts/AdminLayout';
import Subjects from './pages/admin/Subjects';
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentAttendance from './pages/student/Attendance';
import StudentMarks from './pages/student/Marks';
import StudentQuizzes from './pages/student/Quizzes';
import StudentReports from './pages/student/Reports';
import StudentNotifications from './pages/student/Notifications';
import StudentLayout from './layouts/StudentLayout';
import StudentSubjects from './pages/student/Subjects'; // Assuming this component exists

import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RegistrationStatus from './pages/RegistrationStatus';

function App() {
  React.useEffect(() => {
    // Use config so it's not unused
    // eslint-disable-next-line no-console
    console.log('API Base URL:', config.API_BASE_URL);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toast />
        <Navbar apiBaseUrl={config.API_BASE_URL} />
        <div className="pt-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registration-status" element={<RegistrationStatus />} />

            <Route path="/admin" element={<ProtectedRoute roles={["admin"]}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute roles={["admin"]}>
              <AdminLayout><AdminStudents /></AdminLayout>
            </ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute roles={["admin"]}>
              <AdminLayout><AttendanceManage /></AdminLayout>
            </ProtectedRoute>} />
            <Route path="/admin/marks" element={<ProtectedRoute roles={["admin"]}>
              <AdminLayout><MarksManage /></AdminLayout>
            </ProtectedRoute>} />
            <Route path="/admin/quizzes" element={<ProtectedRoute roles={["admin"]}>
              <AdminLayout><QuizzesManage /></AdminLayout>
            </ProtectedRoute>} />
            <Route path="/admin/subjects" element={<ProtectedRoute roles={["admin"]}>
              <AdminLayout><Subjects /></AdminLayout>
            </ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={["admin"]}>
              <AdminLayout><ReportsManage /></AdminLayout>
            </ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute roles={["admin"]}>
              <AdminLayout><NotificationsManage /></AdminLayout>
            </ProtectedRoute>} />
            <Route path="/admin/StudentRequests" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminStudentRequests /></AdminLayout></ProtectedRoute>} />

            <Route path="/student" element={<ProtectedRoute roles={["student"]}>
              <StudentLayout><StudentDashboard /></StudentLayout>
            </ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute roles={["student"]}>
              <StudentLayout><StudentProfile /></StudentLayout>
            </ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute roles={["student"]}>
              <StudentLayout><StudentAttendance /></StudentLayout>
            </ProtectedRoute>} />
            <Route path="/student/marks" element={<ProtectedRoute roles={["student"]}>
              <StudentLayout><StudentMarks /></StudentLayout>
            </ProtectedRoute>} />
            <Route path="/student/quizzes" element={<ProtectedRoute roles={["student"]}>
              <StudentLayout><StudentQuizzes /></StudentLayout>
            </ProtectedRoute>} />
            <Route path="/student/reports" element={<ProtectedRoute roles={["student"]}>
              <StudentLayout><StudentReports /></StudentLayout>
            </ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute roles={["student"]}>
              <StudentLayout><StudentNotifications /></StudentLayout>
            </ProtectedRoute>} />
            <Route path="/student/subjects" element={<ProtectedRoute roles={["student"]}>
              <StudentLayout><StudentSubjects /></StudentLayout>
            </ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
