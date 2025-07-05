import axios from 'axios';

// Add Node.js process type declaration
declare const process: {
  env: {
    NODE_ENV?: string;
    [key: string]: string | undefined;
  }
};

// Use relative URL in production, absolute URL in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:5000/api';

// Types for API responses
export interface UploadResponse {
  file_id: string;
  status: string;
  message: string;
}

export interface UploadStatus {
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  filename: string;
  error?: string;
}

export interface CategoryAlternative {
  category: string;
  confidence: number;
}

export interface ProcessingResult {
  id: string;
  filename: string;
  timestamp: number;
  category: string;
  confidence: number;
  text_preview: string;
  alternatives?: CategoryAlternative[];
  full_text?: string;
}

// Function to upload a resume file
export const uploadResume = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post<UploadResponse>(
      `${API_BASE_URL}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Error uploading file');
    }
    throw error;
  }
};

// Function to check the status of an uploaded file
export const getUploadStatus = async (fileId: string): Promise<UploadStatus> => {
  try {
    const response = await axios.get<UploadStatus>(`${API_BASE_URL}/upload-status/${fileId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Error fetching upload status');
    }
    throw error;
  }
};

// Function to get the processing results for a file
export const getProcessingResult = async (fileId: string): Promise<ProcessingResult> => {
  try {
    const response = await axios.get<ProcessingResult>(`${API_BASE_URL}/results/${fileId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Error fetching results');
    }
    throw error;
  }
};

// Function to delete a processing result
export const deleteProcessingResult = async (fileId: string): Promise<{success: boolean, message: string}> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/results/${fileId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Error deleting processing result');
    }
    throw error;
  }
};
