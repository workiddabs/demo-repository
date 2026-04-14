"""Main window implementation for HTML slide viewer."""

from __future__ import annotations

from pathlib import Path

from PyQt6.QtCore import QDir, QTimer, Qt
from PyQt6.QtGui import QAction, QKeySequence, QShortcut
from PyQt6.QtWidgets import (
    QFileDialog,
    QLabel,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QSpinBox,
    QSplitter,
    QToolBar,
)

from app.core.settings_manager import SettingsManager
from app.widgets.html_viewer import HtmlViewer


class MainWindow(QMainWindow):
    """Top-level window containing sidebar, toolbar and HTML viewer."""

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("HTML Slide Viewer")
        self.resize(1280, 760)

        self.settings = SettingsManager()
        self.current_folder = ""
        self.html_files: list[str] = []
        self.current_index = -1

        self.autoplay_timer = QTimer(self)
        self.autoplay_timer.timeout.connect(self.next_slide)

        self._setup_ui()
        self._setup_shortcuts()
        self._restore_state()

    def _setup_ui(self) -> None:
        """Create widgets and layout containers."""
        self.sidebar = QListWidget()
        self.sidebar.setObjectName("Sidebar")
        self.sidebar.currentRowChanged.connect(self.open_slide_by_index)

        self.viewer = HtmlViewer()

        splitter = QSplitter()
        splitter.addWidget(self.sidebar)
        splitter.addWidget(self.viewer)
        splitter.setStretchFactor(0, 0)
        splitter.setStretchFactor(1, 1)
        splitter.setSizes([320, 960])

        self.setCentralWidget(splitter)
        self._build_toolbar()

    def _build_toolbar(self) -> None:
        """Create top toolbar with controls."""
        toolbar = QToolBar("Controls", self)
        toolbar.setMovable(False)
        self.addToolBar(toolbar)

        open_action = QAction("Open Folder", self)
        open_action.triggered.connect(self.select_folder)
        toolbar.addAction(open_action)

        refresh_action = QAction("Refresh", self)
        refresh_action.triggered.connect(self.refresh_file_list)
        toolbar.addAction(refresh_action)

        toolbar.addSeparator()

        prev_action = QAction("Previous", self)
        prev_action.triggered.connect(self.previous_slide)
        toolbar.addAction(prev_action)

        next_action = QAction("Next", self)
        next_action.triggered.connect(self.next_slide)
        toolbar.addAction(next_action)

        toolbar.addSeparator()

        self.fullscreen_action = QAction("Fullscreen", self)
        self.fullscreen_action.setCheckable(True)
        self.fullscreen_action.triggered.connect(self.toggle_fullscreen)
        toolbar.addAction(self.fullscreen_action)

        self.autoplay_action = QAction("Auto-play", self)
        self.autoplay_action.setCheckable(True)
        self.autoplay_action.triggered.connect(self.toggle_autoplay)
        toolbar.addAction(self.autoplay_action)

        toolbar.addWidget(QLabel(" Interval (sec): "))
        self.interval_spin = QSpinBox()
        self.interval_spin.setRange(1, 3600)
        self.interval_spin.setValue(max(1, self.settings.get_autoplay_ms() // 1000))
        self.interval_spin.valueChanged.connect(self._autoplay_interval_changed)
        toolbar.addWidget(self.interval_spin)

    def _setup_shortcuts(self) -> None:
        """Register keyboard shortcuts required by specification."""
        QShortcut(QKeySequence(Qt.Key.Key_Right), self, activated=self.next_slide)
        QShortcut(QKeySequence(Qt.Key.Key_Left), self, activated=self.previous_slide)
        QShortcut(QKeySequence("F"), self, activated=self.toggle_fullscreen)
        QShortcut(QKeySequence(Qt.Key.Key_Escape), self, activated=self.exit_fullscreen)

    def _restore_state(self) -> None:
        """Load previously used folder and last opened slide."""
        folder = self.settings.get_last_folder()
        if folder and Path(folder).is_dir():
            self.load_folder(folder)

    def select_folder(self) -> None:
        """Prompt user to choose a folder containing HTML files."""
        start_dir = self.current_folder or QDir.homePath()
        folder = QFileDialog.getExistingDirectory(self, "Select HTML Folder", start_dir)
        if not folder:
            return

        self.load_folder(folder)

    def load_folder(self, folder: str) -> None:
        """Scan a folder for HTML files and update sidebar."""
        path = Path(folder)
        if not path.exists() or not path.is_dir():
            QMessageBox.warning(self, "Invalid Folder", "Selected path is not a folder.")
            return

        self.current_folder = str(path)
        self.settings.set_last_folder(self.current_folder)

        files = [
            str(file)
            for file in sorted(path.iterdir())
            if file.is_file() and file.suffix.lower() in {".html", ".htm"}
        ]

        self.html_files = files
        self.sidebar.clear()

        for file_path in self.html_files:
            self.sidebar.addItem(QListWidgetItem(Path(file_path).name))

        if not self.html_files:
            self.current_index = -1
            self.viewer.setHtml("<h2 style='font-family:sans-serif'>No HTML files found.</h2>")
            return

        last_file = self.settings.get_last_file()
        start_index = 0
        if last_file in self.html_files:
            start_index = self.html_files.index(last_file)

        self.sidebar.setCurrentRow(start_index)

    def refresh_file_list(self) -> None:
        """Re-scan the current folder for updated HTML files."""
        if not self.current_folder:
            self.select_folder()
            return

        current_file = self._current_file_path()
        self.load_folder(self.current_folder)
        if current_file and current_file in self.html_files:
            self.sidebar.setCurrentRow(self.html_files.index(current_file))

    def open_slide_by_index(self, index: int) -> None:
        """Load selected HTML file by list index."""
        if index < 0 or index >= len(self.html_files):
            return

        self.current_index = index
        file_path = self.html_files[index]
        self.viewer.load_local_file(file_path)
        self.settings.set_last_file(file_path)

    def _current_file_path(self) -> str:
        if 0 <= self.current_index < len(self.html_files):
            return self.html_files[self.current_index]
        return ""

    def next_slide(self) -> None:
        """Move to the next slide with wrap-around."""
        if not self.html_files:
            return

        next_index = (self.current_index + 1) % len(self.html_files)
        self.sidebar.setCurrentRow(next_index)

    def previous_slide(self) -> None:
        """Move to the previous slide with wrap-around."""
        if not self.html_files:
            return

        prev_index = (self.current_index - 1) % len(self.html_files)
        self.sidebar.setCurrentRow(prev_index)

    def toggle_fullscreen(self) -> None:
        """Toggle fullscreen state for presentation mode."""
        if self.isFullScreen():
            self.exit_fullscreen()
        else:
            self.showFullScreen()
            self.fullscreen_action.setChecked(True)

    def exit_fullscreen(self) -> None:
        """Exit fullscreen if currently active."""
        if self.isFullScreen():
            self.showNormal()
            self.fullscreen_action.setChecked(False)

    def toggle_autoplay(self, enabled: bool) -> None:
        """Start or stop automatic slide transitions."""
        interval_ms = self.interval_spin.value() * 1000
        self.settings.set_autoplay_ms(interval_ms)

        if enabled:
            self.autoplay_timer.start(interval_ms)
        else:
            self.autoplay_timer.stop()

    def _autoplay_interval_changed(self, seconds: int) -> None:
        """Update timer interval when spinbox value changes."""
        interval_ms = seconds * 1000
        self.settings.set_autoplay_ms(interval_ms)
        if self.autoplay_timer.isActive():
            self.autoplay_timer.start(interval_ms)

    def closeEvent(self, event) -> None:  # noqa: N802 (Qt naming)
        """Persist settings before application exit."""
        self.settings.sync()
        super().closeEvent(event)
