from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import time
import threading
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from ml_model.classifier import get_classifier

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
ALLOWED_EXTENSIONS = {'pdf'}

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize the classifier
try:
    classifier = get_classifier()
    logger.info(f"Classifier loaded with {len(classifier.get_available_categories())} categories")
except Exception as e:
    logger.error(f"Failed to initialize classifier: {str(e)}")
    # Instead of setting to None, which would cause errors later, let's try again with error handling
    try:
        from ml_model.classifier import ResumeClassifier
        classifier = ResumeClassifier()
        logger.info("Using fallback classifier initialization")
    except Exception as e2:
        logger.error(f"Failed to initialize fallback classifier: {str(e2)}")
        classifier = None

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# In-memory storage for processing status and results
upload_status = {}
processing_results = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_resume(file_id, file_path, original_filename):
    """Process a resume file in a background thread using the ML model."""
    try:
        # Update status to processing
        upload_status[file_id]['status'] = 'processing'
        upload_status[file_id]['progress'] = 0
        
        # Check if classifier is available
        if classifier is None:
            raise Exception("ML classifier is not initialized")
        
        # Start processing - text extraction (30%)
        upload_status[file_id]['progress'] = 10
        logger.info(f"Processing resume: {original_filename} (ID: {file_id})")
        
        # Classify the resume
        upload_status[file_id]['progress'] = 30
        result = classifier.classify_resume(file_path)
        
        if not result['success']:
            raise Exception(result.get('error', 'Unknown classification error'))
        
        # Update progress as we process
        upload_status[file_id]['progress'] = 70
        
        # Extract the results
        category = result['category']
        confidence = result['confidence']
        text_preview = result['text_preview']
        
        # Store alternatives if available
        alternatives = result.get('alternatives', [])
        
        # Update status to completed
        upload_status[file_id]['status'] = 'completed'
        upload_status[file_id]['progress'] = 100
        
        # Store the result
        processing_results[file_id] = {
            'id': file_id,
            'filename': original_filename,
            'category': category,
            'confidence': confidence,
            'text_preview': text_preview,
            'alternatives': alternatives,
            'timestamp': int(time.time())
        }
        
        logger.info(f"Resume {file_id} classified as {category} with confidence {confidence:.2f}")
        
    except Exception as e:
        logger.error(f"Error processing resume {file_id}: {str(e)}")
        # Update status to error
        upload_status[file_id]['status'] = 'error'
        upload_status[file_id]['error'] = str(e)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed. Please upload a PDF file.'}), 400
    
    # Generate a unique ID for this upload
    file_id = str(uuid.uuid4())
    
    # Secure the filename
    filename = secure_filename(file.filename)
    
    # Create a unique filename to avoid collisions
    unique_filename = f"{file_id}_{filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    
    # Save the file
    file.save(file_path)
    
    # Initialize the status for this file
    upload_status[file_id] = {
        'status': 'uploaded',
        'progress': 0,
        'filename': filename
    }
    
    # Start processing in a background thread
    thread = threading.Thread(target=process_resume, args=(file_id, file_path, filename))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'file_id': file_id,
        'filename': filename,
        'status': 'uploaded',
        'message': 'File uploaded successfully and processing started'
    }), 200

@app.route('/api/upload-status/<file_id>', methods=['GET'])
def get_upload_status(file_id):
    if file_id in upload_status:
        return jsonify(upload_status[file_id]), 200
    return jsonify({'error': 'File ID not found'}), 404

@app.route('/api/results/<file_id>', methods=['GET'])
def get_result(file_id):
    if file_id in processing_results:
        return jsonify(processing_results[file_id]), 200
    return jsonify({'error': 'Result not found'}), 404

@app.route('/api/results/<file_id>', methods=['DELETE'])
def delete_result(file_id):
    if file_id in processing_results:
        # Remove from processing results
        del processing_results[file_id]
        # Also remove from upload status if present
        if file_id in upload_status:
            del upload_status[file_id]
        return jsonify({'success': True, 'message': 'Result deleted successfully'}), 200
    return jsonify({'error': 'Result not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
