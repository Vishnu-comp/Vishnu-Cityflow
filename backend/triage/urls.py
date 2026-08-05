from django.urls import path

from .views import (
    FeedbackImportView,
    FeedbackListView,
    FeedbackLoadSampleView,
    HealthView,
    TriageLatestView,
    TriageRunView,
)

urlpatterns = [
    path("healthz/", HealthView.as_view()),
    path("feedback/", FeedbackListView.as_view()),
    path("feedback/import/", FeedbackImportView.as_view()),
    path("feedback/load-sample/", FeedbackLoadSampleView.as_view()),
    path("triage/latest/", TriageLatestView.as_view()),
    path("triage/run/", TriageRunView.as_view()),
]
