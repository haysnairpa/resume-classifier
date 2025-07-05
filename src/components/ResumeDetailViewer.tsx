import type { ProcessingResult } from '../services/api';
import '../styles/ResumeDetailViewer.css';

interface ResumeDetailViewerProps {
  resume: ProcessingResult | null;
  onClose: () => void;
}

const ResumeDetailViewer = ({ resume, onClose }: ResumeDetailViewerProps) => {
  if (!resume) return null;

  // Format timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Get confidence level text
  const getConfidenceLevel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#2ecc71'; // Green for high confidence
    if (confidence >= 0.6) return '#f1c40f'; // Yellow for medium confidence
    return '#e74c3c'; // Red for low confidence
  };

  return (
    <div className="resume-detail-overlay" onClick={onClose}>
      <div className="resume-detail-container" onClick={(e) => e.stopPropagation()}>
        <div className="resume-detail-header">
          <h2>Resume Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="resume-detail-content">
          <div className="resume-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Filename</span>
              <span className="metadata-value">{resume.filename}</span>
            </div>
            
            <div className="metadata-item">
              <span className="metadata-label">Category</span>
              <span className="metadata-value">
                <span className="category-badge">{resume.category}</span>
              </span>
            </div>
            
            <div className="metadata-item">
              <span className="metadata-label">Confidence</span>
              <div className="confidence-display">
                <div 
                  className="confidence-indicator" 
                  style={{ backgroundColor: getConfidenceColor(resume.confidence) }}
                ></div>
                <span>{(resume.confidence * 100).toFixed(1)}% ({getConfidenceLevel(resume.confidence)})</span>
              </div>
            </div>
            
            <div className="metadata-item">
              <span className="metadata-label">Processed At</span>
              <span className="metadata-value">{formatDate(resume.timestamp)}</span>
            </div>
          </div>
          
          <div className="resume-text-container">
            <h3>Resume Content</h3>
            <div className="resume-text">
              {/* This would be the full text, but for now we'll use the preview */}
              {resume.text_preview}
              {/* In a real implementation, you would fetch the full text from the backend */}
              <p className="text-note">
                (This is a preview. In a complete implementation, the full resume text would be displayed here.)
              </p>
            </div>
          </div>
        </div>
        
        <div className="resume-detail-footer">
          <button className="close-detail-button" onClick={onClose}>Close</button>
          {/* Additional buttons like download could be added here */}
        </div>
      </div>
    </div>
  );
};

export default ResumeDetailViewer;
