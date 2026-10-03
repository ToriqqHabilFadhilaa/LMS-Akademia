import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Shared/LoginPage";

import DashboardPage from "./pages/Shared/DashboardPage";
import StudentDashboardPage from "./pages/Student/StudentDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentCourseDetailPage from "./pages/Student/StudentCourseDetailPage";
import StudentAssignmentDetailPage from "./pages/Student/StudentAssignmentDetailPage";
import StudentExamDetailPage from "./pages/Student/StudentExamDetailPage";
import StudentExamAttemptPage from "./pages/Student/StudentExamAttemptPage";
import StudentExamResultPage from "./pages/Student/StudentExamResultPage";
import StudentProfilePage from "./pages/Student/StudentProfilePage";
import StudentProctoringPage from "./pages/Student/StudentProctoringPage";
import StudentExamHistoryPage from "./pages/Student/StudentExamHistoryPage";
import StudentResultsPage from "./pages/Student/StudentResultsPage";

import AdminLayout from "./components/AdminLayout";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminUserManagementPage from "./pages/Admin/AdminUserManagementPage";
import AdminCoursePage from "./pages/Admin/AdminCoursePage";
import AdminCourseOfferingPage from "./pages/Admin/AdminCourseOfferingPage";
import AdminExamPage from "./pages/Admin/AdminExamPage";
import QuestionBankPage from "./pages/Shared/QuestionBankPage";
import AdminExamMonitoringPage from "./pages/Admin/AdminExamMonitoringPage";
import AdminExamMonitoringDetailPage from "./pages/Admin/AdminExamMonitoringDetailPage";
import AdminReportsPage from "./pages/Admin/AdminReportsPage";

import LecturerLayout from "./components/LecturerLayout";
import LecturerDashboardPage from "./pages/Lecturer/LecturerDashboardPage";
import LecturerCoursesPage from "./pages/Lecturer/LecturerCoursesPage";
import LecturerCourseDetailPage from "./pages/Lecturer/LecturerCourseDetailPage";
import LecturerStudentsPage from "./pages/Lecturer/LecturerStudentsPage";
import LecturerExamPage from "./pages/Lecturer/LecturerExamPage";
import LecturerExamMonitoringPage from "./pages/Lecturer/LecturerExamMonitoringPage";
import LecturerExamMonitoringDetailPage from "./pages/Lecturer/LecturerExamMonitoringDetailPage";
import LecturerGradingPage from "./pages/Lecturer/LecturerGradingPage";
import LecturerResultsPage from "./pages/Lecturer/LecturerResultsPage";
import LecturerReportsPage from "./pages/Lecturer/LecturerReportsPage";

import "./App.css";

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
                <Route path="/student" element={<StudentDashboardPage />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />
                <Route path="/student/proctoring" element={<StudentProctoringPage />} />
                <Route path="/student/history" element={<StudentExamHistoryPage />} />
                <Route path="/student/results" element={<StudentResultsPage />} />
                <Route path="/student/courses/:id" element={<StudentCourseDetailPage />} />
                <Route path="/student/assignments/:id" element={<StudentAssignmentDetailPage />} />
                <Route path="/student/exams/:id" element={<StudentExamDetailPage />} />
                <Route path="/student/exams/attempt/:attemptId" element={<StudentExamAttemptPage />} />
                <Route path="/student/exams/result/:attemptId" element={<StudentExamResultPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["LECTURER"]} />}>
                <Route element={<LecturerLayout />}>
                    <Route path="/lecturer" element={<LecturerDashboardPage />} />
                    <Route path="/lecturer/courses" element={<LecturerCoursesPage />} />
                    <Route path="/lecturer/courses/:id" element={<LecturerCourseDetailPage />} />
                    <Route path="/lecturer/students" element={<LecturerStudentsPage />} />
                    <Route path="/lecturer/questions" element={<QuestionBankPage />} />
                    <Route path="/lecturer/exams" element={<LecturerExamPage />} />
                    <Route path="/lecturer/exam-monitoring" element={<LecturerExamMonitoringPage />} />
                    <Route path="/lecturer/exam-monitoring/:examId" element={<LecturerExamMonitoringDetailPage />} />
                    <Route path="/lecturer/grading" element={<LecturerGradingPage />} />
                    <Route path="/lecturer/results" element={<LecturerResultsPage />} />
                    <Route path="/lecturer/reports" element={<LecturerReportsPage />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/users" element={<AdminUserManagementPage />} />
                    <Route path="/admin/courses" element={<AdminCoursePage />} />
                    <Route path="/admin/course-offerings" element={<AdminCourseOfferingPage />} />
                    <Route path="/admin/exams" element={<AdminExamPage />} />
                    <Route path="/admin/questions" element={<QuestionBankPage />} />
                    <Route path="/admin/exam-monitoring" element={<AdminExamMonitoringPage />} />
                    <Route path="/admin/exam-monitoring/:examId" element={<AdminExamMonitoringDetailPage />} />
                    <Route path="/admin/reports" element={<AdminReportsPage />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;