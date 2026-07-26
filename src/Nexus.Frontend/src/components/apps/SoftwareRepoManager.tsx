import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  RotateCcw,
  Search,
  Check,
  X,
  Globe,
  Settings,
  Layers,
  Sparkles,
  Download,
  Terminal,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import {
  getSoftwareCatalog,
  addSoftwareCatalogItem,
  updateSoftwareCatalogItem,
  deleteSoftwareCatalogItem,
  resetSoftwareCatalog,
  type SoftwareCatalogItem
} from "@/api/client";

interface SoftwareRepoManagerProps {
  onSelectDeploy?: (item: SoftwareCatalogItem) => void;
  isModal?: boolean;
}

export function SoftwareRepoManager({ onSelectDeploy, isModal = false }: SoftwareRepoManagerProps) {
  const [catalog, setCatalog] = useState<SoftwareCatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Repository Feed & Settings state
  const [repoFeedUrl, setRepoFeedUrl] = useState("https://repo.nexuslab.local/winget");
  const [syncInterval, setSyncInterval] = useState("Daily");
  const [autoApproveUpdates, setAutoApproveUpdates] = useState(true);
  const [cacheSharePath, setCacheSharePath] = useState("\\\\dc01.nexuslab.local\\NEXUS_SoftwareRepo");
  const [defaultMsiFlags, setDefaultMsiFlags] = useState("/qn /norestart");

  // Editing / Adding state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formPublisher, setFormPublisher] = useState("");
  const [formVersion, setFormVersion] = useState("");
  const [formCategory, setFormCategory] = useState("Utilities");
  const [formDescription, setFormDescription] = useState("");
  const [formSizeMB, setFormSizeMB] = useState("25.0");
  const [formSilentArgs, setFormSilentArgs] = useState("/qn /norestart");
  const [formPackageId, setFormPackageId] = useState("");

  const refreshCatalog = () => {
    const data = getSoftwareCatalog();
    setCatalog(data);
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  const categories = Array.from(new Set(["ALL", ...catalog.map((i) => i.category || "Utilities")])).sort();

  const filteredCatalog = catalog.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.publisher.toLowerCase().includes(q) ||
        item.packageId.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormPublisher("");
    setFormVersion("1.0.0");
    setFormCategory("Utilities");
    setFormDescription("");
    setFormSizeMB("25.0");
    setFormSilentArgs("/qn /norestart");
    setFormPackageId("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: SoftwareCatalogItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormPublisher(item.publisher);
    setFormVersion(item.version);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormSizeMB(item.sizeMB.toString());
    setFormSilentArgs(item.silentArgs);
    setFormPackageId(item.packageId);
    setIsFormOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPackageId.trim()) {
      toast.error("Package Name and Package ID are required.");
      return;
    }

    const sizeNum = parseFloat(formSizeMB) || 10.0;

    if (editingId) {
      updateSoftwareCatalogItem(editingId, {
        name: formName,
        publisher: formPublisher || "Custom Publisher",
        version: formVersion || "1.0.0",
        category: formCategory || "Utilities",
        description: formDescription || "Enterprise package repository item.",
        sizeMB: sizeNum,
        silentArgs: formSilentArgs || "/qn /norestart",
        packageId: formPackageId
      });
      toast.success(`Updated package "${formName}"`);
    } else {
      addSoftwareCatalogItem({
        name: formName,
        publisher: formPublisher || "Custom Publisher",
        version: formVersion || "1.0.0",
        category: formCategory || "Utilities",
        description: formDescription || "Enterprise package repository item.",
        sizeMB: sizeNum,
        silentArgs: formSilentArgs || "/qn /norestart",
        packageId: formPackageId
      });
      toast.success(`Added new package "${formName}" to repository`);
    }

    setIsFormOpen(false);
    refreshCatalog();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the repository?`)) return;
    deleteSoftwareCatalogItem(id);
    toast.success(`Removed "${name}" from repository`);
    refreshCatalog();
  };

  const handleReset = () => {
    if (!confirm("Reset software repository back to standard default packages?")) return;
    resetSoftwareCatalog();
    toast.success("Repository reset to default catalog");
    refreshCatalog();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Repository Sync Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30">
            <Package size={22} />
          </div>
          <div>
            <h3 className="display text-base font-bold text-[var(--text)] flex items-center gap-2">
              NEXUS Software Package Repository
              <span className="mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--amber-low)] text-[var(--amber)] font-semibold border border-[var(--amber)]/30">
                {catalog.length} Packages
              </span>
            </h3>
            <p className="mono text-[11px] text-[var(--text-sub)]">
              Enterprise Winget / Chocolatey repository feed and silent application distribution hub.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reset Catalog Defaults"
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors">
            <RotateCcw size={13} /> Reset Defaults
          </button>

          <button
            onClick={handleOpenAdd}
            className="mono flex items-center gap-1.5 rounded-md bg-[var(--amber)] px-3.5 py-1.5 text-[11px] font-semibold text-black hover:bg-[var(--amber)]/90 transition-colors shadow-sm">
            <Plus size={14} /> Add New Package
          </button>
        </div>
      </div>

      {/* Package Form Modal / Collapsible */}
      {isFormOpen && (
        <form onSubmit={handleSaveItem} className="p-4 rounded-xl border border-[var(--amber)]/50 bg-[var(--bg-surface)] space-y-4 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-c)]">
            <span className="mono text-[12px] font-bold text-[var(--amber)] flex items-center gap-2">
              <Package size={14} /> {editingId ? "Edit Software Repository Package" : "Add New Package to Repository"}
            </span>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[var(--text-ghost)] font-mono mb-1">Package Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. VLC Media Player v3.0"
                className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] text-[var(--text)] focus:border-[var(--amber)] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[var(--text-ghost)] font-mono mb-1">Publisher</label>
              <input
                type="text"
                value={formPublisher}
                onChange={(e) => setFormPublisher(e.target.value)}
                placeholder="e.g. VideoLAN Organization"
                className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] text-[var(--text)] focus:border-[var(--amber)] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[var(--text-ghost)] font-mono mb-1">Package ID / Winget ID *</label>
              <input
                type="text"
                required
                value={formPackageId}
                onChange={(e) => setFormPackageId(e.target.value)}
                placeholder="e.g. VideoLAN.VLC"
                className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] mono text-[var(--amber)] focus:border-[var(--amber)] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[var(--text-ghost)] font-mono mb-1">Version</label>
              <input
                type="text"
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                placeholder="3.0.20"
                className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] text-[var(--text)] focus:border-[var(--amber)] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[var(--text-ghost)] font-mono mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] text-[var(--text)] focus:border-[var(--amber)] outline-none">
                <option value="Utilities">Utilities</option>
                <option value="Development">Development</option>
                <option value="System Tools">System Tools</option>
                <option value="Networking">Networking</option>
                <option value="Management">Management</option>
                <option value="Web & Enterprise">Web & Enterprise</option>
                <option value="Media & Productivity">Media & Productivity</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[var(--text-ghost)] font-mono mb-1">Size (MB)</label>
              <input
                type="number"
                step="0.1"
                value={formSizeMB}
                onChange={(e) => setFormSizeMB(e.target.value)}
                className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] text-[var(--text)] focus:border-[var(--amber)] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[var(--text-ghost)] font-mono mb-1">Silent Arguments Command</label>
            <input
              type="text"
              value={formSilentArgs}
              onChange={(e) => setFormSilentArgs(e.target.value)}
              placeholder="/S /qn /norestart"
              className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] mono text-[var(--amber)] focus:border-[var(--amber)] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[var(--text-ghost)] font-mono mb-1">Package Description</label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Detailed description of software package and usage..."
              className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] p-2.5 text-[12px] text-[var(--text)] focus:border-[var(--amber)] outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-c)]">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="mono px-3 py-1.5 rounded border border-[var(--border-c)] text-[11px] text-[var(--text-sub)] hover:text-[var(--text)]">
              Cancel
            </button>
            <button
              type="submit"
              className="mono px-4 py-1.5 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90 transition-colors">
              Save Package
            </button>
          </div>
        </form>
      )}

      {/* Repository Feeds & Distribution Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)]">
        <div>
          <label className="block text-[10px] uppercase font-mono text-[var(--text-ghost)] mb-1">Winget / Chocolatey Enterprise Mirror Feed</label>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-[var(--amber)]" />
            <input
              type="text"
              value={repoFeedUrl}
              onChange={(e) => setRepoFeedUrl(e.target.value)}
              className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1 text-[11px] mono text-[var(--text)] focus:border-[var(--amber)] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-mono text-[var(--text-ghost)] mb-1">Repository SMB Network Cache Share Path</label>
          <div className="flex items-center gap-2">
            <FolderOpen size={14} className="text-[var(--amber)]" />
            <input
              type="text"
              value={cacheSharePath}
              onChange={(e) => setCacheSharePath(e.target.value)}
              className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1 text-[11px] mono text-[var(--text)] focus:border-[var(--amber)] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repository by name, publisher, package ID..."
            className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-9 pr-3 text-[12px] text-[var(--text)] placeholder-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-md border border-[var(--border-c)]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`mono rounded px-2.5 py-0.5 text-[10px] transition-colors ${
                selectedCategory === cat
                  ? "bg-[var(--amber)] text-black font-semibold"
                  : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-card)]"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredCatalog.length === 0 ? (
          <div className="col-span-2 py-10 text-center text-[12px] text-[var(--text-sub)] border border-dashed border-[var(--border-c)] rounded-xl">
            No software packages found matching search criteria.
          </div>
        ) : (
          filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] hover:border-[var(--amber)] transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] px-2 py-0.5 rounded bg-[var(--amber-low)] text-[var(--amber)] font-semibold border border-[var(--amber)]/30">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[10px] text-[var(--text-ghost)]">{item.sizeMB} MB</span>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Package"
                      className="text-[var(--text-ghost)] hover:text-[var(--amber)] p-1 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      title="Delete Package"
                      className="text-[var(--text-ghost)] hover:text-[var(--crit)] p-1 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h4 className="display text-sm font-semibold text-[var(--text)] mt-2">{item.name}</h4>
                <div className="mono text-[10px] text-[var(--text-sub)] mb-1 flex items-center gap-2">
                  <span>Publisher: {item.publisher}</span>
                  <span>•</span>
                  <span className="text-[var(--amber)]">{item.packageId}</span>
                </div>
                <p className="mono text-[11px] text-[var(--text-ghost)] line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--border-dim)] flex items-center justify-between">
                <div className="mono text-[10px] text-[var(--amber)] truncate max-w-[200px]" title={item.silentArgs}>
                  {item.silentArgs}
                </div>

                {onSelectDeploy && (
                  <button
                    onClick={() => onSelectDeploy(item)}
                    className="mono flex items-center gap-1 px-3 py-1 rounded bg-[var(--amber)] text-black text-[11px] font-semibold hover:bg-[var(--amber)]/90 transition-colors">
                    Deploy
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
