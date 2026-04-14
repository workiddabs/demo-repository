"""Widget responsible for HTML rendering and fit-to-screen behavior."""

from __future__ import annotations

from PyQt6.QtCore import QUrl
from PyQt6.QtWebEngineWidgets import QWebEngineView


class HtmlViewer(QWebEngineView):
    """Extends QWebEngineView with a best-effort responsive zoom strategy."""

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._fit_enabled = True
        self.loadFinished.connect(self._apply_fit)

    def load_local_file(self, file_path: str) -> None:
        """Load a local HTML file in the web engine."""
        self.load(QUrl.fromLocalFile(file_path))

    def set_fit_enabled(self, enabled: bool) -> None:
        self._fit_enabled = enabled
        self._apply_fit()

    def resizeEvent(self, event) -> None:  # noqa: N802 (Qt naming)
        super().resizeEvent(event)
        # Recalculate zoom when the window size changes.
        self._apply_fit()

    def _apply_fit(self) -> None:
        """Fit content to viewport by calculating a zoom factor via JS metrics."""
        if not self._fit_enabled:
            self.setZoomFactor(1.0)
            return

        js = """
            (() => {
                const doc = document.documentElement;
                const body = document.body;
                const width = Math.max(
                    doc ? doc.scrollWidth : 0,
                    body ? body.scrollWidth : 0,
                    doc ? doc.clientWidth : 0
                );
                const height = Math.max(
                    doc ? doc.scrollHeight : 0,
                    body ? body.scrollHeight : 0,
                    doc ? doc.clientHeight : 0
                );
                return { width: width || 1, height: height || 1 };
            })();
        """

        def apply_zoom(dimensions: dict) -> None:
            if not dimensions:
                self.setZoomFactor(1.0)
                return

            content_width = max(float(dimensions.get("width", 1.0)), 1.0)
            content_height = max(float(dimensions.get("height", 1.0)), 1.0)
            viewport = self.size()

            width_ratio = viewport.width() / content_width
            height_ratio = viewport.height() / content_height
            zoom = min(width_ratio, height_ratio)
            zoom = max(0.25, min(zoom, 2.5))

            self.setZoomFactor(zoom)

        self.page().runJavaScript(js, apply_zoom)
