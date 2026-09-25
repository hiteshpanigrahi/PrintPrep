<div align="center">

# 🖨️ PrintPrep Studio

**The privacy-first, browser-native document and presentation deck optimizer.**  
*Strip dark backgrounds, merge PDFs, convert images, split pages, and compress files—100% inside your browser.*

[![Live Website](https://img.shields.io/badge/Live_Demo-printprep.vercel.app-3F9672?style=for-the-badge&logo=vercel&logoColor=white)](https://printprep.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[**Explore Live App »**](https://printprep.vercel.app) · [**Report a Bug**](mailto:hitesh.edu9@gmail.com?subject=%5BPrintPrep%5D%20Bug%20Report) · [**Request a Feature**](mailto:hitesh.edu9@gmail.com?subject=%5BPrintPrep%5D%20Feature%20Request)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Why PrintPrep? (Privacy-First)](#-why-printprep-privacy-first)
- [Core Tools & Features](#-core-tools--features)
  - [1. Coaching Slides Optimizer](#1-coaching-slides-optimizer)
  - [2. Merge & Organize PDFs](#2-merge--organize-pdfs)
  - [3. Images to PDF Converter](#3-images-to-pdf-converter)
  - [4. PDF to High-Res Images](#4-pdf-to-high-res-images)
  - [5. PDF Page Splitter & Extractor](#5-pdf-page-splitter--extractor)
  - [6. PDF & Image Compressor](#6-pdf--image-compressor)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Environment Variables](#environment-variables)
- [Analytics & Feedback System](#-analytics--feedback-system)
- [Feedback, Bug Reports & Feature Requests](#-feedback-bug-reports--feature-requests)
- [Support the Project](#-support-the-project)
- [Author & Credits](#-author--credits)

---

## 🌟 Overview

Most online PDF utilities require uploading your sensitive lecture notes, contracts, certificates, and pitch decks to remote servers. This introduces privacy risks, server latency, and strict file size limits.

**PrintPrep** is built on a simple premise: **Your documents should never leave your computer.**

Every single operation—parsing, background inversion, page reordering, compression, and PDF generation—runs entirely in your local browser tab using HTML5 Canvas, WebAssembly, and client-side Web Workers.

---

## 🔒 Why PrintPrep? (Privacy-First)

| Feature | Traditional Online Tools | PrintPrep Studio |
| :--- | :--- | :--- |
| **Cloud File Uploads** | ❌ Files sent to external servers | ✅ **Zero server uploads (100% local)** |
| **Data Privacy** | ⚠️ Subject to third-party data policies | ✅ **Total privacy—files stay in your RAM** |
| **Processing Speed** | ⏳ Limited by upload/download bandwidth | ⚡ **Instant native client performance** |
| **Queue & Limits** | ⏳ Queues, timeouts, or paid paywalls | 🚀 **No queues, unlimited pages** |
| **Ink Saving** | ❌ Rarely supported for dark decks | 🌿 **Smart inversion & contrast culling** |

---

## 🛠️ Core Tools & Features

### 1. Coaching Slides Optimizer
*Designed specifically for students, educators, and professionals printing dark webinar slides and coaching decks.*
- **Smart Background Inversion**: Converts ink-heavy dark slides to clean white backgrounds while preserving diagram clarity and text contrast.
- **N-Up Grid Packing**: Print 1-up, 2-up, 4-up, or 6-up slides on standard A4 sheets to save up to 75% on paper and ink costs.
- **Slide Culling**: Easily remove duplicate, filler, or blank slides before printing.
- **Live A4 Preview Carousel**: Fluid, responsive preview of your finalized sheets before downloading.

### 2. Merge & Organize PDFs
- Combine multiple PDF files, Microsoft Word (`.docx`) documents, and images (`PNG`, `JPEG`, `WebP`) into one unified document.
- Interactive drag-and-drop page reordering powered by `@hello-pangea/dnd`.
- Rotate individual pages ($90^\circ, 180^\circ, 270^\circ$) and insert blank note sheets anywhere.

### 3. Images to PDF Converter
- Batch upload multi-format images (`PNG`, `JPEG`, `WebP`).
- Customize page margins, orientation (Portrait/Landscape), and image fit modes (Fit to Page / Fill Page).
- Export as a high-fidelity, standardized A4 PDF document.

### 4. PDF to High-Res Images
- Render each page of any PDF document into crisp, high-resolution PNG images via `pdfjs-dist`.
- Inspect individual page previews with zoom controls.
- Download single pages or bundle all rendered pages into an automated `.zip` package via `JSZip`.

### 5. PDF Page Splitter & Extractor
- Extract specific pages visually by clicking thumbnails or typing a page-range syntax (e.g. `1–5, 8, 11–16`).
- Split massive PDFs into lighter, focused reference packets in seconds.

### 6. PDF & Image Compressor
- Target exact file-size thresholds (e.g. compress a 15 MB document down to $< 500$ KB).
- Client-side canvas compression with visual quality retention sliders.
- Instant before/after file size diff calculator.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Modern CSS Variable Design System
- **PDF Generation & Manipulation**: [`pdf-lib`](https://pdf-lib.js.org/)
- **PDF Rendering & Parsing**: [`pdfjs-dist`](https://mozilla.github.io/pdf.js/)
- **Office Document Processing**: [`mammoth`](https://www.npmjs.com/package/mammoth) & [`docx`](https://docx.js.org/)
- **Drag & Drop Interactions**: [`@hello-pangea/dnd`](https://github.com/hello-pangea/dnd)
- **Archive Generation**: [`JSZip`](https://stuk.github.io/jszip/)
- **Iconography**: [`lucide-react`](https://lucide.dev/) & [`@hugeicons/react`](https://hugeicons.com/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed:
- Node.js 18.18+ or 20+
- `npm`, `pnpm`, or `yarn`

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hiteshpanigrahi/PrintPrep.git
   cd PrintPrep
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to view PrintPrep Studio.

### Build & Production

To verify TypeScript, Turbopack compilations, and create an optimized production build:

```bash
npm run build
npm run start
```

---

## ⚙️ Environment Variables

To connect live community analytics and star reviews with a private Google Sheet backend, create a `.env.local` file in the root directory:

```env
# Google Apps Script Web App Deployment URL
NEXT_PUBLIC_GOOGLE_SHEETS_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

> **Note**: If `NEXT_PUBLIC_GOOGLE_SHEETS_URL` is omitted, the application runs gracefully with resilient fallback stats without blocking any file processing features.

---

## 📊 Analytics & Feedback System

PrintPrep features a zero-cookie, privacy-preserving feedback and user metric tracking system:
- **Persistent Anonymous ID**: Randomly generated client-side token (`usr_...`) stored in `localStorage`—no cookies, IP recording, or tracking pixels.
- **One-Time Rating Lock**: Once a user rates the app, their rating is permanently locked to prevent vote inflation.
- **Interactive Ratings & Feedback**: Integrated with Google Sheets via a lightweight Google Apps Script endpoint.

---

## 📬 Feedback, Bug Reports & Feature Requests

Have a suggestion, found a bug, or want a specific tool added? We would love to hear from you!

- ✉️ **Direct Email**: [hitesh.edu9@gmail.com](mailto:hitesh.edu9@gmail.com?subject=%5BPrintPrep%5D%20Feature%20Request%20%2F%20Bug%20Report)
- 🐛 **GitHub Issues**: [Open an issue on GitHub](https://github.com/hiteshpanigrahi/PrintPrep/issues)
- 💬 **In-App Feedback**: Click the **Feedback** or **Feature / Bug Report** buttons in the footer at [printprep.vercel.app](https://printprep.vercel.app).

---

## ☕ Support the Project

PrintPrep is completely free, open-source, and contains zero advertisements. If it saved you paper, ink, or time, consider buying a drink to support development:

- **UPI ID**: `hitesh.edu9@okaxis`
- **UPI QR**: Scan the QR code on the [Support Page](https://printprep.vercel.app) *(Support » Buy me a drink)*

---

## 👤 Author & Credits

Created with ❤️ by **Hitesh Panigrahi**
- **Website**: [printprep.vercel.app](https://printprep.vercel.app)
- **GitHub**: [@hiteshpanigrahi](https://github.com/hiteshpanigrahi)
- **LinkedIn**: [Hitesh Panigrahi](https://www.linkedin.com/in/hitesh-panigrahi-2244312b7/)

---

<div align="center">
  <sub>Built for students, educators, and creators who value privacy and quality.</sub>
</div>
