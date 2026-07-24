import React from 'react';

interface ExportOptions {
  memories: any[];
  chapterTitle: string;
  userName?: string;
  onProgress?: (progress: number) => void;
}

export const generateLegacyBookPDF = async ({
  memories,
  chapterTitle,
  userName,
  onProgress
}: ExportOptions): Promise<void> => {
  try {
    onProgress?.(10);
    
    // Dynamically load the dependencies to optimize bundle size and prevent compile-time rendering errors
    const { pdf } = await import('@react-pdf/renderer');
    const { LegacyBookPDF } = await import('@/components/pdf/LegacyBookPDF');

    onProgress?.(40);
    
    // Generate PDF blob
    const blob = await pdf(
      React.createElement(LegacyBookPDF, {
        memories,
        chapterTitle,
        userName
      }) as any
    ).toBlob();
    
    onProgress?.(90);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chapterTitle.replace(/[^a-z0-9]/gi, '_')}_Legacy_Book.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onProgress?.(100);
    }, 100);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate legacy book. Please try again.');
  }
};
