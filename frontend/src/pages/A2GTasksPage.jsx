import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "../lib/apiClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  CheckSquare, Plus, Trash2, Filter, RefreshCw,
  Clock, AlertCircle, ArrowUp, ArrowDown, Minus,
  CheckCircle2, Circle, Loader2, Plug, MessageSquare,
  Send, ChevronDown, ChevronUp, Check, X, Zap,
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-500", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  high:   { label: "High",   color: "bg-orange-500", icon: <ArrowUp className="w-3.5 h-3.5" /> },
  normal: { label: "Normal", color: "bg-blue-500", icon: <Minus className="w-3.5 h-3.5" /> },
  low:    { label: "Low",    color: "bg-slate-400", icon: <ArrowDown className="w-3.5 h-3.5" /> },
};

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending",     icon: <Circle className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "in_progress", label: "In Progress", icon: <Loader2 className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "completed",   label: "Completed",   icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
];

// ── Comment thread per task ───────────────────────────────────────────────────
const CommentThread = ({ task }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const isExternal = task.source && task.source !== "manual";

  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/tasks/${task.id}/comments`);
      setComments(res.data);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await apiClient.post(`/tasks/${task.id}/comments`, { comment: text.trim() });
      setComments(c => [...c, res.data]);
      setText("");
      if (res.data.pushed) {
        toast.success(`Comment sent to ${task.source}`);
      } else if (isExternal && !res.data.pushed) {
        toast.info("Comment saved. No push URL configured for this source.");
      }
    } catch {
      toast.error("Failed to send comment");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="mt-3 pt-3 border-t space-y-3">
      {/* Comments list */}
      {loading ? (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{(c.user_name || "?")[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold">{c.user_name}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(c.created_at)}</span>
                  {c.pushed && (
                    <span className="text-xs flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                      <Zap className="w-3 h-3" /> sent
                    </span>
                  )}
                </div>
                <p className="text-sm mt-0.5 leading-snug">{c.content || c.comment}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={isExternal ? `Comment and send to ${task.source}...` : "Add a comment..."}
          className="h-8 text-sm flex-1"
          data-testid={`comment-input-${task.id}`}
        />
        <Button size="sm" className="h-8 gap-1.5 px-3" onClick={send} disabled={sending || !text.trim()}
          data-testid={`comment-send-${task.id}`}>
          {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {isExternal ? "Send" : "Add"}
        </Button>
      </div>
      {isExternal && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Plug className="w-3 h-3" />
          Comments will be pushed to <strong>{task.source}</strong> if a push URL is configured in Integrations.
        </p>
      )}
    </div>
  );
};

// ── Task row ──────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onDelete, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal;
  const isExternal = task.source && task.source !== "manual";

  const due = (() => {
    if (!task.due_date) return null;
    const date = new Date(task.due_date);
    const today = new Date();
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, cls: "text-red-500 font-medium" };
    if (diff === 0) return { text: "Due today", cls: "text-orange-500 font-medium" };
    if (diff === 1) return { text: "Due tomorrow", cls: "text-yellow-600" };
    return { text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), cls: "text-muted-foreground" };
  })();

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await apiClient.put(`/tasks/${task.id}`, { status: newStatus });

      onStatusChange(task.id, newStatus);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const currentStatusCfg = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0];

  return (
    <div className={`rounded-lg border bg-card transition-all ${task.status === "completed" ? "opacity-60" : ""}`}
      data-testid={`task-row-${task.id}`}>
      <div className="flex items-start gap-3 p-3">
        {/* Status selector */}
        <div className="mt-0.5 shrink-0">
          <Select value={task.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
            <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent focus:ring-0 shadow-none" data-testid={`status-select-${task.id}`}>
              <SelectValue>
                {statusUpdating ? <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" /> : currentStatusCfg.icon}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">{s.icon} {s.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full text-white ${pCfg.color}`}>
              {pCfg.icon} {pCfg.label}
            </span>
            {isExternal && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-1.5 py-0.5">
                <Plug className="w-3 h-3" /> {task.source}
              </span>
            )}
            {due && <span className={`text-xs flex items-center gap-1 ${due.cls}`}><Clock className="w-3 h-3" /> {due.text}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="ghost" className={`h-7 px-2 gap-1 text-xs ${expanded ? "text-blue-500" : "text-muted-foreground"}`}
            onClick={() => setExpanded(v => !v)} data-testid={`task-expand-${task.id}`}>
            <MessageSquare className="w-3.5 h-3.5" />
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <button onClick={() => onDelete(task.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            data-testid={`task-delete-${task.id}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable comment thread */}
      {expanded && (
        <div className="px-3 pb-3">
          <CommentThread task={task} />
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", priority: "normal", status: "pending" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/tasks");
      setTasks(res.data);
    } catch { toast.error("Failed to load tasks"); }
    finally { setLoading(false); }
  };

  const addTask = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await apiClient.post("/tasks", form);
      toast.success("Task created");
      setShowAddDialog(false);
      setForm({ title: "", description: "", due_date: "", priority: "normal", status: "pending" });
      loadTasks();
    } catch { toast.error("Failed to create task"); }
    finally { setSaving(false); }
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(t => t.map(x => x.id === taskId ? { ...x, status: newStatus } : x));
  };

  const deleteTask = async (id) => {
    try {
      await apiClient.delete(`/tasks/${id}`);
      toast.success("Task deleted");
      setDeleteTaskId(null);
      setTasks(t => t.filter(x => x.id !== id));
    } catch { toast.error("Failed to delete task"); }
  };

  const sources = ["all", ...new Set(tasks.map(t => t.source).filter(Boolean))];
  const filtered = tasks.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterSource !== "all" && t.source !== filterSource) return false;
    return true;
  });

  const counts = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6" data-testid="tasks-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-500" /> Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tasks from connected apps. Click the status icon to update — external tasks push changes back automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTasks} data-testid="refresh-tasks-btn">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setShowAddDialog(true)} data-testid="add-task-btn" className="gap-2">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, color: "text-foreground", v: "all" },
          { label: "Pending", value: counts.pending, color: "text-slate-500", v: "pending" },
          { label: "In Progress", value: counts.in_progress, color: "text-blue-500", v: "in_progress" },
          { label: "Completed", value: counts.completed, color: "text-emerald-500", v: "completed" },
        ].map(s => (
          <Card key={s.label}
            className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === s.v ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setFilterStatus(s.v)} data-testid={`stat-${s.v}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36 h-8 text-xs" data-testid="filter-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-44 h-8 text-xs" data-testid="filter-source">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            {sources.map(s => (
              <SelectItem key={s} value={s}>{s === "all" ? "All Sources" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterStatus !== "all" || filterPriority !== "all" || filterSource !== "all") && (
          <Button size="sm" variant="ghost" className="h-8 text-xs"
            onClick={() => { setFilterStatus("all"); setFilterPriority("all"); setFilterSource("all"); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading tasks...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">{tasks.length === 0 ? "No tasks yet" : "No tasks match filters"}</p>
          <p className="text-sm mt-1">
            {tasks.length === 0 ? "Create a task or connect an external app from Integrations." : "Try changing your filter options."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <TaskRow key={task.id} task={task}
              onDelete={(id) => setDeleteTaskId(id)}
              onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4" /> New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input placeholder="Task title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1"
                data-testid="task-title-input" />
            </div>
            <div>
              <Label>Description</Label>
              <Input placeholder="Optional description" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={addTask} disabled={saving} data-testid="save-task-btn">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(o) => !o && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the task.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteTask(deleteTaskId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TasksPage;
