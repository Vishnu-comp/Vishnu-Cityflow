from rest_framework import serializers

from .models import FeedbackMessage, TriageRun


class FeedbackMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackMessage
        fields = ["message_id", "ts", "source", "rider", "route", "body"]


class TriageRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriageRun
        fields = ["id", "created_at", "provider", "model", "note", "result"]
