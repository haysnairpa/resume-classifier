import { useState, useEffect } from 'react';
import './App.css';
import ResumeUpload from './components/ResumeUpload';
import ClassificationResults from './components/ClassificationResults';
import ResumeDetailViewer from './components/ResumeDetailViewer';
import type { ProcessingResult } from './services/api';
import { deleteProcessingResult } from './services/api';

function App() {
  const [processedResults, setProcessedResults] = useState<ProcessingResult[]>([]);
  const [selectedResume, setSelectedResume] = useState<ProcessingResult | null>(null);
  const [isLoading] = useState<boolean>(false);

  // Load any existing results from localStorage on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem('resumeClassificationResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults) as ProcessingResult[];
        setProcessedResults(parsedResults);
      } catch (error) {
        console.error('Failed to parse saved results:', error);
      }
    }
  }, []);

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (processedResults.length > 0) {
      localStorage.setItem('resumeClassificationResults', JSON.stringify(processedResults));
    }
  }, [processedResults]);

  // Handler for when a resume upload is complete
  const handleUploadComplete = (result: ProcessingResult) => {
    setProcessedResults(prev => {
      // Avoid duplicates by checking if the ID already exists
      const exists = prev.some(item => item.id === result.id);
      if (exists) return prev;
      return [...prev, result];
    });
  };
  
  // Handler for viewing resume details
  const handleViewDetails = (resume: ProcessingResult) => {
    setSelectedResume(resume);
  };
  
  // Handler for closing the detail viewer
  const handleCloseDetails = () => {
    setSelectedResume(null);
  };

  // Handler for deleting a resume result
  const handleDeleteResult = async (resultId: string) => {
    try {
      try {
        // Call the API to delete the result
        await deleteProcessingResult(resultId);
      } catch (apiError) {
        // If the backend returns 404, the item doesn't exist in backend but might exist in frontend
        // We'll continue with the local deletion anyway
        console.log('Backend deletion failed, proceeding with local deletion only');
      }
      
      // Remove from local state regardless of API success
      setProcessedResults(prev => prev.filter(item => item.id !== resultId));
      
      // If the deleted result was selected, clear the selection
      if (selectedResume && selectedResume.id === resultId) {
        setSelectedResume(null);
      }
      
      // Update localStorage
      const updatedResults = processedResults.filter(item => item.id !== resultId);
      localStorage.setItem('resumeClassificationResults', JSON.stringify(updatedResults));
      
      // Show success message
      alert('Resume deleted successfully');
    } catch (error) {
      console.error('Failed to delete result:', error);
      alert('Failed to delete result. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Resume Classification System</h1>
        <p>Upload PDF resumes to automatically classify them into job categories</p>
      </header>
      
      <main className="app-main">
        <ResumeUpload onUploadComplete={handleUploadComplete} />
        
        {isLoading ? (
          <div className="loading-indicator">
            <p>Loading results...</p>
          </div>
        ) : (
          <ClassificationResults 
            results={processedResults} 
            onViewDetails={handleViewDetails} 
            onDelete={handleDeleteResult}
          />
        )}
        
        {selectedResume && (
          <ResumeDetailViewer 
            resume={selectedResume} 
            onClose={handleCloseDetails} 
          />
        )}
      </main>
      
      <footer className="app-footer">
        <p>Resume Classification System &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
