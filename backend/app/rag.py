from typing import Any

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None
_index: faiss.IndexFlatIP | None = None
_scheme_ids: list[str] = []
_schemes_by_id: dict[str, dict[str, Any]] = {}


def _scheme_text(scheme: dict[str, Any]) -> str:
    parts = [
        scheme["name"],
        scheme["category"],
        scheme["description"],
        scheme["benefits"],
    ]
    return " | ".join(parts)


def build_index(schemes: list[dict[str, Any]]) -> None:
    global _model, _index, _scheme_ids, _schemes_by_id
    _model = SentenceTransformer("all-MiniLM-L6-v2")
    _schemes_by_id = {s["id"]: s for s in schemes}
    _scheme_ids = [s["id"] for s in schemes]
    texts = [_scheme_text(s) for s in schemes]
    embeddings = _model.encode(texts, normalize_embeddings=True)
    dim = embeddings.shape[1]
    _index = faiss.IndexFlatIP(dim)
    _index.add(np.array(embeddings, dtype="float32"))


def semantic_search(query: str, top_k: int = 10) -> list[str]:
    if _model is None or _index is None:
        raise RuntimeError("RAG index not built — call build_index() at startup")
    query_vec = _model.encode([query], normalize_embeddings=True)
    scores, indices = _index.search(np.array(query_vec, dtype="float32"), top_k)
    return [_scheme_ids[i] for i in indices[0] if i != -1]
