"""
ShelfBridge Canonical Catalogue & Seed Data Validation Script.
Validates:
1. Product uniqueness (ID, SKU, Barcode).
2. Manufacturer specification validity and JSON attributes.
3. Source provenance references.
4. Store network records and coordinates.
5. Inventory foreign keys, quantities, and pricing consistency.
"""

import os
import sys
import csv
import json
from pathlib import Path
from typing import Dict, List, Set, Any

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
PRODUCTS_CSV = ROOT_DIR / "data" / "canonical" / "products.csv"
SOURCES_CSV = ROOT_DIR / "data" / "canonical" / "product_sources.csv"
STORES_CSV = ROOT_DIR / "data" / "seed" / "stores.csv"
INVENTORY_CSV = ROOT_DIR / "data" / "seed" / "inventory.csv"

ALLOWED_CATEGORIES = {"CHARGERS", "CABLES", "POWER_BANKS", "AUDIO", "PERIPHERALS"}


def validate_catalogue() -> bool:
    errors: List[str] = []
    warnings: List[str] = []

    print("=" * 70)
    print("  SHELFBRIDGE CANONICAL DATA VALIDATION SUITE")
    print("=" * 70)

    # 1. Validate Products CSV
    if not PRODUCTS_CSV.exists():
        errors.append(f"Missing products file: {PRODUCTS_CSV}")
        print(f"❌ FAIL: {PRODUCTS_CSV} not found")
        return False

    product_ids: Set[str] = set()
    skus: Set[str] = set()
    barcodes: Set[str] = set()
    product_rows: List[Dict[str, Any]] = []

    with open(PRODUCTS_CSV, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=2):
            pid = row.get("id", "").strip()
            sku = row.get("sku", "").strip()
            barcode = row.get("barcode", "").strip()
            category = row.get("category", "").strip()
            mrp_str = row.get("mrp", "").strip()
            attr_str = row.get("attributes_json", "").strip()

            if not pid:
                errors.append(f"Line {idx}: Missing product ID.")
            elif pid in product_ids:
                errors.append(f"Line {idx}: Duplicate product ID '{pid}'.")
            product_ids.add(pid)

            if not sku:
                errors.append(f"Line {idx} ({pid}): Missing SKU.")
            elif sku in skus:
                errors.append(f"Line {idx} ({pid}): Duplicate SKU '{sku}'.")
            skus.add(sku)

            if barcode:
                if barcode in barcodes:
                    errors.append(f"Line {idx} ({pid}): Duplicate barcode '{barcode}'.")
                barcodes.add(barcode)

            if category not in ALLOWED_CATEGORIES:
                errors.append(f"Line {idx} ({pid}): Invalid category '{category}'. Allowed: {ALLOWED_CATEGORIES}")

            try:
                mrp = float(mrp_str)
                if mrp <= 0:
                    errors.append(f"Line {idx} ({pid}): Non-positive MRP '{mrp}'.")
            except ValueError:
                errors.append(f"Line {idx} ({pid}): Malformed MRP float '{mrp_str}'.")

            try:
                attrs = json.loads(attr_str)
                if not isinstance(attrs, dict):
                    errors.append(f"Line {idx} ({pid}): attributes_json must be a JSON object.")
                else:
                    if category == "CHARGERS":
                        if "wattage" not in attrs or not isinstance(attrs["wattage"], (int, float)) or attrs["wattage"] <= 0:
                            errors.append(f"Line {idx} ({pid}): Charger missing positive wattage attribute.")
                        if "port_type" not in attrs:
                            warnings.append(f"Line {idx} ({pid}): Charger missing port_type attribute.")
                    elif category == "CABLES":
                        if "connector_from" not in attrs or "connector_to" not in attrs:
                            warnings.append(f"Line {idx} ({pid}): Cable missing connector_from or connector_to.")
                    elif category == "POWER_BANKS":
                        if "capacity_mah" not in attrs or attrs["capacity_mah"] <= 0:
                            errors.append(f"Line {idx} ({pid}): Power bank missing positive capacity_mah.")
            except json.JSONDecodeError as e:
                errors.append(f"Line {idx} ({pid}): Malformed JSON in attributes_json: {e}")

            product_rows.append(row)

    print(f"✓ Products CSV verified: {len(product_ids)} unique products validated.")

    # 2. Validate Product Sources CSV
    source_pids: Set[str] = set()
    if SOURCES_CSV.exists():
        with open(SOURCES_CSV, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                pid = row.get("product_id", "").strip()
                url = row.get("source_url", "").strip()
                status = row.get("verification_status", "").strip()

                if not pid or pid not in product_ids:
                    errors.append(f"Sources Line {idx}: References non-existent product_id '{pid}'.")
                source_pids.add(pid)

                if not url.startswith("http://") and not url.startswith("https://"):
                    errors.append(f"Sources Line {idx} ({pid}): Invalid URL '{url}'.")
                if not status:
                    warnings.append(f"Sources Line {idx} ({pid}): Empty verification_status.")

        missing_sources = product_ids - source_pids
        if missing_sources:
            warnings.append(f"Products without explicit source provenance record: {missing_sources}")
        print(f"✓ Product Sources CSV verified: {len(source_pids)} provenance records mapped.")
    else:
        errors.append(f"Missing product sources file: {SOURCES_CSV}")

    # 3. Validate Stores CSV
    store_ids: Set[str] = set()
    if STORES_CSV.exists():
        with open(STORES_CSV, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                sid = row.get("id", "").strip()
                name = row.get("name", "").strip()
                lat_str = row.get("latitude", "").strip()
                lon_str = row.get("longitude", "").strip()

                if not sid:
                    errors.append(f"Stores Line {idx}: Missing store ID.")
                elif sid in store_ids:
                    errors.append(f"Stores Line {idx}: Duplicate store ID '{sid}'.")
                store_ids.add(sid)

                if "simulated" not in name.lower() and "simulated" not in row.get("neighbourhood", "").lower():
                    warnings.append(f"Stores Line {idx} ({sid}): Store '{name}' is not explicitly labeled (Simulated).")

                try:
                    lat = float(lat_str)
                    lon = float(lon_str)
                    if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                        errors.append(f"Stores Line {idx} ({sid}): Coordinates ({lat}, {lon}) out of bounds.")
                except ValueError:
                    errors.append(f"Stores Line {idx} ({sid}): Malformed coordinates ({lat_str}, {lon_str}).")

        print(f"✓ Stores CSV verified: {len(store_ids)} stores validated.")
    else:
        errors.append(f"Missing stores file: {STORES_CSV}")

    # 4. Validate Inventory CSV
    inv_ids: Set[str] = set()
    if INVENTORY_CSV.exists():
        with open(INVENTORY_CSV, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                iid = row.get("id", "").strip()
                sid = row.get("store_id", "").strip()
                pid = row.get("product_id", "").strip()
                qty_str = row.get("stock_quantity", "").strip()
                res_str = row.get("reserved_quantity", "").strip()
                cost_str = row.get("purchase_cost", "").strip()
                retail_str = row.get("retail_price", "").strip()
                transfer_str = row.get("transfer_price", "").strip()
                status = row.get("status", "").strip()

                if not iid:
                    errors.append(f"Inventory Line {idx}: Missing inventory ID.")
                elif iid in inv_ids:
                    errors.append(f"Inventory Line {idx}: Duplicate inventory ID '{iid}'.")
                inv_ids.add(iid)

                if sid not in store_ids:
                    errors.append(f"Inventory Line {idx} ({iid}): Foreign key store_id '{sid}' not in stores.csv.")

                if pid not in product_ids:
                    errors.append(f"Inventory Line {idx} ({iid}): Foreign key product_id '{pid}' not in products.csv.")

                try:
                    qty = int(qty_str)
                    res = int(res_str)
                    if qty < 0:
                        errors.append(f"Inventory Line {idx} ({iid}): Negative stock quantity {qty}.")
                    if res < 0:
                        errors.append(f"Inventory Line {idx} ({iid}): Negative reserved quantity {res}.")
                    if res > qty:
                        errors.append(f"Inventory Line {idx} ({iid}): reserved_quantity ({res}) > stock_quantity ({qty}).")
                except ValueError:
                    errors.append(f"Inventory Line {idx} ({iid}): Malformed quantity numbers ({qty_str}, {res_str}).")

                try:
                    cost = float(cost_str)
                    retail = float(retail_str)
                    transfer = float(transfer_str)
                    if cost <= 0 or retail <= 0 or transfer <= 0:
                        errors.append(f"Inventory Line {idx} ({iid}): Non-positive price (cost={cost}, retail={retail}, transfer={transfer}).")
                    if transfer < cost:
                        warnings.append(f"Inventory Line {idx} ({iid}): Transfer price ({transfer}) < purchase cost ({cost}). Negative supplier margin!")
                    if transfer > retail:
                        warnings.append(f"Inventory Line {idx} ({iid}): Transfer price ({transfer}) > retail price ({retail}). Negative retailer margin!")
                except ValueError:
                    errors.append(f"Inventory Line {idx} ({iid}): Malformed price floats.")

                if status not in {"ACTIVE", "OUT_OF_STOCK", "STALE"}:
                    warnings.append(f"Inventory Line {idx} ({iid}): Unrecognised status '{status}'.")

        print(f"✓ Inventory CSV verified: {len(inv_ids)} inventory records validated across {len(store_ids)} stores.")
    else:
        errors.append(f"Missing inventory file: {INVENTORY_CSV}")

    # Summary
    print("-" * 70)
    if warnings:
        print(f"⚠️  {len(warnings)} WARNINGS:")
        for w in warnings:
            print(f"   [WARN] {w}")
    else:
        print("✓ 0 warnings.")

    if errors:
        print(f"\n❌ {len(errors)} VALIDATION ERRORS DETECTED:")
        for e in errors:
            print(f"   [ERROR] {e}")
        print("=" * 70)
        return False

    print("\n✅ ALL VALIDATION CHECKS PASSED PERFECTLY!")
    print(f"   Total Products: {len(product_ids)}")
    print(f"   Total Provenance Records: {len(source_pids)}")
    print(f"   Total Stores: {len(store_ids)}")
    print(f"   Total Inventory Items: {len(inv_ids)}")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = validate_catalogue()
    sys.exit(0 if success else 1)
