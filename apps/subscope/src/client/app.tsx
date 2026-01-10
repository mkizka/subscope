import {
  ErrorBoundary,
  lazy,
  LocationProvider,
  Route,
  Router,
} from "preact-iso";

const Home = lazy(() => import("./pages/index.tsx").then((mod) => mod.Home));
const AdminDashboard = lazy(() =>
  import("./pages/admin/dashboard.tsx").then((mod) => mod.AdminDashboard),
);
const AdminInviteCodes = lazy(() =>
  import("./pages/admin/invite-codes.tsx").then((mod) => mod.AdminInviteCodes),
);
const Login = lazy(() => import("./pages/login.tsx").then((mod) => mod.Login));

export function NotFound() {
  return <div>404 Not Found</div>;
}

export function App() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/invite-codes" component={AdminInviteCodes} />
          <Route path="/login" component={Login} />
          <Route default component={NotFound} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
