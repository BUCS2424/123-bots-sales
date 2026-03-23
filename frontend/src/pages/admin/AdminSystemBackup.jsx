import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HardDriveDownload, Download, Upload, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const formatBytes = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(2)} ${units[i]}`;
};

const AdminSystemBackup = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [latestBackup, setLatestBackup] = useState(null);
  const [pollingBackupId, setPollingBackupId] = useState(null);
  const [selectedBackupIds, setSelectedBackupIds] = useState([]);
  const [deletingBackupId, setDeletingBackupId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchBackups = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin-settings/system-backup/list`);
      const list = response.data?.backups || [];
      setBackups(list);
      setLatestBackup(list[0] || null);
      setSelectedBackupIds((prev) => prev.filter((id) => list.some((b) => b.id === id)));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load backup history.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  useEffect(() => {
    if (!pollingBackupId) return undefined;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin-settings/system-backup/list`);
        const list = response.data?.backups || [];
        setBackups(list);
        setLatestBackup(list[0] || null);

        const current = list.find((item) => item.id === pollingBackupId);
        if (!current) return;

        if (current.status === 'ready') {
          setPollingBackupId(null);
          toast({ title: 'Backup Ready', description: 'Backup is complete. You can now download the ZIP.' });
        }

        if (current.status === 'failed') {
          setPollingBackupId(null);
          toast({
            title: 'Backup Failed',
            description: current.error || 'Backup job failed on server.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        // Ignore transient polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pollingBackupId]);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    const previousIds = new Set(backups.map((b) => b.id));
    try {
      const response = await axios.post(`${API_URL}/api/admin-settings/system-backup/create`);
      const created = {
        id: response.data.backup_id,
        file_name: response.data.file_name,
        created_at: response.data.created_at,
        status: 'processing',
      };
      setLatestBackup(created);
      toast({
        title: 'Backup Started',
        description: 'Backup is processing on server. Download will enable when ready.',
      });
      setPollingBackupId(created.id);
      fetchBackups();
    } catch (error) {
      // Deployment edge can timeout long POST requests while backup still completes server-side.
      // Try to detect newly created backup before showing failure.
      let recoveredFromEdgeTimeout = false;
      for (let i = 0; i < 10; i += 1) {
        try {
          const listRes = await axios.get(`${API_URL}/api/admin-settings/system-backup/list`);
          const list = listRes.data?.backups || [];
          const createdAfterFailure = list.find((item) => !previousIds.has(item.id));
          if (createdAfterFailure) {
            setBackups(list);
            setLatestBackup(createdAfterFailure);
            if (createdAfterFailure.status === 'processing') {
              setPollingBackupId(createdAfterFailure.id);
            }
            toast({
              title: 'Backup Started',
              description: 'Backup request timed out at edge, but backup job is running on server.',
            });
            recoveredFromEdgeTimeout = true;
            break;
          }
        } catch (listError) {
          // Ignore and keep retrying
        }
        await sleep(3000);
      }

      if (recoveredFromEdgeTimeout) {
        setCreatingBackup(false);
        return;
      }

      toast({
        title: 'Backup Failed',
        description: error?.response?.data?.detail || 'Unable to create backup.',
        variant: 'destructive',
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownload = async (backup) => {
    setDownloadingId(backup.id);
    try {
      const response = await axios.get(
        `${API_URL}/api/admin-settings/system-backup/download/${backup.id}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.file_name || `system_backup_${backup.id}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Download started', description: 'Backup ZIP is downloading.' });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error?.response?.data?.detail || 'Unable to download backup.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      toast({ title: 'Select backup ZIP', description: 'Choose a backup file first.', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm(
      'This will restore files + database from the selected ZIP and may overwrite current server state. Continue?'
    );
    if (!confirmed) return;

    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backup_file', restoreFile);
      await axios.post(`${API_URL}/api/admin-settings/system-backup/restore`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: 'Restore Complete', description: 'Backup restored successfully.' });
      setRestoreFile(null);
      fetchBackups();
    } catch (error) {
      toast({
        title: 'Restore Failed',
        description: error?.response?.data?.detail || 'Failed to restore backup.',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteBackup = async (backup) => {
    const confirmed = window.confirm(`Delete backup ${backup.file_name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingBackupId(backup.id);
    try {
      await axios.delete(`${API_URL}/api/admin-settings/system-backup/${backup.id}`);
      toast({ title: 'Deleted', description: 'Backup deleted successfully.' });
      await fetchBackups();
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error?.response?.data?.detail || 'Unable to delete backup.',
        variant: 'destructive',
      });
    } finally {
      setDeletingBackupId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBackupIds.length === 0) {
      toast({ title: 'No backups selected', description: 'Select one or more backups first.', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedBackupIds.length} selected backup(s)? This cannot be undone.`);
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const response = await axios.post(`${API_URL}/api/admin-settings/system-backup/delete-bulk`, {
        backup_ids: selectedBackupIds,
      });

      const deletedCount = response.data?.deleted?.length || 0;
      const skippedCount = response.data?.skipped?.length || 0;
      toast({
        title: 'Bulk delete complete',
        description: `Deleted ${deletedCount} backup(s)${skippedCount ? `, skipped ${skippedCount}` : ''}.`,
      });
      setSelectedBackupIds([]);
      await fetchBackups();
    } catch (error) {
      toast({
        title: 'Bulk Delete Failed',
        description: error?.response?.data?.detail || 'Unable to delete selected backups.',
        variant: 'destructive',
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const allSelected = backups.length > 0 && selectedBackupIds.length === backups.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedBackupIds([]);
    } else {
      setSelectedBackupIds(backups.map((b) => b.id));
    }
  };

  const toggleSelectOne = (backupId) => {
    setSelectedBackupIds((prev) => (
      prev.includes(backupId) ? prev.filter((id) => id !== backupId) : [...prev, backupId]
    ));
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-system-backup-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Backup & Restore</h1>
        <p className="text-gray-500">Full project files + database backup to storage folder with 2-step create/download flow.</p>
      </div>

      <Card data-testid="backup-create-download-card">
        <CardHeader>
          <CardTitle>Step 1 & 2: Create Backup → Download ZIP</CardTitle>
          <CardDescription>Includes all files (with .env) and MongoDB dump. Retention keeps latest 5 backups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCreateBackup} disabled={creatingBackup} data-testid="create-system-backup-button">
              <HardDriveDownload className="w-4 h-4 mr-2" /> {creatingBackup ? 'Creating Backup...' : 'Create Backup'}
            </Button>

            <Button
              variant="outline"
              disabled={!latestBackup || latestBackup?.status !== 'ready' || downloadingId === latestBackup?.id}
              onClick={() => latestBackup && handleDownload(latestBackup)}
              data-testid="download-latest-backup-button"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadingId === latestBackup?.id ? 'Downloading...' : 'Download Latest Backup'}
            </Button>

            <Button variant="ghost" onClick={fetchBackups} data-testid="refresh-backup-list-button">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          {latestBackup && (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50" data-testid="latest-backup-meta">
              <p className="text-sm font-medium text-gray-800">Latest backup: {latestBackup.file_name}</p>
              <p className="text-xs text-gray-500">Created: {new Date(latestBackup.created_at).toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">Status: {latestBackup.status || 'ready'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="backup-restore-card">
        <CardHeader>
          <CardTitle>Restore from ZIP</CardTitle>
          <CardDescription>Upload backup ZIP to restore files + database on this server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="restore-backup-file">Backup ZIP</Label>
            <Input
              id="restore-backup-file"
              type="file"
              accept=".zip"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              data-testid="restore-backup-file-input"
            />
          </div>
          <Button onClick={handleRestoreBackup} disabled={restoring} data-testid="restore-backup-button">
            <Upload className="w-4 h-4 mr-2" /> {restoring ? 'Restoring...' : 'Restore Backup'}
          </Button>
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3" data-testid="restore-warning-message">
            <ShieldAlert className="w-4 h-4 inline mr-1" /> Restore will overwrite current files/database state.
          </div>
        </CardContent>
      </Card>

      <Card data-testid="backup-history-card">
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Most recent backups stored under /app/storage/backups.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4" data-testid="backup-bulk-actions-row">
            <label className="inline-flex items-center gap-2 text-sm" data-testid="backup-select-all-wrap">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                data-testid="backup-select-all-checkbox"
              />
              Select all
            </label>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleting || selectedBackupIds.length === 0}
              data-testid="backup-bulk-delete-button"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedBackupIds.length})`}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm" data-testid="backup-history-table">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2">Select</th>
                  <th className="py-2 pr-2">File</th>
                  <th className="py-2 pr-2">Created</th>
                  <th className="py-2 pr-2">Size</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b" data-testid={`backup-history-row-${backup.id}`}>
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedBackupIds.includes(backup.id)}
                        onChange={() => toggleSelectOne(backup.id)}
                        data-testid={`backup-select-${backup.id}`}
                      />
                    </td>
                    <td className="py-2 pr-2 font-medium">{backup.file_name}</td>
                    <td className="py-2 pr-2">{new Date(backup.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-2">{formatBytes(backup.file_size || 0)}</td>
                    <td className="py-2 pr-2">{backup.status || 'ready'}</td>
                    <td className="py-2 pr-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(backup)}
                        disabled={downloadingId === backup.id || backup.status !== 'ready'}
                        data-testid={`backup-download-${backup.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" /> {downloadingId === backup.id ? 'Downloading...' : 'Download'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup)}
                        disabled={deletingBackupId === backup.id || backup.status === 'processing'}
                        data-testid={`backup-delete-${backup.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> {deletingBackupId === backup.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystemBackup;