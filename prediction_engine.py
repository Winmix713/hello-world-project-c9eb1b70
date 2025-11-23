"""Prediction engine utilities for WinMix TipsterHub.

This module provides a lightweight bridge between the serialized machine
learning model stored on disk and whichever surface (CLI, HTTP server,
worker) is asking for scoreline probabilities.

Key responsibilities implemented here:
- Registry-driven model lookup with singleton caching so that the heavy
  pickle file is hydrated exactly once per process.
- Strict feature validation based on ``model_config.yaml`` ensuring the
  incoming payload matches the training schema.
- Probabilistic inference helpers that normalize the model output and
  provide deterministic ordering for downstream consumers.
- CLI harness (``python prediction_engine.py``) for quick manual
  predictions and shell scripting integrations.
"""
from __future__ import annotations

import argparse
import json
import logging
import math
import os
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List, Mapping, MutableMapping, Optional, Sequence, Tuple, Union

try:  # pragma: no cover - exercised indirectly via fallback
    import yaml  # type: ignore
except Exception:  # pragma: no cover - PyYAML might not be installed
    yaml = None  # type: ignore

try:  # pragma: no cover - exercised indirectly via fallback
    import joblib  # type: ignore
except Exception:  # pragma: no cover - ensure environments without joblib still work
    import pickle

    class _JoblibFallback:
        """Very small subset of joblib's API implemented with pickle."""

        @staticmethod
        def load(path: Union[str, Path]) -> Any:
            with open(path, "rb") as handle:
                return pickle.load(handle)

    joblib = _JoblibFallback()  # type: ignore

try:  # pragma: no cover - optional dependency
    from ml_logging import log_prediction_event as _external_log_prediction_event  # type: ignore
except Exception:  # pragma: no cover - logging is optional
    _external_log_prediction_event = None

LOGGER = logging.getLogger("prediction_engine")
if not LOGGER.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    LOGGER.addHandler(handler)
LOGGER.setLevel(logging.INFO)

ENV_BASE_DIR = "PREDICTION_ENGINE_BASE_DIR"
CONFIG_FILENAME = "model_config.yaml"
REGISTRY_FILENAME = "model_registry.json"
DEFAULT_OTHER_LABEL = "Other"

BASE_DIR = Path(os.environ.get(ENV_BASE_DIR, Path(__file__).resolve().parent))
MODELS_DIR = BASE_DIR / "models"
CONFIG_PATH = BASE_DIR / CONFIG_FILENAME
REGISTRY_PATH = MODELS_DIR / REGISTRY_FILENAME

_MODEL_INSTANCE: Optional[Any] = None
_MODEL_METADATA: Optional[Dict[str, Any]] = None
_MODEL_CONFIG: Optional[Dict[str, Any]] = None


class PredictionEngineError(RuntimeError):
    """Domain specific error for unexpected prediction issues."""


def _read_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Required file not found: {path}")
    return path.read_text(encoding="utf-8")


def _load_model_config() -> Dict[str, Any]:
    global _MODEL_CONFIG
    if _MODEL_CONFIG is not None:
        return _MODEL_CONFIG

    raw = _read_text(CONFIG_PATH)
    data: Dict[str, Any]
    if yaml is not None:
        data = yaml.safe_load(raw)  # type: ignore[assignment]
    else:
        data = json.loads(raw)

    if not isinstance(data, Mapping):
        raise ValueError("model_config.yaml must contain a dictionary")

    features = data.get("input_features")
    if not isinstance(features, list) or not all(isinstance(item, str) for item in features):
        raise ValueError("model_config.yaml is missing a valid 'input_features' list")

    scorelines = data.get("scoreline_classes")
    if scorelines is not None:
        if not isinstance(scorelines, list) or not all(isinstance(item, str) for item in scorelines):
            raise ValueError("'scoreline_classes' must be a list of strings when provided")

    _MODEL_CONFIG = {
        "input_features": features,
        "scoreline_classes": scorelines or [],
    }
    return _MODEL_CONFIG


def _read_model_registry() -> Dict[str, Any]:
    raw = _read_text(REGISTRY_PATH)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:  # pragma: no cover - guard rails
        raise ValueError("model_registry.json contains invalid JSON") from exc
    if not isinstance(data, Mapping):
        raise ValueError("model_registry.json must contain a dictionary")
    return data


def _select_active_model(registry: Mapping[str, Any]) -> Dict[str, Any]:
    models = registry.get("models")
    if not isinstance(models, list):
        raise ValueError("model_registry.json is missing the 'models' list")

    for model in models:
        if isinstance(model, Mapping) and model.get("status") == "active":
            return dict(model)

    raise ValueError("No active model found in model_registry.json")


def _resolve_model_path(entry: Mapping[str, Any]) -> Path:
    raw_path = entry.get("path")
    if not isinstance(raw_path, str) or not raw_path.strip():
        raise ValueError("Active model entry is missing a valid 'path'")
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = BASE_DIR / candidate
    return candidate


def _load_model() -> Tuple[Any, Dict[str, Any]]:
    global _MODEL_INSTANCE, _MODEL_METADATA
    if _MODEL_INSTANCE is not None and _MODEL_METADATA is not None:
        return _MODEL_INSTANCE, _MODEL_METADATA

    registry = _read_model_registry()
    active_entry = _select_active_model(registry)
    model_path = _resolve_model_path(active_entry)
    if not model_path.exists():
        raise FileNotFoundError(f"Serialized model not found at {model_path}")

    LOGGER.info("Loading model from %s", model_path)
    model = joblib.load(model_path)
    metadata = {
        "name": active_entry.get("name", "unknown"),
        "version": active_entry.get("version", "unknown"),
        "path": str(model_path),
    }
    _MODEL_INSTANCE = model
    _MODEL_METADATA = metadata
    return model, metadata


def _get_required_features() -> List[str]:
    config = _load_model_config()
    return list(config["input_features"])


def _get_scoreline_order() -> List[str]:
    config = _load_model_config()
    scorelines = config.get("scoreline_classes") or []
    return list(scorelines)


def _softmax(values: Sequence[float]) -> List[float]:
    if not values:
        return []
    max_value = max(values)
    exp_values = [math.exp(value - max_value) for value in values]
    total = sum(exp_values)
    if total == 0:
        return [1.0 / len(values)] * len(values)
    return [value / total for value in exp_values]


def _normalize_probabilities(raw: Sequence[float]) -> List[float]:
    if not raw:
        return []
    raw = [float(item) for item in raw]
    should_keep = (
        all(item >= 0 for item in raw)
        and abs(sum(raw) - 1.0) <= 1e-6
    )
    probabilities = list(raw if should_keep else _softmax(raw))
    total = sum(probabilities)
    if total == 0:
        probabilities = [1.0 / len(probabilities)] * len(probabilities)
        total = 1.0
    if len(probabilities) == 1:
        probabilities[0] = 1.0
        return probabilities
    difference = 1.0 - total
    probabilities[-1] += difference
    return probabilities


def _coerce_numeric(value: Any, feature_name: str) -> float:
    if isinstance(value, bool):  # bool is subclass of int, treat as error for clarity
        raise ValueError(f"Feature '{feature_name}' cannot be a boolean")
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str) and value.strip():
        try:
            return float(value)
        except ValueError as exc:
            raise ValueError(f"Feature '{feature_name}' must be numeric") from exc
    raise ValueError(f"Feature '{feature_name}' must be numeric")


def _extract_feature_vector(payload: Mapping[str, Any], ordered_features: Sequence[str]) -> List[float]:
    feature_vector: List[float] = []
    for feature in ordered_features:
        feature_vector.append(_coerce_numeric(payload[feature], feature))
    return feature_vector


def _validate_payload(payload: Mapping[str, Any], required_features: Sequence[str]) -> None:
    missing = [feature for feature in required_features if feature not in payload]
    extras = [key for key in payload.keys() if key not in required_features]
    if missing or extras:
        details: List[str] = []
        if missing:
            details.append(f"missing features: {', '.join(sorted(missing))}")
        if extras:
            details.append(f"unexpected features: {', '.join(sorted(extras))}")
        raise ValueError("Invalid payload – " + "; ".join(details))


def _get_model_classes(model: Any, num_scores: int) -> List[str]:
    attr = getattr(model, "classes_", None)
    if attr is None:
        attr = getattr(model, "classes", None)
    if attr is None:
        return [f"class_{idx}" for idx in range(num_scores)]
    classes = list(attr)
    if len(classes) < num_scores:
        classes.extend(f"class_{idx}" for idx in range(len(classes), num_scores))
    elif len(classes) > num_scores:
        classes = classes[:num_scores]
    return classes


def _predict_raw_scores(model: Any, feature_vector: Sequence[float]) -> Tuple[List[float], List[str]]:
    if hasattr(model, "predict_proba"):
        scores = model.predict_proba([feature_vector])  # type: ignore[arg-type]
        if isinstance(scores, Sequence):
            first_item = scores[0]
            if isinstance(first_item, Sequence):
                scores_row = list(first_item)
            else:
                scores_row = list(scores)
        else:
            scores_row = list(scores)
        if not scores_row:
            raise PredictionEngineError("Model returned no probability values")
        scores_row = [float(value) for value in scores_row]
        classes = _get_model_classes(model, len(scores_row))
        return scores_row, classes

    if hasattr(model, "predict"):
        prediction = model.predict([feature_vector])[0]  # type: ignore[arg-type]
        classes = list(getattr(model, "classes_", []))
        if prediction not in classes:
            classes.append(prediction)
        scores = [1.0 if class_label == prediction else 0.0 for class_label in classes]
        return scores, classes

    raise PredictionEngineError("Model must provide predict_proba or predict")


def _rebucket_probabilities(
    probabilities: Sequence[float],
    model_classes: Sequence[str],
    preferred_order: Optional[Sequence[str]] = None,
) -> Dict[str, float]:
    if len(model_classes) < len(probabilities):
        model_classes = list(model_classes) + [f"class_{idx}" for idx in range(len(model_classes), len(probabilities))]

    bucketed: MutableMapping[str, float] = {}
    allowed = list(preferred_order) if preferred_order else list(model_classes)
    allowed_set = set(allowed)

    for label, probability in zip(model_classes, probabilities):
        target_label = label
        if preferred_order and label not in allowed_set:
            target_label = DEFAULT_OTHER_LABEL
        bucketed[target_label] = bucketed.get(target_label, 0.0) + probability

    if DEFAULT_OTHER_LABEL in bucketed and preferred_order and DEFAULT_OTHER_LABEL not in allowed_set:
        allowed.append(DEFAULT_OTHER_LABEL)
        allowed_set.add(DEFAULT_OTHER_LABEL)

    ordered: Dict[str, float] = {}
    for label in allowed:
        if label in bucketed:
            ordered[label] = bucketed[label]
    for label, probability in bucketed.items():
        if label not in ordered:
            ordered[label] = probability

    total = sum(ordered.values())
    if ordered and abs(total - 1.0) > 1e-6:
        last_key = list(ordered.keys())[-1]
        ordered[last_key] += 1.0 - total
    return ordered


def _log_prediction(
    prediction_id: str,
    predicted_result: str,
    confidence: float,
    payload: Mapping[str, Any],
    probabilities: Mapping[str, float],
    context: Optional[Mapping[str, Any]] = None,
) -> None:
    if _external_log_prediction_event is None:
        return
    try:
        _external_log_prediction_event(
            prediction_id=prediction_id,
            predicted_result=predicted_result,
            probability=confidence,
            payload=dict(payload),
            probabilities=dict(probabilities),
            context=dict(context or {}),
        )
    except Exception as exc:  # pragma: no cover - defensive guard
        LOGGER.warning("Failed to log prediction event: %s", exc)


def predict_scorelines(payload: Dict[str, Any], *, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Run the configured model against the provided payload."""

    if not isinstance(payload, Mapping):
        raise ValueError("Payload must be a dictionary")

    required_features = _get_required_features()
    _validate_payload(payload, required_features)
    feature_vector = _extract_feature_vector(payload, required_features)
    model, metadata = _load_model()
    raw_scores, model_classes = _predict_raw_scores(model, feature_vector)
    probabilities = _normalize_probabilities(raw_scores)
    preferred_order = _get_scoreline_order() or model_classes
    probability_map = _rebucket_probabilities(probabilities, model_classes, preferred_order)

    prediction_id = str(uuid.uuid4())
    predicted_result, confidence = max(probability_map.items(), key=lambda item: item[1])

    response: Dict[str, Any] = {
        "prediction_id": prediction_id,
        "model": metadata,
        "ordered_features": required_features,
        "feature_vector": feature_vector,
        "probabilities": probability_map,
        "predicted_result": predicted_result,
        "confidence": confidence,
    }
    if context:
        response["context"] = context

    _log_prediction(prediction_id, predicted_result, confidence, payload, probability_map, context=context)
    return response


def _parse_cli_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Predict football scorelines using the registered model")
    parser.add_argument("--team-a", required=True, help="Home team name")
    parser.add_argument("--team-b", required=True, help="Away team name")
    parser.add_argument("--features-json", required=True, help="JSON string with the required model features")
    parser.add_argument(
        "--indent",
        type=int,
        default=None,
        help="Optional indentation level for the JSON output",
    )
    return parser.parse_args(argv)


def _cli(argv: Optional[Sequence[str]] = None) -> int:
    args = _parse_cli_args(argv)
    try:
        payload = json.loads(args.features_json)
        if not isinstance(payload, dict):
            raise ValueError("features-json must decode to a JSON object")
    except json.JSONDecodeError as exc:
        print(f"Invalid --features-json payload: {exc}", file=sys.stderr)
        return 1
    except ValueError as exc:
        print(f"Invalid --features-json payload: {exc}", file=sys.stderr)
        return 1

    try:
        result = predict_scorelines(payload, context={"team_a": args.team_a, "team_b": args.team_b})
    except ValueError as exc:
        print(f"Validation error: {exc}", file=sys.stderr)
        return 1
    except FileNotFoundError as exc:
        print(f"System error: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:  # pragma: no cover - CLI guard rails
        LOGGER.exception("Unexpected error while running the prediction CLI")
        print(f"System error: {exc}", file=sys.stderr)
        return 2

    indent = args.indent if args.indent is not None else (2 if sys.stdout.isatty() else None)
    print(json.dumps(result, indent=indent))
    return 0


def _reset_prediction_engine_state() -> None:  # pragma: no cover - used in tests
    global _MODEL_INSTANCE, _MODEL_METADATA, _MODEL_CONFIG
    _MODEL_INSTANCE = None
    _MODEL_METADATA = None
    _MODEL_CONFIG = None


if __name__ == "__main__":
    sys.exit(_cli())
