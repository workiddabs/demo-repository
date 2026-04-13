"""Persistence layer for application settings."""

from __future__ import annotations

from PyQt6.QtCore import QSettings


class SettingsManager:
    """Wraps QSettings to centralize key names and defaults."""

    ORG_NAME = "HTMLViewer"
    APP_NAME = "PyQtSlideViewer"

    KEY_LAST_FOLDER = "viewer/last_folder"
    KEY_LAST_FILE = "viewer/last_file"
    KEY_AUTOPLAY_MS = "viewer/autoplay_ms"

    def __init__(self) -> None:
        self._settings = QSettings(self.ORG_NAME, self.APP_NAME)

    def get_last_folder(self) -> str:
        return self._settings.value(self.KEY_LAST_FOLDER, "", str)

    def set_last_folder(self, folder_path: str) -> None:
        self._settings.setValue(self.KEY_LAST_FOLDER, folder_path)

    def get_last_file(self) -> str:
        return self._settings.value(self.KEY_LAST_FILE, "", str)

    def set_last_file(self, file_path: str) -> None:
        self._settings.setValue(self.KEY_LAST_FILE, file_path)

    def get_autoplay_ms(self) -> int:
        return int(self._settings.value(self.KEY_AUTOPLAY_MS, 5000, int))

    def set_autoplay_ms(self, interval_ms: int) -> None:
        self._settings.setValue(self.KEY_AUTOPLAY_MS, interval_ms)

    def sync(self) -> None:
        self._settings.sync()
