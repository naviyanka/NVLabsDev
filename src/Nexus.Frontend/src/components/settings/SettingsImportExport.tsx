import React, { useRef } from "react";
import { Download, Upload, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function SettingsImportExport({
  settings,
  onImport,
  onReset
}: {
  settings: Record<string, any>;
  onImport: (importedData: Record<string, any>) => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
      const downloadAnchor = document.createElement("a");
      const filename = `nexus-settings-${new Date().toISOString().slice(0, 10)}.json`;
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Settings exported to ${filename}`);
    } catch (e) {
      toast.error("Failed to export settings");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === "object" && parsed !== null) {
          onImport(parsed);
          toast.success("Settings imported successfully!");
        } else {
          toast.error("Invalid configuration file format");
        }
      } catch (err) {
        toast.error("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="rounded-2xl border border-[var(--border-c)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-[var(--text)]">Backup, Restore & Reset</h4>
          <p className="text-xs text-[var(--text-sub)] mt-0.5">Export your workspace configuration to JSON or restore from backup.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl bg-[var(--amber-low)] border border-[var(--amber)]/30 text-[var(--amber)] px-4 py-2 text-xs font-semibold hover:bg-[var(--amber)] hover:text-black transition-colors"
        >
          <Download size={14} /> Export Backup (JSON)
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] text-[var(--text)] px-4 py-2 text-xs font-semibold hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors"
        >
          <Upload size={14} /> Import Backup (JSON)
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => {
            if (confirm("Are you sure you want to reset all settings to factory defaults?")) {
              onReset();
              toast.success("Settings reset to defaults");
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-[var(--crit)]/40 bg-[var(--crit)]/10 text-[var(--crit)] px-4 py-2 text-xs font-semibold hover:bg-[var(--crit)] hover:text-black transition-colors ml-auto"
        >
          <RotateCcw size={14} /> Reset Defaults
        </button>
      </div>
    </div>
  );
}
