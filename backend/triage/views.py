import json
from datetime import datetime
from pathlib import Path

from django.db import transaction
from rest_framework.response import Response
from rest_framework.views import APIView

from .importer import parse_feedback_csv
from .llm import ATTENTION_LIMIT, run_triage
from .models import FeedbackMessage, TriageRun
from .serializers import FeedbackMessageSerializer, TriageRunSerializer

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "feedback.json"


class HealthView(APIView):
    def get(self, request):
        return Response({"ok": True})


class FeedbackListView(APIView):
    def get(self, request):
        msgs = FeedbackMessage.objects.all()
        return Response({"count": msgs.count(), "messages": FeedbackMessageSerializer(msgs, many=True).data})


def _replace_batch(rows: list[dict]) -> int:
    with transaction.atomic():
        FeedbackMessage.objects.all().delete()
        FeedbackMessage.objects.bulk_create([FeedbackMessage(**r) for r in rows])
    return len(rows)


class FeedbackImportView(APIView):
    """Import a real spreadsheet: CSV text uploaded/pasted from the UI.

    Replaces the current batch (the sample stays restorable via load-sample).
    """

    def post(self, request):
        csv_text = request.data.get("csv")
        if not isinstance(csv_text, str) or not csv_text.strip():
            return Response({"detail": "send CSV text as {'csv': '...'}"}, status=400)
        try:
            rows, warnings, dropped = parse_feedback_csv(csv_text)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        if not rows:
            return Response(
                {"detail": "no usable rows found in the spreadsheet", "warnings": warnings},
                status=400,
            )
        imported = _replace_batch(rows)
        return Response(
            {"imported": imported, "dropped": dropped, "warnings": warnings[:50]}, status=201
        )


class FeedbackLoadSampleView(APIView):
    """Restore the built-in 30-message sample batch."""

    def post(self, request):
        rows = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        rows = [{**r, "ts": datetime.fromisoformat(r["ts"])} for r in rows]
        imported = _replace_batch(rows)
        return Response({"imported": imported, "dropped": 0, "warnings": []}, status=201)


class TriageLatestView(APIView):
    def get(self, request):
        run = TriageRun.objects.first()
        if not run:
            return Response({"detail": "no triage run yet"}, status=404)
        return Response(TriageRunSerializer(run).data)


class TriageRunView(APIView):
    def post(self, request):
        msgs = list(FeedbackMessage.objects.all().values("message_id", "ts", "source", "rider", "route", "star_rating", "body"))
        if not msgs:
            return Response({"detail": "no feedback seeded"}, status=400)
        serializable = [{**m, "ts": m["ts"].isoformat()} for m in msgs]
        result, provider, model, note = run_triage(serializable)
        run = TriageRun.objects.create(
            provider=provider,
            model=model,
            note=note,
            result={**result, "attention_limit": ATTENTION_LIMIT},
        )
        return Response(TriageRunSerializer(run).data, status=201)