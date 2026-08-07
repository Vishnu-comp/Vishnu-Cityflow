#!/usr/bin/env python3
"""Cityflo application driver — a minimal MCP (streamable-HTTP) client.

The agent-facing application at careers.cityflo.com is an MCP server. This
script speaks that protocol (initialize -> session -> tools/call) and walks
the six-step logbook: profile, resume, agent config, role, assignment.

Usage:
    export CF_MCP_TOKEN='cf_live_...'        # token from careers.cityflo.com/mcp
    export CF_MCP_URL='https://careers.cityflo.com/api/mcp'   # default, optional

    python3 scripts/apply.py tools                     # list tools + input schemas
    python3 scripts/apply.py call <tool> '<json>'      # call any tool, e.g.
    python3 scripts/apply.py call update_my_profile '{"name": "..."}'
    python3 scripts/apply.py resume ./resume.pdf       # get_resume_upload_url -> PUT file
    python3 scripts/apply.py resume-text ./resume.md   # upload_resume (plain text)

Security: the token comes only from the environment. It is never written to
disk, never committed, and never printed. Rotate it at careers.cityflo.com/mcp
if it is ever exposed.

No dependencies beyond the standard library (works on the stock macOS python3).
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request

MCP_URL = os.environ.get("CF_MCP_URL", "https://careers.cityflo.com/api/mcp")
TOKEN = os.environ.get("CF_MCP_TOKEN", "")
PROTOCOL_VERSION = "2025-03-26"  # widely supported; server negotiates down if needed


class McpError(Exception):
    pass


class McpClient:
    def __init__(self) -> None:
        self.session_id: str | None = None
        self._next_id = 0

    def _send(self, method: str, params: dict | None = None, notification: bool = False):
        if not TOKEN:
            raise McpError("CF_MCP_TOKEN environment variable is not set.")
        envelope: dict = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            envelope["params"] = params
        if not notification:
            self._next_id += 1
            envelope["id"] = self._next_id

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "Authorization": f"Bearer {TOKEN}",
        }
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id

        req = urllib.request.Request(
            MCP_URL, data=json.dumps(envelope).encode(), headers=headers
        )
        try:
            resp = urllib.request.urlopen(req, timeout=60)
        except urllib.error.HTTPError as e:
            raise McpError(f"HTTP {e.code}: {e.read().decode(errors='replace')[:400]}")
        except urllib.error.URLError as e:
            raise McpError(f"network error: {e.reason}")

        sid = resp.headers.get("Mcp-Session-Id")
        if sid:
            self.session_id = sid

        if notification:
            ok = resp.status in (200, 202, 204)
            resp.close()
            return {"ok": ok}

        ctype = resp.headers.get_content_type()
        raw = resp.read().decode("utf-8", errors="replace")
        resp.close()
        if ctype == "text/event-stream":
            frames = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
            if not frames:
                raise McpError(f"empty SSE stream: {raw[:300]}")
            return json.loads(frames[-1])  # terminal frame carries the response
        return json.loads(raw)

    def connect(self) -> None:
        res = self._send(
            "initialize",
            {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {},
                "clientInfo": {"name": "cityflo-apply-agent", "version": "1.0.0"},
            },
        )
        if "error" in res:
            raise McpError(f"initialize failed: {res['error']}")
        server = res.get("result", {}).get("serverInfo", {})
        print(f"· connected to {server.get('name', 'MCP server')} {server.get('version', '')}".strip(), file=sys.stderr)
        self._send("notifications/initialized", notification=True)

    def list_tools(self) -> list[dict]:
        return self._send("tools/list").get("result", {}).get("tools", [])

    def call(self, tool: str, args: dict | None = None) -> dict:
        res = self._send("tools/call", {"name": tool, "arguments": args or {}})
        if "error" in res:
            raise McpError(f"{tool}: {res['error']}")
        return res.get("result", {})


# ---------------------------------------------------------------- output helpers

def print_result(result: dict) -> None:
    """Render an MCP tools/call result readably."""
    if result.get("isError"):
        print("⚠ tool reported an error:", file=sys.stderr)
    if result.get("structuredContent") is not None:
        print(json.dumps(result["structuredContent"], indent=2, ensure_ascii=False))
    for block in result.get("content", []):
        if block.get("type") == "text":
            print(block["text"])
        else:
            print(json.dumps(block, indent=2)[:800])


def extract_upload_url(result: dict) -> str | None:
    text = " ".join(b.get("text", "") for b in result.get("content", []) if b.get("type") == "text")
    if result.get("structuredContent"):
        text += " " + json.dumps(result["structuredContent"])
    m = re.search(r'https?://[^\s"<>]+', text)
    return m.group(0) if m else None


# ------------------------------------------------------------------- commands

def cmd_tools(client: McpClient) -> None:
    tools = client.list_tools()
    if not tools:
        print("no tools returned")
        return
    for t in tools:
        print(f"\n■ {t.get('name')}")
        desc = (t.get("description") or "").strip()
        if desc:
            print("  " + desc.replace("\n", "\n  ")[:400])
        schema = t.get("inputSchema") or {}
        props = schema.get("properties", {})
        required = set(schema.get("required", []))
        if props:
            for name, spec in props.items():
                req = "*" if name in required else " "
                hint = spec.get("type", "?")
                label = spec.get("description", "")[:80]
                print(f"   {req} {name}: {hint}  {label}")
        print(f"    schema: {json.dumps(schema)[:500]}")


def cmd_call(client: McpClient, tool: str, args_json: str) -> None:
    try:
        args = json.loads(args_json)
    except json.JSONDecodeError as e:
        raise McpError(f"args must be valid JSON: {e}")
    print_result(client.call(tool, args))


def cmd_resume(client: McpClient, path: str) -> None:
    """PDF path: ask for an upload URL, then PUT the file to it directly."""
    if not os.path.isfile(path):
        raise McpError(f"no such file: {path}")
    name = os.path.basename(path)
    print(f"· requesting upload url for {name} …", file=sys.stderr)
    result = client.call("get_resume_upload_url", {"filename": name})
    print_result(result)
    url = extract_upload_url(result)
    if not url:
        raise McpError("couldn't find an upload URL in the tool response — paste the output to the agent")
    ctype = "application/pdf" if path.lower().endswith(".pdf") else "application/octet-stream"
    with open(path, "rb") as fh:
        payload = fh.read()
    print(f"· uploading {len(payload)} bytes …", file=sys.stderr)
    put = urllib.request.Request(url, data=payload, method="PUT", headers={"Content-Type": ctype})
    try:
        with urllib.request.urlopen(put, timeout=120) as r:
            print(f"· upload status: HTTP {r.status}", file=sys.stderr)
    except urllib.error.HTTPError as e:
        raise McpError(f"upload failed: HTTP {e.code}: {e.read().decode(errors='replace')[:300]}")
    print("✓ resume uploaded")


def cmd_resume_text(client: McpClient, path: str) -> None:
    if not os.path.isfile(path):
        raise McpError(f"no such file: {path}")
    text = open(path, encoding="utf-8").read()
    print_result(client.call("upload_resume", {"text": text, "filename": os.path.basename(path)}))


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[1] in ("-h", "--help", "help"):
        print(__doc__)
        return 0
    command, rest = argv[1], argv[2:]
    client = McpClient()
    try:
        client.connect()
        if command == "tools":
            cmd_tools(client)
        elif command == "call":
            if len(rest) < 2:
                raise McpError("usage: apply.py call <tool_name> '<json-args>'")
            cmd_call(client, rest[0], rest[1])
        elif command == "resume":
            if not rest:
                raise McpError("usage: apply.py resume <file.pdf>")
            cmd_resume(client, rest[0])
        elif command == "resume-text":
            if not rest:
                raise McpError("usage: apply.py resume-text <file.md|txt>")
            cmd_resume_text(client, rest[0])
        else:
            raise McpError(f"unknown command '{command}' — try: tools | call | resume | resume-text")
    except McpError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
