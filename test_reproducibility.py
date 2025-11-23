#!/usr/bin/env python3
"""
Test script to verify reproducibility of the training pipeline.
"""

import subprocess
import json
import sys

def run_training(seed):
    """Run training with given seed and return metrics."""
    result = subprocess.run(
        ['python', 'train_model.py', '--dry-run', '--random-seed', str(seed)],
        capture_output=True,
        text=True
    )
    
    # Parse metrics from output
    lines = result.stdout.split('\n')
    metrics = {}
    for line in lines:
        if 'Accuracy:' in line:
            metrics['accuracy'] = float(line.split(':')[1].strip())
        elif 'Precision:' in line:
            metrics['precision'] = float(line.split(':')[1].strip())
        elif 'Recall:' in line:
            metrics['recall'] = float(line.split(':')[1].strip())
        elif 'F1-Score:' in line:
            metrics['f1_score'] = float(line.split(':')[1].strip())
    
    return metrics

def main():
    print("Testing reproducibility of training pipeline...")
    print("-" * 60)
    
    seed = 42
    
    # Run training twice with the same seed
    print(f"Running training with seed {seed} (run 1)...")
    metrics1 = run_training(seed)
    
    print(f"Running training with seed {seed} (run 2)...")
    metrics2 = run_training(seed)
    
    # Compare results
    print("\nResults comparison:")
    print(f"Run 1 metrics: {metrics1}")
    print(f"Run 2 metrics: {metrics2}")
    
    if metrics1 == metrics2:
        print("\n✅ SUCCESS: Metrics are identical - reproducibility verified!")
        return 0
    else:
        print("\n❌ FAILURE: Metrics differ - reproducibility failed!")
        return 1

if __name__ == '__main__':
    sys.exit(main())
