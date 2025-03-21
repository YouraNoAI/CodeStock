import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import AdminDashboard from "./pages/admin/dashboard";
import AdminManagePages from "./pages/admin/manage-pages";
import AdminGrades from "./pages/admin/grades";
import AdminAssignments from "./pages/admin/assignments";
import AdminAwards from "./pages/admin/awards";
import AdminUserMonitoring from "./pages/admin/user-monitoring";
import AdminStatistics from "./pages/admin/statistics";
import AdminUsers from "./pages/admin/users";
import UserDashboard from "./pages/user/dashboard";
import UserLearningMaterials from "./pages/user/learning-materials";
import UserAssignments from "./pages/user/assignments";
import UserGrades from "./pages/user/grades";
import UserAwards from "./pages/user/awards";
import UserProfile from "./pages/user/profile";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Auth Route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/pages" component={AdminManagePages} />
      <ProtectedRoute path="/admin/grades" component={AdminGrades} />
      <ProtectedRoute path="/admin/assignments" component={AdminAssignments} />
      <ProtectedRoute path="/admin/awards" component={AdminAwards} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/monitoring" component={AdminUserMonitoring} />
      <ProtectedRoute path="/admin/statistics" component={AdminStatistics} />
      
      {/* User Routes */}
      <ProtectedRoute path="/" component={UserDashboard} />
      <ProtectedRoute path="/materials" component={UserLearningMaterials} />
      <ProtectedRoute path="/assignments" component={UserAssignments} />
      <ProtectedRoute path="/grades" component={UserGrades} />
      <ProtectedRoute path="/awards" component={UserAwards} />
      <ProtectedRoute path="/profile" component={UserProfile} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
