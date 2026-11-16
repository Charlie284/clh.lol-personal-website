import React, {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ComponentType,
} from "react";
import {
  BrowserRouter as Router,
  useLocation,
  useRoutes,
} from "react-router-dom";
import { clientPages } from "./lib/clientPages";
import Layout from "./components/Layout.tsx";
import { RouteReadinessContext } from "./lib/routeReadiness";
import CookieConsent from "./components/CookieConsent.tsx";
import PageErrorBoundary from "./components/PageErrorBoundary.tsx";
import {
  recordNewsletterVisit,
  shouldShowNewsletterNotice,
} from "./lib/newsletterPreferences.ts";

const newsletterNoticeEligibleOnPageLoad = shouldShowNewsletterNotice();

type HomePageProps = {
  newsletterNoticeEligible: boolean;
  onNewsletterNoticeShown: () => void;
};

export type AppPageComponents = {
  Home: ComponentType<HomePageProps>;
  Projects: ComponentType;
  BlogPage: ComponentType;
  BlogPostPage: ComponentType;
  Privacy: ComponentType;
  NewsletterConfirmed: ComponentType;
  NotFound: ComponentType;
  Server: ComponentType;
  ThisWebsite: ComponentType;
  Startle: ComponentType;
  NewTrierBlock: ComponentType;
};

const PreviousPageContext = React.createContext<React.RefObject<string> | null>(null);

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const mountedPath = React.useRef(location.pathname).current;
  const previousPage = React.useContext(PreviousPageContext);
  const [animateEntry] = useState(() => Boolean(previousPage && previousPage.current !== mountedPath));
  const pageRef = React.useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const markReady = useCallback(() => setIsReady(true), []);

  useEffect(() => {
    if (!isReady || !previousPage || previousPage.current === mountedPath) return;
    previousPage.current = mountedPath;
    // Lazy routes receive focus only after their handlers mount.
    // Search parameter updates stay put.
    const target = pageRef.current?.querySelector<HTMLElement>("h1") ?? pageRef.current;
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  }, [isReady, mountedPath, previousPage]);

  return (
    <RouteReadinessContext.Provider value={markReady}>
      <div
        ref={pageRef}
        data-route-ready={isReady}
        className={`relative z-10 w-full min-h-screen${animateEntry ? " route-enter" : ""}`}
      >
        {children}
      </div>
    </RouteReadinessContext.Provider>
  );
};

const LoadingFallback = () => (
  <div role="status" className="min-h-screen flex items-center justify-center gap-3 text-sm text-white/65">
    <div aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border border-white/15 border-t-white" />
    Loading page…
  </div>
);

function AnimatedRoutes({ pages }: { pages: AppPageComponents }) {
  const location = useLocation();
  const previousPage = React.useRef(location.pathname);
  const {
    Home,
    Projects,
    BlogPage,
    BlogPostPage,
    Privacy,
    NewsletterConfirmed,
    NotFound,
    Server,
    ThisWebsite,
    Startle,
    NewTrierBlock,
  } = pages;
  const [newsletterNoticeEligible, setNewsletterNoticeEligible] = useState(
    newsletterNoticeEligibleOnPageLoad,
  );
  const handleNewsletterNoticeShown = useCallback(
    () => setNewsletterNoticeEligible(false),
    [],
  );

  useEffect(() => {
    recordNewsletterVisit();
  }, [location.pathname]);

  const element = useRoutes([
    {
      path: "/",
      element: (
        <PageWrapper>
          <Home
            newsletterNoticeEligible={newsletterNoticeEligible}
            onNewsletterNoticeShown={handleNewsletterNoticeShown}
          />
        </PageWrapper>
      ),
    },
    {
      path: "projects",
      element: (
        <PageWrapper>
          <Projects />
        </PageWrapper>
      ),
    },
    {
      path: "blog",
      element: (
        <PageWrapper>
          <BlogPage />
        </PageWrapper>
      ),
    },
    {
      path: "blog/:slug",
      element: (
        <PageWrapper>
          <BlogPostPage />
        </PageWrapper>
      ),
    },
    {
      path: "privacy",
      element: (
        <PageWrapper>
          <Privacy />
        </PageWrapper>
      ),
    },
    {
      path: "newsletter-confirmed",
      element: (
        <PageWrapper>
          <NewsletterConfirmed />
        </PageWrapper>
      ),
    },
    {
      path: "projects/server",
      element: (
        <PageWrapper>
          <Server />
        </PageWrapper>
      ),
    },
    {
      path: "projects/thiswebsite",
      element: (
        <PageWrapper>
          <ThisWebsite />
        </PageWrapper>
      ),
    },
    {
      path: "projects/new-trier-block",
      element: (
        <PageWrapper>
          <NewTrierBlock />
        </PageWrapper>
      ),
    },
    {
      path: "projects/startle",
      element: (
        <PageWrapper>
          <Startle />
        </PageWrapper>
      ),
    },
    {
      path: "*",
      element: (
        <PageWrapper>
          <NotFound />
        </PageWrapper>
      ),
    },
  ]);

  return (
    <PreviousPageContext.Provider value={previousPage}>
      <Layout>
        {/* A suspended destination must never hold up a later navigation.
            The incoming page owns its short CSS fade and focus handling. */}
        <Suspense key={location.pathname} fallback={<LoadingFallback />}>
          <PageErrorBoundary>{element}</PageErrorBoundary>
        </Suspense>
      </Layout>
    </PreviousPageContext.Provider>
  );
}

export function AppContent({
  pages = clientPages,
}: {
  pages?: AppPageComponents;
}) {
  return (
    <>
      <AnimatedRoutes pages={pages} />
      <CookieConsent />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
