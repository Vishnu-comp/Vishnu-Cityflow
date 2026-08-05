from django.db import models


class FeedbackMessage(models.Model):
    """One raw rider message. `message_id` mirrors the id in the source export."""

    message_id = models.CharField(max_length=24, unique=True)
    ts = models.DateTimeField()
    source = models.CharField(max_length=24)  # app_chat | email | playstore | twitter
    rider = models.CharField(max_length=64)
    route = models.CharField(max_length=80, blank=True)
    body = models.TextField()

    class Meta:
        ordering = ["-ts"]

    def __str__(self):
        return f"{self.message_id} · {self.source} · {self.rider}"


class TriageRun(models.Model):
    """Append-only log of triage runs — keeps AI decisions auditable."""

    created_at = models.DateTimeField(auto_now_add=True)
    provider = models.CharField(max_length=32)  # openai | heuristic
    model = models.CharField(max_length=64, blank=True)
    note = models.CharField(max_length=300, blank=True)
    result = models.JSONField()

    class Meta:
        ordering = ["-created_at"]
