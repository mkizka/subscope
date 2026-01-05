import {
  ErrorBoundary,
  lazy,
  LocationProvider,
  Route,
  Router,
} from "preact-iso";

const Home = lazy(() => import("./pages/index.tsx").then((mod) => mod.Home));
const Admin = lazy(() => import("./pages/admin.tsx").then((mod) => mod.Admin));
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
          <Route path="/admin" component={Admin} />
          <Route path="/login" component={Login} />
          <Route default component={NotFound} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
