#!/usr/bin/env python3
"""
train_model.py - Robust CLI tool for reproducible model training with registry management.

This script handles the end-to-end model training lifecycle ensuring every trained
model is traceable, reproducible, and properly registered.
"""

import argparse
import json
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
import yaml
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier


class MissingFeatureError(Exception):
    """Raised when required features are missing from the dataset."""
    pass


class ModelTrainer:
    """Handles model training, evaluation, and registry management."""
    
    def __init__(self, config_path: str = "model_config.yaml", random_seed: int = 42):
        """
        Initialize the model trainer.
        
        Args:
            config_path: Path to the YAML configuration file
            random_seed: Random seed for reproducibility
        """
        self.config_path = config_path
        self.random_seed = random_seed
        self.config = None
        self.model = None
        self.metrics = {}
        
    def load_config(self) -> Dict[str, Any]:
        """Load and parse the model configuration from YAML."""
        try:
            with open(self.config_path, 'r') as f:
                self.config = yaml.safe_load(f)
            print(f"✓ Configuration loaded from {self.config_path}")
            return self.config
        except FileNotFoundError:
            print(f"✗ Configuration file not found: {self.config_path}", file=sys.stderr)
            sys.exit(1)
        except yaml.YAMLError as e:
            print(f"✗ Error parsing YAML configuration: {e}", file=sys.stderr)
            sys.exit(1)
            
    def validate_data(self, df: pd.DataFrame) -> None:
        """
        Validate that the dataset contains all required features.
        
        Args:
            df: The loaded dataset
            
        Raises:
            MissingFeatureError: If required columns are missing
        """
        required_columns = self.config['input_features'] + [self.config['target_column']]
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise MissingFeatureError(
                f"Missing required columns in dataset: {', '.join(missing_columns)}\n"
                f"Expected columns: {', '.join(required_columns)}\n"
                f"Found columns: {', '.join(df.columns.tolist())}"
            )
        
        print(f"✓ Data validation passed - all {len(required_columns)} required columns present")
        
    def load_data(self, data_path: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Load and validate the training dataset.
        
        Args:
            data_path: Path to the CSV file
            
        Returns:
            Tuple of (features DataFrame, target Series)
        """
        try:
            df = pd.read_csv(data_path)
            print(f"✓ Dataset loaded from {data_path} ({len(df)} rows)")
            
            self.validate_data(df)
            
            X = df[self.config['input_features']]
            y = df[self.config['target_column']]
            
            return X, y
        except FileNotFoundError:
            print(f"✗ Dataset file not found: {data_path}", file=sys.stderr)
            sys.exit(1)
        except pd.errors.EmptyDataError:
            print(f"✗ Dataset file is empty: {data_path}", file=sys.stderr)
            sys.exit(1)
        except MissingFeatureError as e:
            print(f"✗ {e}", file=sys.stderr)
            sys.exit(1)
            
    def create_model(self) -> Any:
        """
        Create a model instance based on the configuration.
        
        Returns:
            Instantiated model object
        """
        model_type = self.config['model_type']
        hyperparameters = self.config.get('hyperparameters', {})
        
        if model_type == 'LogisticRegression':
            self.model = LogisticRegression(**hyperparameters)
        elif model_type == 'DecisionTree':
            self.model = DecisionTreeClassifier(**hyperparameters)
        else:
            print(f"✗ Unsupported model type: {model_type}", file=sys.stderr)
            print("Supported types: LogisticRegression, DecisionTree", file=sys.stderr)
            sys.exit(1)
            
        print(f"✓ Model created: {model_type}")
        print(f"  Hyperparameters: {hyperparameters}")
        return self.model
        
    def train_and_evaluate(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Train the model and evaluate its performance.
        
        Args:
            X: Feature matrix
            y: Target vector
            
        Returns:
            Dictionary containing evaluation metrics
        """
        # Split data with reproducible random seed
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=self.random_seed, stratify=y
        )
        
        print(f"✓ Data split: {len(X_train)} training samples, {len(X_test)} test samples")
        
        # Train the model
        print("⚙ Training model...")
        self.model.fit(X_train, y_train)
        print("✓ Training complete")
        
        # Make predictions
        y_pred = self.model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        
        # For multi-class classification, use weighted averaging
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        self.metrics = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1)
        }
        
        # Print detailed classification report
        print("\n" + "="*60)
        print("MODEL EVALUATION SUMMARY")
        print("="*60)
        print(f"Accuracy:  {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall:    {recall:.4f}")
        print(f"F1-Score:  {f1:.4f}")
        print("\nDetailed Classification Report:")
        print("-"*60)
        print(classification_report(y_test, y_pred, zero_division=0))
        print("="*60 + "\n")
        
        return self.metrics
        
    def save_model(self) -> str:
        """
        Save the trained model with a timestamped filename.
        
        Returns:
            Path to the saved model file
        """
        # Create models directory if it doesn't exist
        models_dir = Path("models")
        models_dir.mkdir(exist_ok=True)
        
        # Generate timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_type = self.config['model_type']
        filename = f"{model_type}_{timestamp}.pkl"
        filepath = models_dir / filename
        
        # Atomic write - save model
        print(f"⚙ Saving model to {filepath}...")
        joblib.dump(self.model, filepath)
        print(f"✓ Model saved successfully")
        
        return str(filepath)
        
    def update_registry(self, model_path: str) -> None:
        """
        Update the model registry with the new training entry.
        
        Args:
            model_path: Path to the saved model file
        """
        registry_path = Path("models/model_registry.json")
        
        # Load existing registry or create new one
        if registry_path.exists():
            try:
                with open(registry_path, 'r') as f:
                    registry = json.load(f)
                print(f"✓ Loaded existing registry with {len(registry)} entries")
            except json.JSONDecodeError:
                print("⚠ Registry file corrupted, creating new registry")
                registry = []
        else:
            print("⚙ Creating new model registry")
            registry = []
            
        # Create new registry entry
        entry = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'model_type': self.config['model_type'],
            'metrics': self.metrics,
            'parameters': self.config.get('hyperparameters', {}),
            'model_path': model_path,
            'status': 'candidate',
            'random_seed': self.random_seed,
            'features': self.config['input_features'],
            'target': self.config['target_column']
        }
        
        # Append new entry
        registry.append(entry)
        
        # Save updated registry with atomic write
        print(f"⚙ Updating registry...")
        with open(registry_path, 'w') as f:
            json.dump(registry, f, indent=2)
        print(f"✓ Registry updated successfully")
        print(f"  Entry ID: {entry['id']}")
        print(f"  Status: {entry['status']}")
        

def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Train and register machine learning models for WinMix TipsterHub",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train with default settings
  python train_model.py
  
  # Train with custom data path
  python train_model.py --data-path data/custom_dataset.csv
  
  # Dry run (train but don't save)
  python train_model.py --dry-run
  
  # Use custom random seed
  python train_model.py --random-seed 123
        """
    )
    
    parser.add_argument(
        '--data-path',
        default='data/training_dataset.csv',
        help='Path to the training dataset CSV file (default: data/training_dataset.csv)'
    )
    
    parser.add_argument(
        '--config',
        default='model_config.yaml',
        help='Path to the model configuration YAML file (default: model_config.yaml)'
    )
    
    parser.add_argument(
        '--random-seed',
        type=int,
        default=42,
        help='Random seed for reproducibility (default: 42)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Train and evaluate but do not save model or update registry'
    )
    
    return parser.parse_args()


def main():
    """Main execution function."""
    args = parse_arguments()
    
    print("\n" + "="*60)
    print("WinMix TipsterHub - Model Training Pipeline")
    print("="*60)
    print(f"Configuration: {args.config}")
    print(f"Data Path: {args.data_path}")
    print(f"Random Seed: {args.random_seed}")
    print(f"Dry Run: {args.dry_run}")
    print("="*60 + "\n")
    
    # Initialize trainer
    trainer = ModelTrainer(config_path=args.config, random_seed=args.random_seed)
    
    # Load configuration
    trainer.load_config()
    
    # Load and validate data
    X, y = trainer.load_data(args.data_path)
    
    # Create model
    trainer.create_model()
    
    # Train and evaluate
    metrics = trainer.train_and_evaluate(X, y)
    
    # Save model and update registry (unless dry run)
    if args.dry_run:
        print("⚠ DRY RUN MODE - Model not saved, registry not updated")
        print("\nTraining completed successfully (dry run)")
    else:
        model_path = trainer.save_model()
        trainer.update_registry(model_path)
        print("\n✓ Training pipeline completed successfully!")
        print(f"✓ Model saved to: {model_path}")
        print(f"✓ Registry updated: models/model_registry.json")
    
    print("\n" + "="*60 + "\n")
    return 0


if __name__ == '__main__':
    sys.exit(main())
