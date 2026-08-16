#!/usr/bin/env python3
"""Convert a monospace text portrait into SVG <tspan> lines."""

from argparse import ArgumentParser
from html import escape
from pathlib import Path


def main() -> None:
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Path to a plain-text portrait")
    parser.add_argument("output", type=Path, help="Output path for SVG text tspans")
    parser.add_argument("--start-x", type=int, default=0)
    parser.add_argument("--start-y", type=int, default=18)
    parser.add_argument("--line-height", type=int, default=14)
    parser.add_argument("--trim-left", type=int, default=0)
    parser.add_argument("--trim-right", type=int, default=0)
    args = parser.parse_args()

    lines = args.input.read_text(encoding="utf-8", errors="ignore").splitlines()
    processed = []
    for line in lines:
        line = line.rstrip()
        if args.trim_right:
            line = line[:-args.trim_right]
        if args.trim_left:
            line = line[args.trim_left:]
        processed.append(line)

    tspans = [
        f'<tspan x="{args.start_x}" y="{args.start_y + index * args.line_height}">{escape(line)}</tspan>'
        for index, line in enumerate(processed)
    ]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(tspans) + "\n", encoding="utf-8")
    print(f"Generated {len(tspans)} tspans at {args.output}")


if __name__ == "__main__":
    main()
