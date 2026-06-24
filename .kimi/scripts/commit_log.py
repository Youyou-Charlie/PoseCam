#!/usr/bin/env python3
"""Append a timestamped entry to WORK_LOG.md and stage it for commit."""
import argparse
import datetime
import os
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Append entry to WORK_LOG.md")
    parser.add_argument("message", help="Log entry content")
    parser.add_argument(
        "--file",
        default="WORK_LOG.md",
        help="Path to work log file (default: WORK_LOG.md)",
    )
    args = parser.parse_args()

    log_path = os.path.abspath(args.file)
    os.makedirs(os.path.dirname(log_path) or ".", exist_ok=True)

    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    entry = f"\n## {timestamp}\n\n- {args.message}\n"

    if os.path.exists(log_path):
        with open(log_path, "r", encoding="utf-8") as f:
            content = f.read()
        if not content.endswith("\n"):
            content += "\n"
    else:
        content = "# Project Work Log\n\nThis file captures decisions, progress, and next steps so work can survive session interruptions.\n"

    content += entry

    with open(log_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Updated {log_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
