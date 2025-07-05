import { useState } from 'react';
import type { ProcessingResult } from '../services/api';
import '../styles/ClassificationResults.css';

interface ClassificationResultsProps {
  results: ProcessingResult[];
  onViewDetails?: (result: ProcessingResult) => void;
  onDelete?: (resultId: string) => void;
}

const ClassificationResults = ({ results, onViewDetails, onDelete }: ClassificationResultsProps) => {
  const [sortField, setSortField] = useState<keyof ProcessingResult>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle sorting
  const handleSort = (field: keyof ProcessingResult) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort the results
  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'filename' || sortField === 'category') {
      // String comparison
      comparison = String(a[sortField]).localeCompare(String(b[sortField]));
    } else if (sortField === 'confidence') {
      // Number comparison
      comparison = (a[sortField] as number) - (b[sortField] as number);
    } else {
      // Default timestamp comparison
      comparison = (a.timestamp as number) - (b.timestamp as number);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Format timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="classification-results">
      <h2>Classification Results</h2>
      
      {results.length === 0 ? (
        <div className="no-results">
          <p>No resumes have been processed yet. Upload some resumes to see results here.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('filename')} className={sortField === 'filename' ? `sorted ${sortDirection}` : ''}>
                  Filename
                  {sortField === 'filename' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('category')} className={sortField === 'category' ? `sorted ${sortDirection}` : ''}>
                  Category
                  {sortField === 'category' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th>Text Preview</th>
                <th onClick={() => handleSort('confidence')} className={sortField === 'confidence' ? `sorted ${sortDirection}` : ''}>
                  Confidence
                  {sortField === 'confidence' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('timestamp')} className={sortField === 'timestamp' ? `sorted ${sortDirection}` : ''}>
                  Processed At
                  {sortField === 'timestamp' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result) => (
                <tr key={result.id}>
                  <td className="filename-cell">{result.filename}</td>
                  <td>
                    <span className="category-badge">{result.category}</span>
                  </td>
                  <td className="preview-cell">
                    <div className="text-preview">{result.text_preview}</div>
                  </td>
                  <td className="confidence-cell">
                    <div className="confidence-bar-container">
                      <div 
                        className="confidence-bar" 
                        style={{ 
                          width: `${result.confidence * 100}%`,
                          backgroundColor: getConfidenceColor(result.confidence)
                        }}
                      ></div>
                      <span>{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>{formatDate(result.timestamp)}</td>
                  <td className="actions-cell">
                    <button 
                      className="view-details-button"
                      onClick={() => onViewDetails && onViewDetails(result)}
                    >
                      View Details
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => onDelete && onDelete(result.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on confidence score
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return '#2ecc71'; // Green for high confidence
  if (confidence >= 0.6) return '#f1c40f'; // Yellow for medium confidence
  return '#e74c3c'; // Red for low confidence
};

export default ClassificationResults;
