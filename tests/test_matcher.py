"""
Unit tests for ShelfBridge Deterministic Product Identity and Electrical Compatibility Rules.
"""

import pytest
from backend.models import Product
from backend.matcher import parse_query_specs, evaluate_product_match


def test_parse_query_specs_chargers():
    q1 = "Samsung 25W Type-C adapter with PPS fast charging"
    specs = parse_query_specs(q1)
    assert specs["wattage"] == 25
    assert specs["connector_type"] == "TYPE_C"
    assert "PPS" in specs["standards"]
    assert specs["brand_hint"] == "samsung"
    assert specs["category_hint"] == "CHARGERS"


def test_parse_query_specs_cables():
    q2 = "boAt type c to type c 100W fast charging cable 1.5m"
    specs = parse_query_specs(q2)
    assert specs["connector_type"] == "TYPE_C_TO_TYPE_C"
    assert specs["wattage"] == 100
    assert specs["cable_length_m"] == 1.5
    assert specs["brand_hint"] == "boat"
    assert specs["category_hint"] == "CABLES"


def test_parse_query_specs_powerbanks():
    q3 = "Ambrane 20000mAh 65W laptop powerbank"
    specs = parse_query_specs(q3)
    assert specs["capacity_mah"] == 20000
    assert specs["wattage"] == 65
    assert specs["brand_hint"] == "ambrane"
    assert specs["category_hint"] == "POWER_BANKS"


def test_incompatible_product_wattage_rejection():
    # Customer wants 65W fast charger
    requested_specs = parse_query_specs("Anker 65W USB-C charger for Dell laptop")
    
    # Candidate product is only 15W
    candidate_15w = Product(
        id="prod_15w",
        sku="SAM-15W",
        brand="Samsung",
        model_name="15W Travel Adapter",
        model_number="EP-TA200",
        category="CHARGERS",
        mrp=799.0,
        attributes_json={"wattage": 15, "port_type": "USB-A", "standards": ["AFC"]}
    )

    match_type, conf, reasons, incomp_reasons = evaluate_product_match(requested_specs, candidate_15w)
    assert match_type == "INCOMPATIBLE"
    assert any("Wattage deficit" in r for r in incomp_reasons)



def test_incompatible_category_mismatch():
    # Customer wants a charger
    requested_specs = parse_query_specs("Samsung 25W charger")
    
    # Candidate is a cable
    candidate_cable = Product(
        id="prod_cbl",
        sku="BOAT-CBL",
        brand="boAt",
        model_name="Deuce 100W Cable",
        category="CABLES",
        mrp=499.0,
        attributes_json={"connector_from": "USB-C", "connector_to": "USB-C"}
    )

    match_type, conf, reasons, incomp_reasons = evaluate_product_match(requested_specs, candidate_cable)
    assert match_type == "INCOMPATIBLE"
    assert any("Category mismatch" in r for r in incomp_reasons)


def test_compatible_alternative_detection():
    # Customer wants Samsung 25W charger
    requested_specs = parse_query_specs("Samsung 25W Type-C adapter")
    
    # Candidate is Anker 30W Nano with PD 3.0 / PPS (higher wattage, backwards compatible)
    candidate_anker = Product(
        id="prod_anker_30w",
        sku="ANK-30W",
        brand="Anker",
        model_name="Nano 3 30W Charger",
        model_number="A2146",
        category="CHARGERS",
        mrp=1799.0,
        attributes_json={"wattage": 30, "port_type": "USB-C", "standards": ["PD 3.0", "PPS"]}
    )

    match_type, conf, reasons, incomp_reasons = evaluate_product_match(requested_specs, candidate_anker)
    assert match_type == "COMPATIBLE_ALTERNATIVE"
    assert len(incomp_reasons) == 0
    assert any("30W" in r for r in reasons)


def test_exact_sku_or_model_match():
    requested_specs = parse_query_specs("Samsung EP-TA800 25W charger")
    
    candidate = Product(
        id="prod_samsung_ta800",
        sku="SAM-CHG-25W-TA800",
        brand="Samsung",
        model_name="25W Type-C Super Fast Adapter",
        model_number="EP-TA800",
        category="CHARGERS",
        mrp=1299.0,
        attributes_json={"wattage": 25, "port_type": "USB-C", "standards": ["PD 3.0", "PPS"]}
    )

    match_type, conf, reasons, incomp_reasons = evaluate_product_match(requested_specs, candidate)
    assert match_type == "EXACT_MATCH"
    assert conf >= 0.95
