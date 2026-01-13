import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Spinner,
  Alert,
  ProgressBar,
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  FaDownload,
  FaExternalLinkAlt,
  FaTimes,
  FaImage,
  FaExclamationTriangle,
  FaFilePdf,
  FaCompressAlt,
  FaExpandAlt,
  FaEye,
} from "react-icons/fa";
import { Document, Page, pdfjs } from "react-pdf";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const AcknowledgementImage = ({ show, onHide, imageUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [fileError, setFileError] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [pdfNumPages, setPdfNumPages] = useState(null);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [isZoomed, setIsZoomed] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [fileSize, setFileSize] = useState(null);

  const imageRef = useRef(null);
  const modalBodyRef = useRef(null);

  // Detect file type and load file
  useEffect(() => {
    if (imageUrl && show) {
      loadFileInfo();
    }
  }, [imageUrl, show]);

  // Reset states when modal closes
  useEffect(() => {
    if (!show) {
      setIsLoading(true);
      setFileError(false);
      setFileInfo(null);
      setFileType(null);
      setPdfNumPages(null);
      setPdfPageNumber(1);
      setPdfScale(1.0);
      setActiveTab("preview");
      setIsZoomed(false);
      setDownloadProgress(0);
    }
  }, [show]);

  const getFullFileUrl = () => {
    if (!imageUrl) return "";

    // If it's already a full URL, return it
    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("data:")
    ) {
      return imageUrl;
    }

    // If it starts with /uploads, prepend API URL
    if (imageUrl.startsWith("/uploads")) {
      return `${import.meta.env.VITE_API_URL || ""}${imageUrl}`;
    }

    // Otherwise, assume it's a relative path from the API
    return `${import.meta.env.VITE_API_URL || ""}/uploads/${imageUrl}`;
  };

  const loadFileInfo = async () => {
    setIsLoading(true);
    setFileError(false);
    const fullUrl = getFullFileUrl();

    try {
      // First, detect file type from URL
      const fileName = getFileName();
      const extension = fileName.split(".").pop().toLowerCase();

      if (["pdf"].includes(extension)) {
        setFileType("pdf");
      } else if (
        ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)
      ) {
        setFileType("image");
      } else {
        setFileType("unknown");
      }

      // Try to get file size via HEAD request
      try {
        const response = await fetch(fullUrl, { method: "HEAD" });
        if (response.headers.get("content-length")) {
          const size = parseInt(response.headers.get("content-length"));
          setFileSize(formatFileSize(size));
        }
      } catch (error) {
        console.log("Could not fetch file size:", error);
      }

      // Check if file exists
      const testResponse = await fetch(fullUrl, { method: "HEAD" });
      if (!testResponse.ok) {
        throw new Error(`File not found (${testResponse.status})`);
      }

      setFileInfo({
        url: fullUrl,
        name: fileName,
        extension: extension,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading file info:", error);
      setFileError(true);
      setIsLoading(false);
    }
  };

  const getFileName = () => {
    if (!imageUrl) return "acknowledgement-file";

    try {
      const url = new URL(getFullFileUrl());
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      return fileName || `acknowledgement.${fileType || "jpg"}`;
    } catch (error) {
      const parts = imageUrl.split("/");
      const fileName = parts[parts.length - 1];
      return fileName || `acknowledgement.${fileType || "jpg"}`;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = async () => {
    const fullUrl = getFullFileUrl();
    const fileName = getFileName();

    try {
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch file: ${response.status} ${response.statusText}`
        );
      }

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total > 0) {
          const progress = Math.round((loaded / total) * 100);
          setDownloadProgress(progress);
        }
      }

      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setDownloadProgress(0);
      }, 100);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to opening in new tab
      window.open(fullUrl, "_blank");
    }
  };

  const onPdfLoadSuccess = ({ numPages }) => {
    setPdfNumPages(numPages);
    setPdfLoading(false);
  };

  const onPdfLoadError = (error) => {
    console.error("PDF load error:", error);
    setFileError(true);
    setPdfLoading(false);
  };

  const changePdfPage = (offset) => {
    setPdfPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      if (newPageNumber >= 1 && newPageNumber <= pdfNumPages) {
        return newPageNumber;
      }
      return prevPageNumber;
    });
  };

  const zoomIn = () => {
    setPdfScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setPdfScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setPdfScale(1.0);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    if (imageRef.current && fileType === "image") {
      if (!isZoomed) {
        imageRef.current.style.maxHeight = "none";
        imageRef.current.style.cursor = "zoom-out";
        if (modalBodyRef.current) {
          modalBodyRef.current.scrollTop = 0;
        }
      } else {
        imageRef.current.style.maxHeight = "65vh";
        imageRef.current.style.cursor = "zoom-in";
      }
    }
  };

  const renderImage = () => (
    <div className="image-container" style={{ textAlign: "center" }}>
      <img
        ref={imageRef}
        src={getFullFileUrl()}
        alt="Acknowledgement"
        className="img-fluid"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setFileError(true);
          setIsLoading(false);
        }}
        style={{
          maxHeight: "65vh",
          maxWidth: "100%",
          objectFit: "contain",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          cursor: "zoom-in",
          transition: "all 0.3s ease",
        }}
        onClick={toggleZoom}
      />
    </div>
  );

  const renderPDF = () => (
    <div className="pdf-container" style={{ textAlign: "center" }}>
      {pdfLoading && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px" }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      <div className="pdf-controls mb-3">
        <div className="d-flex justify-content-center align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => changePdfPage(-1)}
            disabled={pdfPageNumber <= 1 || pdfLoading}
          >
            Previous
          </Button>

          <span className="mx-2">
            Page {pdfPageNumber} of {pdfNumPages || "--"}
          </span>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => changePdfPage(1)}
            disabled={pdfPageNumber >= pdfNumPages || pdfLoading}
          >
            Next
          </Button>
        </div>

        <div className="d-flex justify-content-center align-items-center gap-2 mt-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={zoomOut}
            disabled={pdfLoading}
          >
            <FaCompressAlt /> Zoom Out
          </Button>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={resetZoom}
            disabled={pdfLoading}
          >
            Reset Zoom
          </Button>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={zoomIn}
            disabled={pdfLoading}
          >
            <FaExpandAlt /> Zoom In
          </Button>
        </div>
      </div>

      <div
        className="pdf-viewer"
        style={{
          overflow: "auto",
          maxHeight: "60vh",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          padding: "10px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Document
          file={getFullFileUrl()}
          onLoadSuccess={onPdfLoadSuccess}
          onLoadError={onPdfLoadError}
          loading={
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "300px" }}
            >
              <Spinner animation="border" variant="primary" />
              <span className="ms-2">Loading PDF...</span>
            </div>
          }
          onLoadProgress={({ loaded, total }) => {
            if (total > 0) {
              const progress = Math.round((loaded / total) * 100);
              setDownloadProgress(progress);
            }
          }}
        >
          <Page
            pageNumber={pdfPageNumber}
            scale={pdfScale}
            renderAnnotationLayer={false}
            renderTextLayer={true}
          />
        </Document>
      </div>
    </div>
  );

  const renderFileInfo = () => {
    const fileName = getFileName();
    const extension = fileName.split(".").pop().toUpperCase();

    return (
      <div className="file-info p-3 border rounded bg-light">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-1">
              <strong>File Name:</strong>
            </p>
            <p className="text-truncate">{fileName}</p>
          </div>
          <div className="col-md-3">
            <p className="mb-1">
              <strong>Type:</strong>
            </p>
            <p className="text-uppercase">{extension}</p>
          </div>
          <div className="col-md-3">
            <p className="mb-1">
              <strong>Size:</strong>
            </p>
            <p>{fileSize || "Unknown"}</p>
          </div>
        </div>
        {fileInfo?.url && (
          <div className="mt-2">
            <p className="mb-1">
              <strong>URL:</strong>
            </p>
            <small className="text-muted text-break">{fileInfo.url}</small>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px" }}
        >
          <div className="text-center">
            <Spinner
              animation="border"
              role="status"
              variant="primary"
              size="lg"
            />
            <p className="mt-3">Loading file...</p>
            {downloadProgress > 0 && (
              <div className="mt-3" style={{ width: "200px" }}>
                <ProgressBar
                  now={downloadProgress}
                  label={`${downloadProgress}%`}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (fileError) {
      return (
        <div className="text-center py-5">
          <FaExclamationTriangle size={64} className="text-warning mb-3" />
          <h5>File Not Available</h5>
          <p className="text-muted">
            The acknowledgement file could not be loaded.
          </p>
          <div className="mt-4">
            <Button
              variant="outline-primary"
              onClick={() => window.open(getFullFileUrl(), "_blank")}
              className="me-2"
            >
              <FaExternalLinkAlt className="me-2" />
              Open in New Tab
            </Button>
            <Button variant="outline-secondary" onClick={loadFileInfo}>
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (fileType === "pdf") {
      return renderPDF();
    } else if (fileType === "image") {
      return renderImage();
    } else {
      return (
        <div className="text-center py-5">
          <FaFilePdf size={64} className="text-primary mb-3" />
          <h5>Unsupported File Type</h5>
          <p className="text-muted">This file type cannot be previewed.</p>
          <div className="mt-4">
            <Button variant="primary" onClick={handleDownload}>
              <FaDownload className="me-2" />
              Download File
            </Button>
          </div>
        </div>
      );
    }
  };

  if (!imageUrl || !show) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      keyboard={false}
      fullscreen={isZoomed && fileType === "image"}
    >
      <Modal.Header closeButton={!isZoomed}>
        <Modal.Title className="d-flex align-items-center">
          {fileType === "pdf" ? (
            <FaFilePdf className="me-2 text-danger" />
          ) : (
            <FaImage className="me-2 text-primary" />
          )}
          <div>
            <h5 className="mb-0">Acknowledgement File</h5>
            <small className="text-muted">{getFileName()}</small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        ref={modalBodyRef}
        style={{ maxHeight: "70vh", overflow: "auto" }}
      >
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="preview" title="Preview">
            {renderContent()}
          </Tab>
          <Tab eventKey="info" title="File Info">
            {renderFileInfo()}
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <div className="d-flex justify-content-between w-100 align-items-center">
          <div>
            <Button variant="outline-secondary" onClick={onHide}>
              <FaTimes className="me-2" />
              Close
            </Button>
          </div>

          <div className="d-flex gap-2">
            {fileType === "image" && !isLoading && !fileError && (
              <Button variant="outline-primary" onClick={toggleZoom}>
                {isZoomed ? (
                  <FaCompressAlt className="me-2" />
                ) : (
                  <FaExpandAlt className="me-2" />
                )}
                {isZoomed ? "Zoom Out" : "Zoom In"}
              </Button>
            )}

            <Button
              variant="outline-primary"
              onClick={() => window.open(getFullFileUrl(), "_blank")}
              disabled={isLoading || fileError}
            >
              <FaExternalLinkAlt className="me-2" />
              Open
            </Button>

            <Button
              variant="primary"
              onClick={handleDownload}
              disabled={isLoading || fileError}
            >
              <FaDownload className="me-2" />
              Download
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AcknowledgementImage;
