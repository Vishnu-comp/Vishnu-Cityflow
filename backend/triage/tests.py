from django.test import TestCase
from rest_framework.test import APIClient

from .importer import parse_feedback_csv
from .models import FeedbackMessage

CSV_OK = """id,timestamp,source,rider,route,message
R-001,2026-08-14T07:41:00+05:30,app_chat,Asha N.,Andheri West → BKC,"Bus left 4 min early, second time this week."
R-002,2026-08-14 08:05,mail,Kunal D.,"","Charged twice for the pass, refund one please."
R-003,,x,,Vashi → Lower Parel,App freezes on live tracking
"""


class ParserTests(TestCase):
    def test_parses_aliases_defaults_and_ts(self):
        rows, warnings, dropped = parse_feedback_csv(CSV_OK)
        self.assertEqual([r["message_id"] for r in rows], ["R-001", "R-002", "R-003"])
        self.assertEqual(dropped, 0)
        # aliases: "mail" -> email, "x" -> twitter
        self.assertEqual(rows[1]["source"], "email")
        self.assertEqual(rows[2]["source"], "twitter")
        # missing rider gets a polite default
        self.assertEqual(rows[2]["rider"], "Anonymous rider")
        # bad/missing timestamp stamps "now" and says so
        self.assertIsNotNone(rows[2]["ts"])

    def test_skips_empty_messages_with_receipt(self):
        rows, warnings, dropped = parse_feedback_csv("id,message\nA-1,hello\nA-2,\n")
        self.assertEqual(len(rows), 1)
        self.assertEqual(dropped, 1)
        self.assertTrue(any("no message text" in w for w in warnings))

    def test_duplicate_ids_are_renamed(self):
        rows, warnings, _ = parse_feedback_csv("id,message\nA-1,one\nA-1,two\n")
        self.assertEqual([r["message_id"] for r in rows], ["A-1", "A-1-2"])
        self.assertTrue(any("duplicate id" in w for w in warnings))

    def test_missing_ids_are_assigned(self):
        rows, _, _ = parse_feedback_csv("name,comment\nRiya,bus was late\n")
        self.assertTrue(rows[0]["message_id"].startswith("C-"))

    def test_unrecognizable_shape_raises(self):
        with self.assertRaises(ValueError):
            parse_feedback_csv("foo,bar\n1,2\n")


class ImportEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_import_replaces_batch_and_sample_restores(self):
        FeedbackMessage.objects.create(
            message_id="OLD-1", ts="2026-01-01T00:00:00+05:30", source="email",
            rider="Old", route="", body="old batch row",
        )
        res = self.client.post("/api/feedback/import/", {"csv": CSV_OK}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["imported"], 3)
        self.assertEqual(FeedbackMessage.objects.count(), 3)
        self.assertFalse(FeedbackMessage.objects.filter(message_id="OLD-1").exists())

        res = self.client.post("/api/feedback/load-sample/", {}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["imported"], 30)
        self.assertEqual(FeedbackMessage.objects.count(), 30)
        self.assertTrue(FeedbackMessage.objects.filter(message_id="F-30").exists())

    def test_import_rejects_garbage(self):
        res = self.client.post("/api/feedback/import/", {"csv": "foo,bar\n1,2\n"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("message column", res.data["detail"])
