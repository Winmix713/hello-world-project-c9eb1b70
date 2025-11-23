"""Utility helpers for recording prediction events to disk."""
from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Mapping, Optional, Union

LOG_DIR_ENV = "PREDICTION_LOG_DIR"
DEFAULT_LOG_DIR = Path(__file__).resolve().parent / "logs"


def _resolve_log_path(custom_path: Optional[Union[str, os.PathLike[str]]] = None) -> Path:
    if custom_path:
        return Path(custom_path)
    root = Path(os.environ.get(LOG_DIR_ENV, DEFAULT_LOG_DIR))
    root.mkdir(parents=True, exist_ok=True)
    return root / "prediction_events.csv"


def log_prediction_event(
    *,
    prediction_id: str,
    predicted_result: str,
    probability: float,
    payload: Mapping[str, Any],
    probabilities: Mapping[str, float],
    context: Optional[Mapping[str, Any]] = None,
    log_path: Optional[Union[str, os.PathLike[str]]] = None,
) -> str:
    """Persist the prediction event to a CSV file and return its path."""

    destination = _resolve_log_path(log_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).isoformat()

    safe_context: Dict[str, Any] = {
        "team_a": context.get("team_a") if context else None,
        "team_b": context.get("team_b") if context else None,
    }

    row = {
        "timestamp": timestamp,
        "prediction_id": prediction_id,
        "team_a": safe_context["team_a"],
        "team_b": safe_context["team_b"],
        "predicted_result": predicted_result,
        "probability": float(probability),
        "payload": json.dumps(payload, sort_keys=True),
        "probabilities": json.dumps(probabilities, sort_keys=True),
    }

    fieldnames = list(row.keys())
    write_header = not destination.exists()
    with destination.open("a", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        writer.writerow(row)

    return str(destination)


__all__ = ["log_prediction_event"]
