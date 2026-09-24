"use client";

import { useState } from "react";
import LandingHero from "../components/LandingHero";
import EditorWorkspace from "../components/EditorWorkspace";
import PrintPreviewModal from "../components/PrintPreviewModal";
import FeedbackModal from "../components/FeedbackModal";

export default function Home() {
  const [pages, setPages] = useState([]);
  const [screen, setScreen] = useState("landing");
  const [nUp, setNUp] = useState(2);
  const [theme, setTheme] = useState("light");
  const [modal, setModal] = useState(null);

  function openEditor(nextPages) {
    setPages(nextPages);
    setScreen("editor");
  }

  function handleReset() {
    setPages([]);
    setScreen("landing");
    setModal(null);
  }

  return (
    <main data-theme={theme} className={`min-h-screen bg-[var(--bg-main)] ${theme === "dark" ? "dark" : ""}`}>
      {screen === "landing" && <LandingHero onFilesReady={openEditor} theme={theme} setTheme={setTheme} />}
      {screen === "editor" && (
        <EditorWorkspace
          pages={pages}
          setPages={setPages}
          nUp={nUp}
          setNUp={setNUp}
          theme={theme}
          setTheme={setTheme}
          onReset={handleReset}
          onPreview={() => setModal("preview")}
        />
      )}
      {modal === "preview" && (
        <PrintPreviewModal
          pages={pages}
          nUp={nUp}
          setNUp={setNUp}
          onClose={() => setModal(null)}
          onDownloaded={() => setModal("feedback")}
        />
      )}
      {modal === "feedback" && <FeedbackModal onClose={() => setModal(null)} />}
    </main>
  );
}
