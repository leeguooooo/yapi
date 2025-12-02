import React from 'react';
import * as RRD from 'react-router-dom-original';

function renderRouteElement(props) {
  const { component: Component, render, children, element, ...rest } = props;
  const Element = () => {
    const location = RRD.useLocation();
    const navigate = RRD.useNavigate();
    const params = RRD.useParams();
    const match = { params };
    const injected = {
      history: { push: navigate, replace: (...args) => navigate(...args) },
      location,
      match,
      params
    };
    if (Component) return <Component {...props} {...injected} />;
    if (render) return render({ ...props, ...injected });
    if (typeof children === 'function') return children({ ...props, ...injected });
    return children || null;
  };
  return <RRD.Route {...rest} element={element || <Element />} />;
}

// Shim for legacy HOC usage across the codebase. It injects router props using v7 hooks.
export function withRouter(Component) {
  function Wrapper(props) {
    const location = RRD.useLocation();
    const navigate = RRD.useNavigate();
    const params = RRD.useParams();
    return (
      <Component
        {...props}
        router={{ location, navigate, params }}
        history={{ push: navigate, replace: (...args) => navigate(...args) }}
        location={location}
        match={{ params }}
      />
    );
  }
  Wrapper.displayName = `withRouter(${Component.displayName || Component.name || 'Component'})`;
  return Wrapper;
}

// Redirect fallback built on top of Navigate.
export function Redirect({ to, replace = true, state }) {
  return <RRD.Navigate to={to} replace={replace} state={state} />;
}

// Legacy Route shim that supports `component` / `render` / function children.
export function Route(props) {
  return renderRouteElement(props);
}

// Legacy Switch shim built on top of Routes.
export function Switch({ children }) {
  const normalized = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    if (child.type === Redirect) {
      const { to, ...rest } = child.props;
      return <RRD.Route key={`redirect-${to}`} path="*" element={<Redirect to={to} {...rest} />} />;
    }
    return renderRouteElement(child.props || {});
  });
  return <RRD.Routes>{normalized}</RRD.Routes>;
}

// Named exports forwarded from the real package.
export const Link = RRD.Link;
export const NavLink = RRD.NavLink;
export const Navigate = RRD.Navigate;
export const Outlet = RRD.Outlet;
export const RouterProvider = RRD.RouterProvider;
export const Routes = RRD.Routes;
export const BrowserRouter = RRD.BrowserRouter;
export const HashRouter = RRD.HashRouter;
export const MemoryRouter = RRD.MemoryRouter;
export const createBrowserRouter = RRD.createBrowserRouter;
export const createHashRouter = RRD.createHashRouter;
export const createSearchParams = RRD.createSearchParams;
export const generatePath = RRD.generatePath;
export const matchPath = RRD.matchPath;
export const useHref = RRD.useHref;
export const useInRouterContext = RRD.useInRouterContext;
export const useLinkClickHandler = RRD.useLinkClickHandler;
export const useLocation = RRD.useLocation;
export const useMatch = RRD.useMatch;
export const useNavigate = RRD.useNavigate;
export const useNavigationType = RRD.useNavigationType;
export const useOutlet = RRD.useOutlet;
export const useParams = RRD.useParams;
export const useResolvedPath = RRD.useResolvedPath;
export const useRoutes = RRD.useRoutes;

// Prompt is removed in v6+, keep a no-op shim to avoid crashes.
export const Prompt = () => null;
