"""
ShelfBridge Deterministic Product Identity & Technical Compatibility Engine.
Implements layered product resolution:
1. Exact barcode/SKU/model identification.
2. Electrical & technical rule evaluation (Wattage, Connectors, Protocols like PD/PPS).
3. BM25 lexical ranking for noisy shopkeeper customer queries.
4. Categorization into EXACT_MATCH, COMPATIBLE_ALTERNATIVE, POTENTIAL_REQUIRES_CONFIRMATION, INCOMPATIBLE.
"""

import re
import math
from typing import List, Dict, Any, Tuple, Optional
from rank_bm25 import BM25Okapi


def normalize_text(text: str) -> str:
    """Standardize punctuation, spacing, and lowercase."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[\-_/\\,]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_query_specs(query: str) -> Dict[str, Any]:
    """
    Extract technical electrical attributes from unstructured merchant/customer queries.
    Never relies solely on naive text similarity.
    """
    specs: Dict[str, Any] = {
        "raw_query": query,
        "wattage": None,
        "connector_type": None,
        "standards": [],
        "brand_hint": None,
        "category_hint": None,
        "cable_length_m": None,
        "capacity_mah": None
    }
    q = query.lower()

    # 1. Wattage extraction (e.g. 25w, 65 watt, 100 w)
    watt_match = re.search(r"(\d{2,3})\s*(?:w|watt|watts)\b", q)
    if watt_match:
        specs["wattage"] = int(watt_match.group(1))

    # 2. Capacity extraction (e.g. 10000mah, 20000 mah)
    mah_match = re.search(r"(\d{4,5})\s*(?:mah)\b", q)
    if mah_match:
        specs["capacity_mah"] = int(mah_match.group(1))

    # 3. Cable length extraction (e.g. 1m, 2 meter, 1.5m)
    len_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:m|meter|metre)\b", q)
    if len_match:
        specs["cable_length_m"] = float(len_match.group(1))

    # 4. Connector types
    if "type c to type c" in q or "c to c" in q or "type-c to type-c" in q:
        specs["connector_type"] = "TYPE_C_TO_TYPE_C"
    elif "type a to type c" in q or "a to c" in q or "usb a to type c" in q:
        specs["connector_type"] = "TYPE_A_TO_TYPE_C"
    elif "type c to lightning" in q or "c to lightning" in q:
        specs["connector_type"] = "TYPE_C_TO_LIGHTNING"
    elif "lightning" in q:
        specs["connector_type"] = "LIGHTNING"
    elif "type-c" in q or "type c" in q or "usb-c" in q or "usbc" in q:
        specs["connector_type"] = "TYPE_C"
    elif "micro usb" in q or "micro-usb" in q:
        specs["connector_type"] = "MICRO_USB"

    # 5. Standards (PD, PPS, Quick Charge)
    if "pps" in q:
        specs["standards"].append("PPS")
    if "pd" in q or "power delivery" in q:
        specs["standards"].append("PD")
    if "qc" in q or "quick charge" in q or "quickcharge" in q:
        specs["standards"].append("QC")
    if "super fast" in q or "superfast" in q:
        specs["standards"].extend(["PD", "PPS"])

    # 6. Brand hints
    known_brands = ["samsung", "apple", "anker", "boat", "mi", "xiaomi", "realme", "oneplus", "portronics", "ambrane", "ptron"]
    for b in known_brands:
        if b in q:
            specs["brand_hint"] = b
            break

    # 7. Category hint
    if any(k in q for k in ["charger", "adapter", "power adapter", "wall charger"]):
        specs["category_hint"] = "CHARGERS"
    elif any(k in q for k in ["cable", "lead", "wire", "cord"]):
        specs["category_hint"] = "CABLES"
    elif any(k in q for k in ["power bank", "powerbank", "battery pack"]):
        specs["category_hint"] = "POWER_BANKS"
    elif any(k in q for k in ["earphone", "headphone", "tws", "earbuds", "buds", "airpods"]):
        specs["category_hint"] = "AUDIO"

    return specs


def evaluate_product_match(
    requested_specs: Dict[str, Any],
    product_obj: Any,
    exact_product_id: Optional[str] = None
) -> Tuple[str, float, List[str], List[str]]:
    """
    Evaluates whether a candidate product matches the customer request.
    Returns:
        (match_type, confidence_score, reasons, incompatible_reasons)
    """
    reasons: List[str] = []
    incompatible_reasons: List[str] = []

    prod_attrs = product_obj.attributes_json or {}
    prod_category = product_obj.category
    prod_brand = product_obj.brand.lower()
    prod_name = product_obj.model_name.lower()
    req_query = requested_specs.get("raw_query", "").lower()

    # 1. Exact Product Identity Check
    if exact_product_id and product_obj.id == exact_product_id:
        return (
            "EXACT_MATCH",
            0.99,
            [f"Exact catalogue match for {product_obj.brand} {product_obj.model_name} (SKU: {product_obj.sku})"],
            []
        )

    # 1b. Check Model Number / SKU in query
    if product_obj.model_number and product_obj.model_number.lower() in req_query:
        return (
            "EXACT_MATCH",
            0.98,
            [f"Direct model number match: {product_obj.model_number} in customer query"],
            []
        )

    # 2. Strict Category Gate
    req_cat = requested_specs.get("category_hint")
    if req_cat and req_cat != prod_category:
        return (
            "INCOMPATIBLE",
            0.10,
            [],
            [f"Category mismatch: Customer requested {req_cat}, but product is {prod_category}"]
        )

    # 3. Category-Specific Electrical & Technical Rules
    confidence = 0.50

    if prod_category == "CHARGERS":
        prod_wattage = prod_attrs.get("wattage", 0)
        req_wattage = requested_specs.get("wattage")
        prod_port = prod_attrs.get("port_type", "")
        prod_standards = [s.upper() for s in prod_attrs.get("standards", [])]

        # Wattage verification: Distinguish performance deficit from technical/electrical incompatibility
        if req_wattage:
            if prod_wattage < req_wattage:
                incompatible_reasons.append(
                    f"Wattage deficit: {prod_wattage}W output does not meet the customer's {req_wattage}W performance target (insufficient charging rate, though electrically safe under USB-PD negotiation)"
                )
            elif prod_wattage == req_wattage:
                reasons.append(f"Identical output wattage: {prod_wattage}W")
                confidence += 0.25
            elif prod_wattage > req_wattage:
                reasons.append(f"Higher output wattage: {prod_wattage}W (backward compatible with {req_wattage}W request)")
                confidence += 0.20

        # Port type & connector verification
        req_conn = requested_specs.get("connector_type")
        if req_conn in ["TYPE_C", "TYPE_C_TO_TYPE_C"]:
            if "Type-C" not in prod_port and "USB-C" not in prod_port:
                incompatible_reasons.append(
                    f"Port mismatch: Customer requires USB-C port, but adapter only provides {prod_port}"
                )
            else:
                reasons.append(f"Matching port type: {prod_port}")
                confidence += 0.15

        # Standards verification (PPS, PD)
        req_stds = requested_specs.get("standards", [])
        for std in req_stds:
            if std in prod_standards:
                reasons.append(f"Supported charging standard: {std}")
                confidence += 0.10

        # Brand comparison
        req_brand = requested_specs.get("brand_hint")
        if req_brand and req_brand in prod_brand:
            reasons.append(f"Matching brand: {product_obj.brand}")
            confidence += 0.15
        elif req_brand:
            reasons.append(f"Different brand ({product_obj.brand}), but technically compatible")

    elif prod_category == "CABLES":
        prod_conn_from = prod_attrs.get("connector_from", "")
        prod_conn_to = prod_attrs.get("connector_to", "")
        prod_wattage = prod_attrs.get("cable_wattage_rating", 60)
        req_conn = requested_specs.get("connector_type")
        req_wattage = requested_specs.get("wattage")

        if req_conn == "TYPE_C_TO_TYPE_C":
            if prod_conn_from != "USB-C" or prod_conn_to != "USB-C":
                incompatible_reasons.append(
                    f"Connector mismatch: Requires Type-C to Type-C, but cable is {prod_conn_from} to {prod_conn_to}"
                )
            else:
                reasons.append("Exact connector match: USB-C to USB-C")
                confidence += 0.30
        elif req_conn == "TYPE_A_TO_TYPE_C":
            if prod_conn_from != "USB-A" or prod_conn_to != "USB-C":
                incompatible_reasons.append(
                    f"Connector mismatch: Requires USB-A to Type-C, but cable is {prod_conn_from} to {prod_conn_to}"
                )
            else:
                reasons.append("Exact connector match: USB-A to USB-C")
                confidence += 0.30

        if req_wattage and req_wattage > prod_wattage:
            incompatible_reasons.append(
                f"Cable rating limitation: Cable rated for {prod_wattage}W, throttles customer's {req_wattage}W requirement"
            )
        elif req_wattage:
            reasons.append(f"Cable supports up to {prod_wattage}W (covers {req_wattage}W)")
            confidence += 0.15

    elif prod_category == "POWER_BANKS":
        prod_capacity = prod_attrs.get("capacity_mah", 0)
        req_capacity = requested_specs.get("capacity_mah")
        prod_watt = prod_attrs.get("max_output_w", 18)
        req_watt = requested_specs.get("wattage")

        if req_capacity:
            if prod_capacity < req_capacity * 0.7:
                incompatible_reasons.append(
                    f"Capacity deficit: {prod_capacity}mAh significantly lower than requested {req_capacity}mAh"
                )
            else:
                reasons.append(f"Capacity: {prod_capacity}mAh")
                confidence += 0.20

        if req_watt and req_watt > prod_watt:
            incompatible_reasons.append(
                f"Max powerbank output {prod_watt}W cannot supply {req_watt}W requested device"
            )
        elif req_watt:
            reasons.append(f"Fast charging output {prod_watt}W")
            confidence += 0.15

    # 4. Final Classification
    if incompatible_reasons:
        return ("INCOMPATIBLE", min(0.35, confidence), reasons, incompatible_reasons)

    confidence = min(0.95, confidence)
    req_brand = requested_specs.get("brand_hint")

    # If same brand and high confidence -> EXACT or near-exact
    if req_brand and req_brand in prod_brand and confidence >= 0.85:
        return ("EXACT_MATCH", confidence, reasons, [])
    elif confidence >= 0.70:
        return ("COMPATIBLE_ALTERNATIVE", confidence, reasons, [])
    else:
        return ("POTENTIAL_REQUIRES_CONFIRMATION", confidence, reasons, [])


class BM25Retriever:
    """
    Lexical retrieval indexing product titles, brands, model numbers, and technical specifications.
    Provides fast, deterministic lexical retrieval across the neighbourhood catalogue.
    """

    def __init__(self, products: List[Any]):
        self.products = products
        self.corpus_tokens = [self._tokenize_product(p) for p in products]
        self.bm25 = BM25Okapi(self.corpus_tokens) if self.corpus_tokens else None

    def _tokenize_product(self, p: Any) -> List[str]:
        attrs = p.attributes_json or {}
        text = f"{p.brand} {p.model_name} {p.model_number or ''} {p.category} {p.sku} {attrs.get('wattage', '')}W {attrs.get('port_type', '')} {' '.join(attrs.get('standards', []))}"
        return normalize_text(text).split()

    def search(self, query: str, top_k: int = 10) -> List[Tuple[Any, float]]:
        if not self.bm25 or not self.products:
            return []
        tokenized_query = normalize_text(query).split()
        if not tokenized_query:
            return []
        scores = self.bm25.get_scores(tokenized_query)
        ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        return [(self.products[i], float(scores[i])) for i in ranked_indices if scores[i] > 0]
