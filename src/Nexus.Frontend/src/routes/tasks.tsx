import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getTasksClient,
  runTaskClient,
  toggleTaskClient,
  deleteTaskClient,
  createTaskClient,
  editTaskClient,
  exportTaskXmlClient,
  type ScheduledTask
} from "@/api/client";
import {
  Play,
  Power,
  Trash2,
  Plus,
  Upload,
  RefreshCw,
  FileCode,
  History,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Folder,
  Search,
  Copy,
  Download,
  Edit3,
  Filter,
  Layers,
  Terminal,
  CheckSquare,
  Square,
  ChevronRight,
  Info,
  X
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Scheduled Tasks — NEXUS" },
      { name: "description", content: "Manage Windows scheduled tasks, automation jobs, and task XML configurations." }
    ]
  }),
  component: TasksPage
});

function TasksPage() {
  const [server, setServer] = useState("dc01");
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [sel, setSel] = useState<ScheduledTask | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [checkedTaskPaths, setCheckedTaskPaths] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "triggers" | "history" | "xml">("overview");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [xmlContent, setXmlContent] = useState<string>("");
  const [isXmlLoading, setIsXmlLoading] = useState<boolean>(false);

  // New/Edit task form state
  const [taskForm, setTaskForm] = useState<{
    name: string;
    path: string;
    author: string;
    description: string;
    action: string;
    runAsUser: string;
    runWithHighestPrivileges: boolean;
    hidden: boolean;
    triggerType: string;
    triggerTime: string;
  }>({
    name: "",
    path: "\\NEXUS\\Maintenance",
    author: "NEXUSLAB\\Administrator",
    description: "",
    action: "powershell.exe -File C:\\Scripts\\Task.ps1",
    runAsUser: "NT AUTHORITY\\SYSTEM",
    runWithHighestPrivileges: true,
    hidden: false,
    triggerType: "Daily",
    triggerTime: "02:00"
  });

  // Import XML state
  const [importXmlText, setImportXmlText] = useState("");

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await getTasksClient(server);
      setTasks(data);
      if (sel) {
        const fullSelPath = (sel.path.endsWith("\\") ? sel.path + sel.name : sel.path + "\\" + sel.name).replace(/[\/\\]+/g, "\\");
        const found = data.find(t => {
          const fullP = (t.path.endsWith("\\") ? t.path + t.name : t.path + "\\" + t.name).replace(/[\/\\]+/g, "\\");
          return fullP === fullSelPath;
        });
        setSel(found || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    setCheckedTaskPaths([]);
  }, [server]);

  // Load XML content when selecting XML tab
  useEffect(() => {
    if (sel && activeTab === "xml") {
      setIsXmlLoading(true);
      const fullPath = getFullPath(sel);
      exportTaskXmlClient(server, fullPath)
        .then(xml => setXmlContent(xml))
        .finally(() => setIsXmlLoading(false));
    }
  }, [sel, activeTab, server]);

  const getFullPath = (t: ScheduledTask) => {
    return (t.path.endsWith("\\") ? t.path + t.name : t.path + "\\" + t.name).replace(/[\/\\]+/g, "\\");
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const ready = tasks.filter(t => t.status === "Ready").length;
    const running = tasks.filter(t => t.status === "Running").length;
    const disabled = tasks.filter(t => t.status === "Disabled").length;
    const failed = tasks.filter(t => t.status === "Failed" || (t.lastResult && !t.lastResult.includes("0x0"))).length;
    return { total, ready, running, disabled, failed };
  }, [tasks]);

  // Library Folders tree
  const libraryFolders = useMemo(() => {
    const folders = new Set<string>();
    tasks.forEach(t => {
      folders.add(t.path);
      let p = t.path;
      while (p.lastIndexOf("\\") > 0) {
        p = p.substring(0, p.lastIndexOf("\\"));
        if (p) folders.add(p);
      }
    });
    return Array.from(folders).sort();
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Folder filter
      if (selectedFolder !== "ALL") {
        if (t.path !== selectedFolder && !t.path.startsWith(selectedFolder + "\\")) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "Failed" && (t.status === "Failed" || (t.lastResult && !t.lastResult.includes("0x0")))) {
          // match failed
        } else if (t.status !== statusFilter) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullP = getFullPath(t).toLowerCase();
        const action = (t.action || "").toLowerCase();
        const author = (t.author || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          fullP.includes(q) ||
          action.includes(q) ||
          author.includes(q) ||
          desc.includes(q)
        );
      }
      return true;
    });
  }, [tasks, selectedFolder, statusFilter, searchQuery]);

  // Handle run task
  const handleRunTask = async (taskToRun: ScheduledTask) => {
    setIsActivating(true);
    try {
      const fullPath = getFullPath(taskToRun);
      const ok = await runTaskClient(server, fullPath);
      if (ok) {
        toast.success(`Task "${taskToRun.name}" triggered successfully.`);
        await fetchTasks();
      } else {
        toast.error(`Failed to run task "${taskToRun.name}".`);
      }
    } finally {
      setIsActivating(false);
    }
  };

  // Handle toggle task
  const handleToggleTask = async (taskToToggle: ScheduledTask) => {
    const isCurrentlyDisabled = taskToToggle.status === "Disabled";
    const enable = isCurrentlyDisabled;
    const actionName = enable ? "Enable" : "Disable";
    const fullPath = getFullPath(taskToToggle);

    try {
      const ok = await toggleTaskClient(server, fullPath, enable);
      if (ok) {
        toast.success(`Task "${taskToToggle.name}" ${enable ? "enabled" : "disabled"}.`);
        await fetchTasks();
      } else {
        toast.error(`Failed to ${actionName.toLowerCase()} task.`);
      }
    } catch (e) {
      toast.error("Toggle task error");
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskToDelete: ScheduledTask) => {
    if (!confirm(`Are you sure you want to delete task "${taskToDelete.name}"?`)) return;
    const fullPath = getFullPath(taskToDelete);
    try {
      const ok = await deleteTaskClient(server, fullPath);
      if (ok) {
        toast.success(`Task "${taskToDelete.name}" deleted.`);
        if (sel && getFullPath(sel) === fullPath) {
          setSel(null);
        }
        await fetchTasks();
      } else {
        toast.error("Failed to delete task.");
      }
    } catch (e) {
      toast.error("Delete task error");
    }
  };

  // Handle check selection
  const toggleCheckTask = (fullPath: string) => {
    setCheckedTaskPaths(prev =>
      prev.includes(fullPath) ? prev.filter(p => p !== fullPath) : [...prev, fullPath]
    );
  };

  const toggleSelectAll = () => {
    if (checkedTaskPaths.length === filteredTasks.length) {
      setCheckedTaskPaths([]);
    } else {
      setCheckedTaskPaths(filteredTasks.map(t => getFullPath(t)));
    }
  };

  // Batch operations
  const handleBatchRun = async () => {
    if (checkedTaskPaths.length === 0) return;
    toast.info(`Triggering ${checkedTaskPaths.length} tasks...`);
    for (const p of checkedTaskPaths) {
      await runTaskClient(server, p);
    }
    toast.success(`Batch execution complete.`);
    await fetchTasks();
  };

  const handleBatchToggle = async (enable: boolean) => {
    if (checkedTaskPaths.length === 0) return;
    for (const p of checkedTaskPaths) {
      await toggleTaskClient(server, p, enable);
    }
    toast.success(`Batch ${enable ? "enable" : "disable"} complete.`);
    await fetchTasks();
  };

  const handleBatchDelete = async () => {
    if (checkedTaskPaths.length === 0) return;
    if (!confirm(`Delete ${checkedTaskPaths.length} selected tasks?`)) return;
    for (const p of checkedTaskPaths) {
      await deleteTaskClient(server, p);
    }
    toast.success(`Batch delete complete.`);
    setCheckedTaskPaths([]);
    setSel(null);
    await fetchTasks();
  };

  // Create / Edit modal handler
  const openCreateModal = () => {
    setIsEditing(false);
    setTaskForm({
      name: "",
      path: "\\NEXUS\\Maintenance",
      author: "NEXUSLAB\\Administrator",
      description: "",
      action: "powershell.exe -ExecutionPolicy Bypass -File C:\\Scripts\\NewTask.ps1",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: true,
      hidden: false,
      triggerType: "Daily",
      triggerTime: "02:00"
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (taskToEdit: ScheduledTask) => {
    setIsEditing(true);
    setTaskForm({
      name: taskToEdit.name,
      path: taskToEdit.path,
      author: taskToEdit.author || "NEXUSLAB\\Administrator",
      description: taskToEdit.description || "",
      action: taskToEdit.action || "powershell.exe",
      runAsUser: taskToEdit.runAsUser || "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: taskToEdit.runWithHighestPrivileges ?? true,
      hidden: taskToEdit.hidden ?? false,
      triggerType: "Daily",
      triggerTime: "03:00"
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveTaskForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.name.trim()) {
      toast.error("Task name is required");
      return;
    }

    const newTaskObj: ScheduledTask = {
      name: taskForm.name.trim(),
      path: taskForm.path.trim() || "\\",
      status: "Ready",
      lastRun: "Never",
      lastResult: "0x0 (Ready)",
      nextRun: `Daily at ${taskForm.triggerTime}`,
      triggers: [`${taskForm.triggerType} at ${taskForm.triggerTime}`],
      author: taskForm.author,
      description: taskForm.description,
      action: taskForm.action,
      runAsUser: taskForm.runAsUser,
      runWithHighestPrivileges: taskForm.runWithHighestPrivileges,
      hidden: taskForm.hidden
    };

    if (isEditing && sel) {
      const origPath = getFullPath(sel);
      const ok = await editTaskClient(server, origPath, newTaskObj);
      if (ok) {
        toast.success(`Task "${newTaskObj.name}" updated successfully.`);
        setIsCreateModalOpen(false);
        await fetchTasks();
      } else {
        toast.error("Failed to update task.");
      }
    } else {
      const ok = await createTaskClient(server, newTaskObj);
      if (ok) {
        toast.success(`Task "${newTaskObj.name}" created successfully.`);
        setIsCreateModalOpen(false);
        await fetchTasks();
      } else {
        toast.error("Failed to create task. Task may already exist.");
      }
    }
  };

  // Import XML Handler
  const handleImportXml = async () => {
    if (!importXmlText.trim()) {
      toast.error("XML content is required");
      return;
    }

    // Basic parse for name
    const nameMatch = importXmlText.match(/<URI>(?:.*\\)?([^<]+)<\/URI>/i) || importXmlText.match(/<Task[^>]*name=["']([^"']+)["']/i);
    const parsedName = nameMatch ? nameMatch[1] : "ImportedTask_" + Math.floor(Math.random() * 1000);

    const importedTask: ScheduledTask = {
      name: parsedName,
      path: "\\Imported",
      status: "Ready",
      lastRun: "Never",
      lastResult: "0x0 (Imported)",
      nextRun: "Scheduled",
      triggers: ["Imported from XML configuration"],
      author: "NEXUSLAB\\Administrator",
      description: "Imported via Task Scheduler XML definition",
      action: "powershell.exe -Command \"Write-Output 'Imported Task Executed'\"",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: true,
      hidden: false
    };

    const ok = await createTaskClient(server, importedTask);
    if (ok) {
      toast.success(`Task "${parsedName}" imported successfully from XML.`);
      setIsImportModalOpen(false);
      setImportXmlText("");
      await fetchTasks();
    } else {
      toast.error("Failed to import task XML.");
    }
  };

  // Download XML file
  const handleDownloadXml = () => {
    if (!xmlContent || !sel) return;
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sel.name}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${sel.name}.xml`);
  };

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Scheduled Tasks" />
      
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <ServerSelector value={server} onChange={setServer} />
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            disabled={isLoading}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[11px] text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors">
            <RefreshCw size={13} className={isLoading ? "animate-spin text-[var(--amber)]" : ""} /> Refresh
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[11px] text-[var(--text)] hover:border-[var(--amber)] hover:bg-[var(--bg-surface)] transition-colors">
            <Upload size={13} /> Import XML
          </button>
          <button
            onClick={openCreateModal}
            className="mono flex items-center gap-1.5 rounded-md bg-[var(--amber)] px-3.5 py-1.5 text-[11px] font-medium text-black hover:bg-[var(--amber)]/90 transition-colors shadow-sm">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-3">
        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Total Tasks</span>
            <Layers size={13} className="text-[var(--text-ghost)]" />
          </div>
          <div className="display text-xl font-bold pt-1">{metrics.total}</div>
        </div>

        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Ready / Scheduled</span>
            <CheckCircle2 size={13} className="text-[var(--ok)]" />
          </div>
          <div className="display text-xl font-bold pt-1 text-[var(--ok)]">{metrics.ready}</div>
        </div>

        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Running</span>
            <Clock size={13} className="text-[var(--amber)]" />
          </div>
          <div className="display text-xl font-bold pt-1 text-[var(--amber)]">{metrics.running}</div>
        </div>

        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Disabled</span>
            <Power size={13} className="text-[var(--text-ghost)]" />
          </div>
          <div className="display text-xl font-bold pt-1 text-[var(--text-sub)]">{metrics.disabled}</div>
        </div>

        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Failed Jobs</span>
            <AlertCircle size={13} className={metrics.failed > 0 ? "text-[var(--crit)]" : "text-[var(--text-ghost)]"} />
          </div>
          <div className={`display text-xl font-bold pt-1 ${metrics.failed > 0 ? "text-[var(--crit)]" : "text-[var(--text-sub)]"}`}>
            {metrics.failed}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="nx-card p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks by name, path, action, or author..."
              className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-9 pr-3 text-[12px] text-[var(--text)] placeholder-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-md border border-[var(--border-c)]">
            <span className="mono text-[10px] text-[var(--text-ghost)] px-1.5 uppercase">Status:</span>
            {["ALL", "Ready", "Running", "Disabled", "Failed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`mono rounded px-2 py-0.5 text-[10px] transition-colors ${
                  statusFilter === s
                    ? "bg-[var(--amber)] text-black font-semibold"
                    : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-card)]"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batch Actions Toolbar if any checked */}
      {checkedTaskPaths.length > 0 && (
        <div className="nx-card p-2.5 mb-3 bg-[var(--amber-low)]/30 border border-[var(--amber)]/40 flex items-center justify-between">
          <div className="mono text-[11px] text-[var(--amber)] font-medium flex items-center gap-2">
            <CheckSquare size={14} /> {checkedTaskPaths.length} task(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchRun}
              className="mono flex items-center gap-1 rounded bg-[var(--amber)] px-2.5 py-1 text-[10px] font-medium text-black hover:bg-[var(--amber)]/90">
              <Play size={11} /> Run Selected
            </button>
            <button
              onClick={() => handleBatchToggle(true)}
              className="mono flex items-center gap-1 rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] text-[var(--text)] hover:border-[var(--amber)]">
              <Power size={11} /> Enable
            </button>
            <button
              onClick={() => handleBatchToggle(false)}
              className="mono flex items-center gap-1 rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] text-[var(--text)] hover:border-[var(--amber)]">
              <Power size={11} /> Disable
            </button>
            <button
              onClick={handleBatchDelete}
              className="mono flex items-center gap-1 rounded border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-2.5 py-1 text-[10px] text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black">
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Sidebar + Task Table + Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] gap-4">
        {/* Library Folder Navigation */}
        <aside className="nx-card p-3 h-fit">
          <div className="eyebrow px-1 pb-2 flex items-center justify-between border-b border-[var(--border-dim)] mb-2">
            <span>Library Folders</span>
            <Folder size={13} className="text-[var(--text-ghost)]" />
          </div>

          <div className="flex flex-col gap-0.5 max-h-[600px] overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedFolder("ALL")}
              className={`mono flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] transition-colors ${
                selectedFolder === "ALL"
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-medium"
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}>
              <div className="flex items-center gap-1.5 truncate">
                <Folder size={12} className={selectedFolder === "ALL" ? "text-[var(--amber)]" : "text-[var(--text-ghost)]"} />
                <span className="truncate">All Tasks</span>
              </div>
              <span className="mono text-[10px] text-[var(--text-ghost)] shrink-0">{tasks.length}</span>
            </button>

            {libraryFolders.map((f) => {
              const count = tasks.filter((t) => t.path === f || t.path.startsWith(f + "\\")).length;
              return (
                <button
                  key={f}
                  title={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`mono flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] transition-colors ${
                    selectedFolder === f
                      ? "bg-[var(--amber-low)] text-[var(--amber)] font-medium"
                      : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
                  }`}>
                  <div className="flex items-center gap-1.5 truncate">
                    <ChevronRight size={11} className="text-[var(--text-ghost)] shrink-0" />
                    <span className="truncate">{f}</span>
                  </div>
                  <span className="mono text-[10px] text-[var(--text-ghost)] shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Task Table */}
        <div className="nx-card overflow-hidden flex flex-col min-h-[500px] max-h-[700px]">
          <div className="overflow-auto flex-1">
            <table className="w-full text-[12px] text-left">
              <thead className="sticky top-0 bg-[var(--bg-card)] shadow-sm z-10 border-b border-[var(--border-c)]">
                <tr className="eyebrow">
                  <th className="px-3 py-2.5 w-8">
                    <button onClick={toggleSelectAll} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                      {checkedTaskPaths.length > 0 && checkedTaskPaths.length === filteredTasks.length ? (
                        <CheckSquare size={14} className="text-[var(--amber)]" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2.5">Task Name & Folder</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Triggers</th>
                  <th className="px-3 py-2.5">Last Run</th>
                  <th className="px-3 py-2.5">Next Run</th>
                  <th className="px-3 py-2.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="mono divide-y divide-[var(--border-dim)]">
                {isLoading && tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-sub)]">
                      <RefreshCw size={18} className="animate-spin inline-block mr-2 text-[var(--amber)]" />
                      Loading scheduled tasks...
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-sub)]">
                      No scheduled tasks found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const fullP = getFullPath(t);
                    const isChecked = checkedTaskPaths.includes(fullP);
                    const isSelected = sel ? getFullPath(sel) === fullP : false;

                    return (
                      <tr
                        key={fullP}
                        onClick={() => setSel(t)}
                        className={`cursor-pointer transition-colors hover:bg-[var(--bg-surface)] ${
                          isSelected ? "bg-[var(--amber-low)]" : ""
                        }`}>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleCheckTask(fullP)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                            {isChecked ? <CheckSquare size={14} className="text-[var(--amber)]" /> : <Square size={14} />}
                          </button>
                        </td>

                        <td className="px-3 py-2.5 max-w-[220px]">
                          <div className="font-semibold text-[var(--text)] truncate" title={t.name}>
                            {t.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-ghost)] truncate">{t.path}</div>
                        </td>

                        <td className="px-3 py-2.5">
                          <StatusBadge status={t.status === "Running" ? "Syncing" : t.status}>{t.status}</StatusBadge>
                        </td>

                        <td className="px-3 py-2.5 max-w-[180px]">
                          <div className="text-[11px] text-[var(--text-sub)] truncate" title={t.triggers?.join(", ") || "None"}>
                            {t.triggers?.[0] || "No schedule"}
                          </div>
                        </td>

                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="text-[11px] text-[var(--text-sub)]">{t.lastRun}</div>
                          <div
                            className={`text-[10px] truncate max-w-[130px] ${
                              t.lastResult?.includes("0x0") ? "text-[var(--ok)]" : "text-[var(--crit)]"
                            }`}
                            title={t.lastResult}>
                            {t.lastResult}
                          </div>
                        </td>

                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-[var(--text-sub)]">
                          {t.nextRun}
                        </td>

                        <td className="px-3 py-2.5 text-right pr-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleRunTask(t)}
                              title="Run Task Now"
                              className="p-1 rounded text-[var(--amber)] hover:bg-[var(--amber-low)] transition-colors">
                              <Play size={13} />
                            </button>
                            <button
                              onClick={() => handleToggleTask(t)}
                              title={t.status === "Disabled" ? "Enable Task" : "Disable Task"}
                              className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] transition-colors">
                              <Power size={13} />
                            </button>
                            <button
                              onClick={() => openEditModal(t)}
                              title="Edit Task"
                              className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--amber)] hover:bg-[var(--bg-surface)] transition-colors">
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t)}
                              title="Delete Task"
                              className="p-1 rounded text-[var(--crit)] hover:bg-[var(--crit)]/10 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Details Drawer */}
        <aside className="nx-card p-4 h-fit sticky top-4">
          {sel ? (
            <div>
              <div className="flex items-start justify-between pb-2 border-b border-[var(--border-dim)]">
                <div>
                  <div className="eyebrow pb-0.5">Task Inspector</div>
                  <h3 className="display text-[15px] font-semibold break-words">{sel.name}</h3>
                  <div className="mono text-[10px] text-[var(--text-sub)] break-words">{sel.path}</div>
                </div>
                <StatusBadge status={sel.status === "Running" ? "Syncing" : sel.status}>{sel.status}</StatusBadge>
              </div>

              {/* Action Buttons Bar */}
              <div className="my-3 flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleRunTask(sel)}
                  disabled={isActivating}
                  className={`mono flex items-center gap-1 rounded border border-[var(--amber)] px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                    isActivating
                      ? "opacity-50 cursor-not-allowed bg-[var(--amber-low)] text-[var(--amber)]"
                      : "bg-[var(--bg-surface)] text-[var(--amber)] hover:bg-[var(--amber-low)]"
                  }`}>
                  <Play size={11} /> {isActivating ? "Starting..." : "Run"}
                </button>

                <button
                  onClick={() => handleToggleTask(sel)}
                  className="mono flex items-center gap-1 rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--text)] hover:border-[var(--amber)] transition-colors">
                  <Power size={11} /> {sel.status === "Disabled" ? "Enable" : "Disable"}
                </button>

                <button
                  onClick={() => openEditModal(sel)}
                  className="mono flex items-center gap-1 rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--text)] hover:border-[var(--amber)] transition-colors">
                  <Edit3 size={11} /> Edit
                </button>

                <button
                  onClick={() => handleDeleteTask(sel)}
                  className="mono flex items-center gap-1 rounded border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors">
                  <Trash2 size={11} /> Delete
                </button>
              </div>

              {/* Inspector Tabs */}
              <div className="flex items-center gap-1 border-b border-[var(--border-c)] mb-3 pt-1">
                {[
                  { id: "overview", label: "Overview", icon: Info },
                  { id: "triggers", label: "Triggers", icon: Calendar },
                  { id: "history", label: "Logs", icon: History },
                  { id: "xml", label: "XML", icon: FileCode }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`mono flex items-center gap-1 py-1.5 px-2 text-[10px] uppercase tracking-wider border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-[var(--amber)] text-[var(--amber)] font-medium"
                          : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
                      }`}>
                      <Icon size={12} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-3 mono text-[11px]">
                  <div>
                    <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Author</span>
                    <span className="text-[var(--text)]">{sel.author || "NEXUSLAB\\Administrator"}</span>
                  </div>

                  <div>
                    <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Description</span>
                    <p className="text-[var(--text-sub)] text-[10px] leading-relaxed break-words">
                      {sel.description || "No description provided for this scheduled task."}
                    </p>
                  </div>

                  <div>
                    <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Action Program & Command</span>
                    <div className="bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-c)] text-[10px] break-all text-[var(--amber)]">
                      {sel.action || "powershell.exe"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border-dim)]">
                    <div>
                      <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Run As User</span>
                      <span className="text-[var(--text)] text-[10px]">{sel.runAsUser || "NT AUTHORITY\\SYSTEM"}</span>
                    </div>

                    <div>
                      <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Privileges</span>
                      <span className="text-[var(--text)] text-[10px]">
                        {sel.runWithHighestPrivileges ? "Highest Available" : "Standard"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-dim)] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-ghost)]">Last Run:</span>
                      <span className="text-[var(--text)]">{sel.lastRun}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-ghost)]">Last Exit Result:</span>
                      <span className={sel.lastResult?.includes("0x0") ? "text-[var(--ok)]" : "text-[var(--crit)]"}>
                        {sel.lastResult}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-ghost)]">Next Scheduled:</span>
                      <span className="text-[var(--text)]">{sel.nextRun}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Triggers */}
              {activeTab === "triggers" && (
                <div className="space-y-2 mono text-[11px]">
                  <div className="eyebrow pb-1">Configured Triggers</div>
                  {sel.triggers && sel.triggers.length > 0 ? (
                    <ul className="space-y-1.5">
                      {sel.triggers.map((tr, i) => (
                        <li key={i} className="p-2 bg-[var(--bg-surface)] rounded border border-[var(--border-c)] flex items-start gap-2">
                          <Calendar size={13} className="text-[var(--amber)] shrink-0 mt-0.5" />
                          <span className="text-[var(--text-sub)] text-[10px] leading-snug">{tr}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-[11px] text-[var(--text-ghost)] py-3">No triggers configured for this task.</div>
                  )}
                </div>
              )}

              {/* Tab 3: History Logs */}
              {activeTab === "history" && (
                <div className="mono text-[11px]">
                  <div className="eyebrow pb-1">Execution History</div>
                  {sel.history && sel.history.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {sel.history.map((h, i) => (
                        <div key={i} className="p-2 bg-[var(--bg-surface)] rounded border border-[var(--border-dim)] text-[10px]">
                          <div className="flex items-center justify-between text-[var(--text-ghost)] mb-1">
                            <span>{h.timestamp}</span>
                            <span className="text-[var(--amber)] font-mono">Event {h.code}</span>
                          </div>
                          <div className="font-semibold text-[var(--text)]">{h.event}</div>
                          <div className="text-[var(--text-sub)] mt-0.5">{h.details}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--text-ghost)] py-3">No execution logs logged.</div>
                  )}
                </div>
              )}

              {/* Tab 4: XML View */}
              {activeTab === "xml" && (
                <div className="mono text-[11px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">Task Scheduler XML</span>
                    <button
                      onClick={handleDownloadXml}
                      className="mono text-[10px] text-[var(--amber)] flex items-center gap-1 hover:underline">
                      <Download size={11} /> Download .xml
                    </button>
                  </div>
                  {isXmlLoading ? (
                    <div className="py-6 text-center text-[var(--text-ghost)]">Generating XML...</div>
                  ) : (
                    <textarea
                      readOnly
                      value={xmlContent}
                      className="w-full h-[260px] p-2 bg-black/80 text-[10px] font-mono text-green-400 rounded border border-[var(--border-c)] focus:outline-none resize-none"
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-[12px] text-[var(--text-sub)]">
              <Terminal size={24} className="mx-auto mb-2 text-[var(--text-ghost)] opacity-50" />
              Select a scheduled task from the list to inspect details, view triggers, check execution logs, or export XML.
            </div>
          )}
        </aside>
      </div>

      {/* New / Edit Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="nx-card w-full max-w-lg p-5 bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
              <h3 className="display text-base font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-[var(--amber)]" />
                {isEditing ? "Edit Scheduled Task" : "Create New Scheduled Task"}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTaskForm} className="space-y-3 pt-4 mono text-[12px]">
              <div>
                <label className="block text-[10px] uppercase text-[var(--text-ghost)] mb-1">Task Name *</label>
                <input
                  type="text"
                  required
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  placeholder="e.g. DailyLogRotate"
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[var(--text-ghost)] mb-1">Task Folder Path</label>
                <input
                  type="text"
                  value={taskForm.path}
                  onChange={(e) => setTaskForm({ ...taskForm, path: e.target.value })}
                  placeholder="e.g. \NEXUS\Maintenance"
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[var(--text-ghost)] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Describe the purpose of this scheduled task..."
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[var(--text-ghost)] mb-1">Action (Program / Script & Arguments)</label>
                <input
                  type="text"
                  required
                  value={taskForm.action}
                  onChange={(e) => setTaskForm({ ...taskForm, action: e.target.value })}
                  placeholder="powershell.exe -File C:\Scripts\Job.ps1"
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[var(--text-ghost)] mb-1">Trigger Frequency</label>
                  <select
                    value={taskForm.triggerType}
                    onChange={(e) => setTaskForm({ ...taskForm, triggerType: e.target.value })}
                    className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="At System Startup">At System Startup</option>
                    <option value="On User Logon">On User Logon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[var(--text-ghost)] mb-1">Schedule Time</label>
                  <input
                    type="text"
                    value={taskForm.triggerTime}
                    onChange={(e) => setTaskForm({ ...taskForm, triggerTime: e.target.value })}
                    placeholder="02:00 AM"
                    className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[var(--text-ghost)] mb-1">Run As User Account</label>
                <input
                  type="text"
                  value={taskForm.runAsUser}
                  onChange={(e) => setTaskForm({ ...taskForm, runAsUser: e.target.value })}
                  placeholder="NT AUTHORITY\SYSTEM"
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskForm.runWithHighestPrivileges}
                    onChange={(e) => setTaskForm({ ...taskForm, runWithHighestPrivileges: e.target.checked })}
                    className="accent-[var(--amber)]"
                  />
                  <span>Run with highest privileges</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskForm.hidden}
                    onChange={(e) => setTaskForm({ ...taskForm, hidden: e.target.checked })}
                    className="accent-[var(--amber)]"
                  />
                  <span>Hidden task</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-c)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded border border-[var(--border-c)] px-3 py-1.5 text-[var(--text-sub)] hover:text-[var(--text)]">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[var(--amber)] px-4 py-1.5 text-black font-semibold hover:bg-[var(--amber)]/90">
                  {isEditing ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Task XML Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="nx-card w-full max-w-lg p-5 bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
              <h3 className="display text-base font-semibold flex items-center gap-2">
                <Upload size={16} className="text-[var(--amber)]" />
                Import Task Scheduler XML
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 pt-4 mono text-[12px]">
              <p className="text-[11px] text-[var(--text-sub)]">
                Paste Windows Task Scheduler XML configuration content below to import and register task:
              </p>

              <textarea
                rows={10}
                value={importXmlText}
                onChange={(e) => setImportXmlText(e.target.value)}
                placeholder='<?xml version="1.0" encoding="UTF-16"?>&#10;<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">&#10; ... &#10;</Task>'
                className="w-full p-2.5 bg-[var(--bg-surface)] text-[11px] font-mono rounded border border-[var(--border-c)] focus:border-[var(--amber)] focus:outline-none resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-c)]">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="rounded border border-[var(--border-c)] px-3 py-1.5 text-[var(--text-sub)] hover:text-[var(--text)]">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportXml}
                  className="rounded bg-[var(--amber)] px-4 py-1.5 text-black font-semibold hover:bg-[var(--amber)]/90">
                  Import Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
