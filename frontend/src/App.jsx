import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Editor from "./components/editor/Editor";
import ModeSelector from "./components/ui/ModeSelector";
import MindMapping from "./components/mindmapping/MindMapping";
import OrganizationInput from "./components/ui/OrganizationInput";

const PageWrapper = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} style={{ height: "100%" }}>
    {children}
  </motion.div>
);

function AnimatedRoutes({ organizationName }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <ModeSelector organizationName={organizationName} />
            </PageWrapper>
          }
        />
        <Route
          path="/editor"
          element={
            <PageWrapper>
              <Editor organizationName={organizationName} />
            </PageWrapper>
          }
        />
        <Route
          path="/mindmapping"
          element={
           <React.StrictMode>
  <MindMapping organizationName={organizationName} />
</React.StrictMode>

          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [organizationName, setOrganizationName] = useState(null);

  useEffect(() => {
    // Check if organization name is stored in localStorage
    const storedOrg = localStorage.getItem('organizationName');
    if (storedOrg) {
      setOrganizationName(storedOrg);
    }
  }, []);

  const handleOrganizationVerified = (orgName) => {
    setOrganizationName(orgName);
    localStorage.setItem('organizationName', orgName);
  };

  // Show organization input if not verified
  if (!organizationName) {
    return <OrganizationInput onOrganizationVerified={handleOrganizationVerified} />;
  }

  return (
    <div className="App" style={{ width: "100vw", height: "100vh" }}>
      <BrowserRouter>
        <AnimatedRoutes organizationName={organizationName} />
      </BrowserRouter>
    </div>
  );
}

export default App;
