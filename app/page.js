"use client";

import { useState, useEffect } from "react";
import { ToastProvider } from "../components/ToastProvider";
import DashboardHub from "../components/DashboardHub";
import LandingHero from "../components/LandingHero";
import EditorWorkspace from "../components/EditorWorkspace";
import PrintPreviewModal from "../components/PrintPreviewModal";
import FeedbackModal from "../components/FeedbackModal";
import MergePdfTool from "../components/MergePdfTool";
import ImagesToPdfTool from "../components/ImagesToPdfTool";
import PdfToImagesTool from "../components/PdfToImagesTool";
import PdfSplitterTool from "../components/PdfSplitterTool";
import CompressorTool from "../components/CompressorTool";
import ConfirmModal from "../components/ConfirmModal";
import SupportPage from "../components/SupportPage";

export default function Home() {
  const [screen, setScreen] = useState("hub"); // "hub" | "slide-landing" | "slide-editor" | "merge-pdf" | "images-to-pdf" | "pdf-to-images" | "pdf-splitter"
  const [pages, setPages] = useState([]);
  const [nUp, setNUp] = useState(2);
  const [theme, setTheme] = useState("light");
  const [modal, setModal] = useState(null);
  const [confirmBack, setConfirmBack] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(isDark ? "dark" : "light");

      const handlePopState = (e) => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (e.state && e.state.screen) {
          setScreen(e.state.screen);
        } else {
          setScreen("hub");
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  function changeScreen(newScreen) {
    if (typeof window !== "undefined") {
      window.history.pushState({ screen: newScreen }, "", `?tool=${newScreen}`);
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    setScreen(newScreen);
  }

  function handleLaunchTool(toolId) {
    if (toolId === "slide-optimizer") {
      setPages([]);
      changeScreen("slide-landing");
    } else {
      changeScreen(toolId);
    }
  }

  function handleFilesReady(nextPages) {
    setPages(nextPages);
    changeScreen("slide-editor");
  }

  function handleResetSlideOptimizer() {
    setPages([]);
    changeScreen("slide-landing");
    setModal(null);
  }

  function handleBackToHub(eOrBool) {
    const requiresConfirmation = typeof eOrBool === "boolean" ? eOrBool : true;
    if (requiresConfirmation) {
      setConfirmBack(true);
    } else {
      confirmBackToHub();
    }
  }

  function confirmBackToHub() {
    setConfirmBack(false);
    setPages([]);
    changeScreen("hub");
  }

  return (
    <ToastProvider>
      <main data-theme={theme} className={`min-h-screen bg-[var(--bg-main)] ${theme === "dark" ? "dark" : ""}`}>
        {/* Multi-Tool Dashboard Hub */}
        {screen === "hub" && (
          <div className="animate-rise h-full w-full">
            <DashboardHub onLaunch={handleLaunchTool} theme={theme} setTheme={setTheme} />
          </div>
        )}

        {/* Tool 1: Slide & Deck Optimizer (Landing dropzone) */}
        {screen === "slide-landing" && (
          <div className="animate-rise h-full w-full">
            <LandingHero
              onFilesReady={handleFilesReady}
              theme={theme}
              setTheme={setTheme}
              onBackToHub={handleBackToHub}
            />
          </div>
        )}

        {/* Tool 1: Slide & Deck Optimizer (Editor workspace) */}
        {screen === "slide-editor" && (
          <div className="animate-rise h-full w-full">
            <EditorWorkspace
              pages={pages}
              setPages={setPages}
              nUp={nUp}
              setNUp={setNUp}
              theme={theme}
              setTheme={setTheme}
              onReset={handleResetSlideOptimizer}
              onPreview={() => setModal("preview")}
              onBackToHub={handleBackToHub}
            />
          </div>
        )}

        {/* Tool 2: Merge & Organize PDFs */}
        {screen === "merge-pdf" && (
          <div className="animate-rise h-full w-full">
            <MergePdfTool
              theme={theme}
              setTheme={setTheme}
              onBackToHub={handleBackToHub}
              onDownloaded={() => setModal("feedback")}
            />
          </div>
        )}

        {/* Tool 3: Images to PDF Converter */}
        {screen === "images-to-pdf" && (
          <div className="animate-rise h-full w-full">
            <ImagesToPdfTool
              theme={theme}
              setTheme={setTheme}
              onBackToHub={handleBackToHub}
              onDownloaded={() => setModal("feedback")}
            />
          </div>
        )}

        {/* Tool 4: PDF to Image Extractor */}
        {screen === "pdf-to-images" && (
          <div className="animate-rise h-full w-full">
            <PdfToImagesTool
              theme={theme}
              setTheme={setTheme}
              onBackToHub={handleBackToHub}
              onDownloaded={() => setModal("feedback")}
            />
          </div>
        )}

        {/* Tool 5: PDF Page Splitter / Extractor */}
        {screen === "pdf-splitter" && (
          <div className="animate-rise h-full w-full">
            <PdfSplitterTool
              theme={theme}
              setTheme={setTheme}
              onBackToHub={handleBackToHub}
              onDownloaded={() => setModal("feedback")}
            />
          </div>
        )}

        {/* Tool 6: PDF & Image Compressor */}
        {screen === "compressor" && (
          <div className="animate-rise h-full w-full">
            <CompressorTool
              theme={theme}
              setTheme={setTheme}
              onBackToHub={handleBackToHub}
              onDownloaded={() => setModal("feedback")}
            />
          </div>
        )}

        {/* Support Page */}
        {screen === "support" && (
          <div className="animate-rise h-full w-full">
            <SupportPage
              theme={theme}
              setTheme={setTheme}
              onBackToHub={handleBackToHub}
            />
          </div>
        )}

        {/* Modals for Slide Optimizer */}
        {modal === "preview" && (
          <PrintPreviewModal
            pages={pages}
            nUp={nUp}
            setNUp={setNUp}
            onClose={() => setModal(null)}
            onDownloaded={() => setModal("feedback")}
          />
        )}
        {modal === "feedback" && (
          <FeedbackModal
            onClose={() => setModal(null)}
            onSupport={() => {
              setModal(null);
              changeScreen("support");
            }}
          />
        )}
        {confirmBack && (
          <ConfirmModal
            title="Leave Workspace?"
            message="Are you sure you want to go back? Any unsaved progress in this tool will be lost and the workspace will be reset."
            confirmLabel="Leave"
            onConfirm={confirmBackToHub}
            onClose={() => setConfirmBack(false)}
          />
        )}
      </main>
    </ToastProvider>
  );
}
