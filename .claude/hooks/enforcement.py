#!/usr/bin/env python3
"""
Thin wrapper to expose UltrathinkEnforcerV2 as a PreToolUse hook.
"""
import sys
import json

try:
    from ultrathink_enforcer import UltrathinkEnforcerV2
except Exception as exc:
    # If import fails, do not block tool usage but report error
    print(f"Enforcement import error: {exc}", file=sys.stderr)
    sys.exit(0)


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # If input is not JSON, allow
        sys.exit(0)
    except Exception as exc:
        print(f"Enforcement input error: {exc}", file=sys.stderr)
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    enforcer = UltrathinkEnforcerV2()
    try:
        exit_code = enforcer.handle_pre_tool_use(tool_name, tool_input)
        sys.exit(exit_code)
    except Exception as exc:
        # Do not hard-fail on enforcement error
        print(f"Enforcement runtime error: {exc}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
