import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../../../services/apiService';

export function usePdfViewer({ showToast }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [loadingPdfId, setLoadingPdfId] = useState(null);

  const cleanupUrl = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [pdfUrl]);

  const openPdf = useCallback(async (fetcherUrl, name, loadingKey) => {
    try {
      setLoadingPdfId(loadingKey);
      const blob = await apiService.getPdf(fetcherUrl);
      const objUrl = URL.createObjectURL(blob);
      
      cleanupUrl(); // clean up previous if exists
      setPdfUrl(objUrl);
      setPdfName(name);
      setShowPdfViewer(true);
    } catch (error) {
      console.error(error);
      showToast(`Failed to load ${name}`, "error");
    } finally {
      setLoadingPdfId(null);
    }
  }, [cleanupUrl, showToast]);

  const closePdfViewer = useCallback(() => {
    setShowPdfViewer(false);
    cleanupUrl();
  }, [cleanupUrl]);

  useEffect(() => {
    return () => {
      cleanupUrl();
    };
  }, [cleanupUrl]);

  return {
    pdfUrl,
    pdfName,
    showPdfViewer,
    loadingPdfId,
    openPdf,
    closePdfViewer
  };
}
