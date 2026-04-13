"""Entry point for HTML Viewer desktop application."""

from __future__ import annotations

import sys
from pathlib import Path

from PyQt6.QtWidgets import QApplication

from app.ui.main_window import MainWindow


def load_stylesheet(app: QApplication) -> None:
    """Load QSS theme from styles directory if available."""
    style_path = Path(__file__).resolve().parent / "styles" / "theme.qss"
    if style_path.exists():
        app.setStyleSheet(style_path.read_text(encoding="utf-8"))


def main() -> int:
    app = QApplication(sys.argv)
    load_stylesheet(app)

    window = MainWindow()
    window.show()

    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
