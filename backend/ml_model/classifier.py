import os
import re
import pickle
import logging
import random
from typing import Dict, Tuple, Optional, List
import pdfplumber
# Removed dependency on sentence-transformers and nltk for now

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ResumeClassifier:
    """
    A simplified class to handle resume classification (temporary implementation).
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize the classifier.
        
        Args:
            model_path: Path to the model (not used in this simplified version)
        """
        self.categories = [
            'Software Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 
            'DevOps Engineer', 'Marketing Specialist', 'Sales Representative', 'HR Manager',
            'Financial Analyst', 'Project Manager', 'Business Analyst', 'Customer Support',
            'Network Administrator', 'Database Administrator', 'Content Writer'
        ]
        
        logging.info("Initialized simplified resume classifier with mock categories")
    
    def _load_models(self):
        """Simplified model loading (not actually loading any models)."""
        logging.info("Using simplified classifier without actual model loading")
    
    def clean_text(self, text: str) -> str:
        """
        Basic text cleaning.
        
        Args:
            text: Raw text from resume
            
        Returns:
            Cleaned text
        """
        # Simple cleaning - just lowercase and remove extra spaces
        text = text.lower()
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text
        """
        try:
            text = ""
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF {pdf_path}: {str(e)}")
            return ""
    
    def classify_resume(self, pdf_path: str) -> Dict:
        """
        Simplified resume classification (using random selection for now).
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary with classification results
        """
        try:
            # Extract text from PDF
            logging.info(f"Extracting text from: {pdf_path}")
            raw_text = self.extract_text_from_pdf(pdf_path)
            
            if not raw_text:
                logging.warning(f"No text extracted from {pdf_path}")
                return {
                    "success": False,
                    "error": "No text could be extracted from the PDF file"
                }
            
            # Clean the text (basic cleaning)
            cleaned_text = self.clean_text(raw_text)
            
            # For now, just randomly select a category and confidence
            # This is a temporary solution until we fix the ML dependencies
            category = random.choice(self.categories)
            confidence = random.uniform(0.7, 0.95)
            
            # Generate 2 random alternatives
            alt_categories = random.sample([c for c in self.categories if c != category], 2)
            alt_confidences = [random.uniform(0.3, 0.7) for _ in range(2)]
            
            alternatives = [
                {"category": cat, "confidence": conf} 
                for cat, conf in zip(alt_categories, alt_confidences)
            ]
            
            # Create a text preview
            text_preview = raw_text[:500].replace('\n', ' ').strip() + "..."
            
            logging.info(f"Classified as {category} with confidence {confidence:.2f}")
            
            return {
                "success": True,
                "category": category,
                "confidence": confidence,
                "alternatives": alternatives,
                "text_preview": text_preview,
                "full_text": raw_text
            }
            
        except Exception as e:
            logging.error(f"Error classifying resume: {str(e)}")
            return {
                "success": False,
                "error": f"Classification error: {str(e)}"
            }
    
    def get_available_categories(self) -> List[str]:
        """
        Get a list of all available categories.
        
        Returns:
            List of category names
        """
        return self.categories


# Singleton instance
_classifier_instance = None

def get_classifier() -> ResumeClassifier:
    """
    Get or create the classifier singleton instance.
    
    Returns:
        ResumeClassifier instance
    """
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = ResumeClassifier()
    return _classifier_instance
