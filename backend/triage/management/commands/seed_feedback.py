import json
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand

from triage.models import FeedbackMessage

DATA_FILE = Path(__file__).resolve().parents[3] / "data" / "feedback.json"


class Command(BaseCommand):
    help = "Idempotently load the sample rider-feedback batch into the DB."

    def handle(self, *args, **options):
        rows = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        created = 0
        for r in rows:
            _, was_created = FeedbackMessage.objects.update_or_create(
                message_id=r["message_id"],
                defaults={
                    "ts": datetime.fromisoformat(r["ts"]),
                    "source": r["source"],
                    "rider": r["rider"],
                    "route": r["route"],
                    "star_rating": r.get("star_rating"),
                    "body": r["body"],
                },
            )
            created += was_created
        self.stdout.write(self.style.SUCCESS(f"seeded {len(rows)} messages ({created} new)"))