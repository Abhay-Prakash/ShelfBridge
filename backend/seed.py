"""
ShelfBridge Database Seeder CLI.
Reproducibly seeds canonical products, Nehru Place pilot stores, and inventory distributions.
Usage:
    python -m backend.seed [--reset]
"""

import sys
import argparse

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
from backend.database import SessionLocal, engine, Base
from backend.models import (
    Store, Product, InventoryItem, UnmetDemandRequest,
    MatchCandidate, SupplierOffer, Reservation, Fulfilment,
    TransactionOutcome, AuditEvent
)
from backend.services import seed_database


def run_seeder(reset: bool = False):
    print("=" * 70)
    print("  SHELFBRIDGE REPRODUCIBLE DATABASE SEEDER")
    print(f"  Mode: {'FULL RESET & RE-SEED' if reset else 'IDEMPOTENT SEED (PRESERVE EXISTING)'}")
    print("=" * 70)

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if reset:
            print("Purging existing transaction records and seed tables...")
            db.query(TransactionOutcome).delete()
            db.query(Fulfilment).delete()
            db.query(Reservation).delete()
            db.query(SupplierOffer).delete()
            db.query(MatchCandidate).delete()
            db.query(UnmetDemandRequest).delete()
            db.query(InventoryItem).delete()
            db.query(Product).delete()
            db.query(Store).delete()
            db.query(AuditEvent).delete()
            db.commit()
            print("✓ Database purged successfully.")

        stats = seed_database(db)
        print("\nSeeding Results:")
        print(f"  Stores seeded/present:        {stats.get('stores', 0)}")
        print(f"  Products seeded/present:      {stats.get('products', 0)}")
        print(f"  Inventory items loaded:       {stats.get('inventory_records', 0)}")
        print("=" * 70)
        print("✅ Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ShelfBridge Database Seeder")
    parser.add_argument("--reset", action="store_true", help="Drop and rebuild all data tables before seeding")
    args = parser.parse_args()
    run_seeder(reset=args.reset)
