import { useState, useRef, useCallback, useEffect } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { uploadResume, getUploadStatus, getProcessingResult } from '../services/api';
import type { UploadStatus, ProcessingResult } from '../services/api';
import '../styles/ResumeUpload.css';

interface ResumeUploadProps {
  onUploadComplete?: (result: ProcessingResult) => void;
}

const ResumeUpload = ({ onUploadComplete }: ResumeUploadProps) => {
  // Component states
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadStatus>>({});
  const [errors, setErrors] = useState<string[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusCheckIntervalsRef = useRef<Record<string, number>>({});

  // Function to handle file selection via the input
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndSetFiles(selectedFiles);
    }
  };

  // Function to handle drag and drop events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      validateAndSetFiles(droppedFiles);
    }
  };

  // Validation function to check if files are PDFs
  const validateAndSetFiles = (selectedFiles: File[]) => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    
    selectedFiles.forEach((file) => {
      if (file.type === 'application/pdf') {
        validFiles.push(file);
      } else {
        newErrors.push(`"${file.name}" is not a PDF file.`);
      }
    });

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    if (newErrors.length > 0) {
      setErrors((prevErrors) => [...prevErrors, ...newErrors]);
    }
  };

  // Function to remove a file from the queue
  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  // Function to clear all selected files
  const clearFiles = () => {
    setFiles([]);
    setErrors([]);
  };

  // Function to handle upload button click
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setErrors([]);
    
    // Process each file
    for (const file of files) {
      try {
        // Upload the file
        const uploadResponse = await uploadResume(file);
        const fileId = uploadResponse.file_id;
        
        // Initialize progress tracking
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: {
            status: 'uploaded',
            progress: 0,
            filename: file.name
          }
        }));
        
        // Start polling for status updates
        startStatusPolling(fileId);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setErrors(prev => [...prev, `Failed to upload ${file.name}: ${errorMessage}`]);
      }
    }
    
    // Clear the file input and selected files list after upload attempt
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFiles([]);
    setIsUploading(false);
  };

  // Function to poll for status updates
  const startStatusPolling = useCallback((fileId: string) => {
    const interval = window.setInterval(async () => {
      try {
        // Get current upload status
        const status = await getUploadStatus(fileId);
        
        // Update the progress state
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: status
        }));
        
        // If processing is complete, get the result and stop polling
        if (status.status === 'completed') {
          clearInterval(statusCheckIntervalsRef.current[fileId]);
          delete statusCheckIntervalsRef.current[fileId];
          
          // Get the processing result
          const result = await getProcessingResult(fileId);
          
          // Call the onUploadComplete callback if provided
          if (onUploadComplete) {
            onUploadComplete(result);
          }
        }
        
        // If there's an error, stop polling
        if (status.status === 'error') {
          clearInterval(statusCheckIntervalsRef.current[fileId]);
          delete statusCheckIntervalsRef.current[fileId];
          setErrors(prev => [...prev, `Error processing ${status.filename}: ${status.error || 'Unknown error'}`]);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setErrors(prev => [...prev, `Failed to check status for a file: ${errorMessage}`]);
        
        // Stop polling on error
        clearInterval(statusCheckIntervalsRef.current[fileId]);
        delete statusCheckIntervalsRef.current[fileId];
      }
    }, 1000); // Check status every second
    
    // Save the interval ID for cleanup
    statusCheckIntervalsRef.current[fileId] = interval;
  }, [onUploadComplete]);

  // Cleanup intervals using useEffect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup all intervals on component unmount
      Object.values(statusCheckIntervalsRef.current).forEach(clearInterval);
      statusCheckIntervalsRef.current = {};
    };
  }, []);

  // Show upload progress
  const renderProgress = () => {
    return Object.entries(uploadProgress).map(([fileId, status]) => (
      <div key={fileId} className="progress-item">
        <div className="progress-header">
          <span>{status.filename}</span>
          <span>{status.status}</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
        <div className="progress-percentage">{status.progress}%</div>
      </div>
    ));
  };

  return (
    <div className="resume-upload-container">
      <h2>Upload Resumes</h2>
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="drop-zone-content">
          <i className="upload-icon">📁</i>
          <p>Drag and drop PDF files here, or click to select</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple 
            accept=".pdf" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="selected-files">
          <div className="files-header">
            <h3>Selected Files ({files.length})</h3>
            <button 
              className="clear-button" 
              onClick={clearFiles}
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>
          <ul>
            {files.map((file, index) => (
              <li key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <button 
                  className="remove-button"
                  onClick={() => removeFile(file)}
                  disabled={isUploading}
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
          <button 
            className="upload-button" 
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? 'Uploading...' : 'Upload and Process'}
          </button>
        </div>
      )}
      
      {Object.keys(uploadProgress).length > 0 && (
        <div className="upload-progress">
          <h3>Processing Status</h3>
          {renderProgress()}
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="error-messages">
          <h3>Errors</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
