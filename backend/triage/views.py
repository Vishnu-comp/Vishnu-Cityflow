from rest_framework.response import Response
from rest_framework.views import APIView

from .llm import ATTENTION_LIMIT, run_triage
from .models import FeedbackMessage, TriageRun
from .serializers import FeedbackMessageSerializer, TriageRunSerializer


class HealthView(APIView):
    def get(self, request):
        return Response({"ok": True})


class FeedbackListView(APIView):
    def get(self, request):
        msgs = FeedbackMessage.objects.all()
        return Response({"count": msgs.count(), "messages": FeedbackMessageSerializer(msgs, many=True).data})


class TriageLatestView(APIView):
    def get(self, request):
        run = TriageRun.objects.first()
        if not run:
            return Response({"detail": "no triage run yet"}, status=404)
        return Response(TriageRunSerializer(run).data)


class TriageRunView(APIView):
    def post(self, request):
        msgs = list(FeedbackMessage.objects.all().values("message_id", "ts", "source", "rider", "route", "body"))
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
