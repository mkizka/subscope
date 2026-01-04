import {
  ErrorBoundary,
  lazy,
  LocationProvider,
  Route,
  Router,
} from "preact-iso";

const Foo = lazy(() => import("./pages/foo.tsx").then((mod) => mod.Foo));
const Bar = lazy(() => import("./pages/bar.tsx").then((mod) => mod.Bar));

export function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <nav>
        <a href="/foo">Go to Foo</a>
        <br />
        <a href="/bar">Go to Bar</a>
      </nav>
    </div>
  );
}

export function NotFound() {
  return <div>404 Not Found</div>;
}

export function App() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/foo" component={Foo} />
          <Route path="/bar" component={Bar} />
          <Route default component={NotFound} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
