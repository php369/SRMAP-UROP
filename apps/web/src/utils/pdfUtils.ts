/**
 * Opens a PDF in a modal viewer
 */
export const openPDFModal = (url: string, title: string = 'PDF Document') => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
      <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-semibold">${title}</h3>
        <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
      </div>
      <div class="flex-1 p-4">
        <iframe 
          src="${url}" 
          class="w-full h-full border-0 rounded"
          title="${title}"
        ></iframe>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal handlers
  const closeModal = () => {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
  };
  
  modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Close on escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
};

/**
 * Downloads a file from URL with proper filename
 */
export const downloadFile = async (url: string, filename?: string) => {
  try {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.style.display = 'none';
    
    // If filename is not provided, extract from URL
    if (!filename) {
      const urlParts = url.split('/');
      filename = urlParts[urlParts.length - 1] || 'download.pdf';
    }
    
    // For Supabase URLs, we need to fetch the file and create a blob
    if (url.includes('supabase')) {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } else {
      // For other URLs, try direct download
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};

/**
 * Extracts filename from URL or generates a default one
 */
export const getFilenameFromUrl = (url: string, defaultName: string = 'document.pdf'): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    if (filename && filename.includes('.')) {
      return filename;
    }
    
    return defaultName;
  } catch {
    return defaultName;
  }
};