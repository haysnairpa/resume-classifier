"""
Script to train and save the resume classification model.
This script is based on the notebook code provided by the user.
"""

import pandas as pd
import numpy as np
import re
import nltk
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from sentence_transformers import SentenceTransformer

# Download NLTK resources
nltk.download('stopwords', quiet=True)
from nltk.corpus import stopwords
stop_words = set(stopwords.words('english'))

def clean_text(text):
    """Clean and preprocess text for classification."""
    text = re.sub(r'<[^>]+>', ' ', text)  # HTML
    text = re.sub(r'[^a-zA-Z]', ' ', text)  # symbols/numbers
    text = text.lower()
    tokens = text.split()
    tokens = [w for w in tokens if w not in stop_words and len(w) > 2]
    return ' '.join(tokens)

def train_model(dataset_path):
    """Train the resume classification model and save it to disk."""
    print(f"Loading dataset from: {dataset_path}")
    raw_df = pd.read_csv(dataset_path, on_bad_lines='skip', engine='python', encoding='utf-8')
    
    # Drop non-informative category
    print("Preprocessing data...")
    df = raw_df[raw_df['Category'] != 'Other'].copy()
    
    # Clean all resumes
    df['cleaned_text'] = df['Resume_str'].astype(str).apply(clean_text)
    
    # Label encoding
    label_encoder = LabelEncoder()
    df['label'] = label_encoder.fit_transform(df['Category'])
    
    print(f"Found {len(label_encoder.classes_)} categories: {label_encoder.classes_}")
    
    # Sentence-BERT embedding
    print("Generating embeddings with Sentence-BERT...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    X = model.encode(df['cleaned_text'].tolist(), show_progress_bar=True)
    y = df['label']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    # Train classifier
    print("Training logistic regression classifier...")
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = clf.predict(X_test)
    print("\nClassification Report:\n")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    
    # Save the model
    model_data = {
        'classifier': clf,
        'label_encoder': label_encoder
    }
    
    output_path = os.path.join(os.path.dirname(__file__), 'logreg_model.pkl')
    print(f"Saving model to: {output_path}")
    with open(output_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    print("Model saved successfully!")
    return clf, label_encoder

if __name__ == "__main__":
    # You would need to provide the path to your dataset
    # For example: train_model("path/to/your/Resume.csv")
    print("This script needs the path to your Resume.csv dataset.")
    print("Usage example: python train_model.py")
    print("Note: The model is expected to be already trained and saved at 'logreg_model.pkl'")
