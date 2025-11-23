#!/usr/bin/env python3
"""
Test script to verify all acceptance criteria for the training pipeline.
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path


def test_requirements_txt():
    """✓ requirements.txt is present and valid."""
    print("Test 1: Checking requirements.txt...")
    
    if not Path('requirements.txt').exists():
        print("  ✗ FAIL: requirements.txt not found")
        return False
    
    with open('requirements.txt', 'r') as f:
        lines = f.readlines()
    
    required_packages = ['PyYAML', 'pandas', 'numpy', 'scikit-learn', 'joblib', 'python-dateutil']
    for pkg in required_packages:
        found = any(pkg in line for line in lines)
        if not found:
            print(f"  ✗ FAIL: {pkg} not in requirements.txt")
            return False
        
        # Check for pinned versions
        pkg_line = [line for line in lines if pkg in line][0]
        if '==' not in pkg_line:
            print(f"  ✗ FAIL: {pkg} is not pinned (no ==)")
            return False
    
    print("  ✓ PASS: requirements.txt is present with pinned versions")
    return True


def test_timestamped_models():
    """✓ Running script creates new, timestamped .pkl files (no overwrite)."""
    print("\nTest 2: Checking timestamped model creation...")
    
    # Get initial model count
    models_dir = Path('models')
    initial_models = list(models_dir.glob('*.pkl'))
    initial_count = len(initial_models)
    
    # Run training
    result = subprocess.run(
        ['python', 'train_model.py', '--random-seed', '999'],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"  ✗ FAIL: Training failed with error:\n{result.stderr}")
        return False
    
    # Check new models
    time.sleep(1)
    new_models = list(models_dir.glob('*.pkl'))
    new_count = len(new_models)
    
    if new_count <= initial_count:
        print(f"  ✗ FAIL: No new model created (before: {initial_count}, after: {new_count})")
        return False
    
    # Check timestamp format
    latest_model = max(new_models, key=lambda p: p.stat().st_mtime)
    if '_202' not in latest_model.name:  # Check for YYYYMMDD format
        print(f"  ✗ FAIL: Model name doesn't contain timestamp: {latest_model.name}")
        return False
    
    print(f"  ✓ PASS: New timestamped model created: {latest_model.name}")
    return True


def test_registry_update():
    """✓ model_registry.json is updated with metrics, UUID, and path."""
    print("\nTest 3: Checking registry update...")
    
    registry_path = Path('models/model_registry.json')
    if not registry_path.exists():
        print("  ✗ FAIL: model_registry.json not found")
        return False
    
    with open(registry_path, 'r') as f:
        registry = json.load(f)
    
    if not isinstance(registry, list) or len(registry) == 0:
        print("  ✗ FAIL: Registry is empty or not a list")
        return False
    
    # Check latest entry
    latest_entry = registry[-1]
    required_fields = ['id', 'timestamp', 'metrics', 'parameters', 'model_path', 'status']
    
    for field in required_fields:
        if field not in latest_entry:
            print(f"  ✗ FAIL: Missing field '{field}' in registry entry")
            return False
    
    # Check UUID format (simple check)
    if len(latest_entry['id']) != 36:
        print(f"  ✗ FAIL: Invalid UUID format: {latest_entry['id']}")
        return False
    
    # Check metrics
    required_metrics = ['accuracy', 'precision', 'recall', 'f1_score']
    for metric in required_metrics:
        if metric not in latest_entry['metrics']:
            print(f"  ✗ FAIL: Missing metric '{metric}'")
            return False
    
    print(f"  ✓ PASS: Registry properly updated with ID {latest_entry['id']}")
    return True


def test_reproducibility():
    """✓ Same random_seed produces identical metrics."""
    print("\nTest 4: Checking reproducibility...")
    
    seed = 12345
    
    # Run 1
    result1 = subprocess.run(
        ['python', 'train_model.py', '--dry-run', '--random-seed', str(seed)],
        capture_output=True,
        text=True
    )
    
    # Run 2
    result2 = subprocess.run(
        ['python', 'train_model.py', '--dry-run', '--random-seed', str(seed)],
        capture_output=True,
        text=True
    )
    
    # Extract metrics from both runs
    def extract_metrics(output):
        metrics = {}
        for line in output.split('\n'):
            if 'Accuracy:' in line:
                metrics['accuracy'] = line.split(':')[1].strip()
            elif 'Precision:' in line:
                metrics['precision'] = line.split(':')[1].strip()
            elif 'Recall:' in line:
                metrics['recall'] = line.split(':')[1].strip()
            elif 'F1-Score:' in line:
                metrics['f1'] = line.split(':')[1].strip()
        return metrics
    
    metrics1 = extract_metrics(result1.stdout)
    metrics2 = extract_metrics(result2.stdout)
    
    if metrics1 != metrics2:
        print(f"  ✗ FAIL: Metrics differ:\n    Run 1: {metrics1}\n    Run 2: {metrics2}")
        return False
    
    print(f"  ✓ PASS: Identical metrics with seed {seed}: {metrics1}")
    return True


def test_dry_run():
    """✓ --dry-run flag outputs metrics but creates no files."""
    print("\nTest 5: Checking --dry-run flag...")
    
    # Count existing models and registry entries
    models_before = list(Path('models').glob('*.pkl'))
    
    with open('models/model_registry.json', 'r') as f:
        registry_before = json.load(f)
    
    entries_before = len(registry_before)
    models_before_count = len(models_before)
    
    # Run with dry-run
    result = subprocess.run(
        ['python', 'train_model.py', '--dry-run', '--random-seed', '54321'],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"  ✗ FAIL: Dry run failed:\n{result.stderr}")
        return False
    
    # Check for metrics in output
    if 'Accuracy:' not in result.stdout:
        print("  ✗ FAIL: No metrics in dry run output")
        return False
    
    # Check dry run message
    if 'DRY RUN MODE' not in result.stdout:
        print("  ✗ FAIL: No dry run mode message")
        return False
    
    # Count models and registry after
    models_after = list(Path('models').glob('*.pkl'))
    
    with open('models/model_registry.json', 'r') as f:
        registry_after = json.load(f)
    
    entries_after = len(registry_after)
    models_after_count = len(models_after)
    
    if models_after_count != models_before_count:
        print(f"  ✗ FAIL: Dry run created models ({models_before_count} -> {models_after_count})")
        return False
    
    if entries_after != entries_before:
        print(f"  ✗ FAIL: Dry run updated registry ({entries_before} -> {entries_after})")
        return False
    
    print("  ✓ PASS: Dry run shows metrics without creating files")
    return True


def test_error_handling():
    """✓ Error handling catches missing CSV columns."""
    print("\nTest 6: Checking error handling for missing columns...")
    
    # Create a CSV with missing columns
    test_csv = '/tmp/test_missing_cols.csv'
    with open(test_csv, 'w') as f:
        f.write("home_goals_avg,fulltime_result\n")
        f.write("2.0,home\n")
    
    result = subprocess.run(
        ['python', 'train_model.py', '--data-path', test_csv],
        capture_output=True,
        text=True
    )
    
    # Should fail with specific error
    if result.returncode == 0:
        print("  ✗ FAIL: Script should have failed on missing columns")
        return False
    
    # Check both stdout and stderr for error message
    output = result.stdout + result.stderr
    if 'Missing required columns' not in output:
        print("  ✗ FAIL: No clear error message for missing columns")
        print(f"Output: {output[:500]}")
        return False
    
    print("  ✓ PASS: Clear error message for missing columns")
    return True


def main():
    print("="*70)
    print("ACCEPTANCE CRITERIA TEST SUITE")
    print("="*70)
    
    tests = [
        test_requirements_txt,
        test_timestamped_models,
        test_registry_update,
        test_reproducibility,
        test_dry_run,
        test_error_handling,
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"  ✗ EXCEPTION: {e}")
            results.append(False)
    
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests passed: {passed}/{total}")
    
    if all(results):
        print("\n🎉 ALL ACCEPTANCE CRITERIA MET! 🎉")
        return 0
    else:
        print("\n❌ Some tests failed. Please review the output above.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
