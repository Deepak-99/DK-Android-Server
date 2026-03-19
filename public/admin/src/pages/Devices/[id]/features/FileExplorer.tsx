import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';

import {
  Folder,
  InsertDriveFile,
  ArrowUpward,
  Refresh,
  CreateNewFolder,
  UploadFile,
  Download,
  Delete,
  DriveFileRenameOutline,
  Search
} from '@mui/icons-material';

import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';

import {
  getDirectoryContents,
  createDirectory,
  uploadFile,
  deleteFile,
  renameFile,
  downloadFile
} from '../../../../services/fileExplorer';


// ---------- UI Model ----------

interface ExplorerFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  extension?: string;
}


// ---------- Helpers ----------

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};


// ---------- Component ----------

const FileExplorer = () => {

  const { id: deviceId } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedFile, setSelectedFile] = useState<ExplorerFile | null>(null);

  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [renameDialog, setRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    file: ExplorerFile;
  } | null>(null);


  // ---------- Query ----------

  const {
    data: files = [],
    isLoading,
    refetch
  } = useQuery<ExplorerFile[]>({

    queryKey: ['files', deviceId, currentPath],

    queryFn: async () => {

      const res = await getDirectoryContents(deviceId!, currentPath);

      return res.files.map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        extension: file.extension,
        isDirectory: file.type === 'directory'
      }));
    },

    enabled: !!deviceId
  });


  // ---------- Mutations ----------

  const createFolderMutation = useMutation({

    mutationFn: (folderName: string) =>
      createDirectory(deviceId!, `${currentPath}/${folderName}`),

    onSuccess: () => {
      void refetch();
      setNewFolderDialog(false);
      setNewFolderName('');
      enqueueSnackbar('Folder created', { variant: 'success' });
    }
  });


  const uploadFileMutation = useMutation({

    mutationFn: (file: File) =>
      uploadFile(deviceId!, currentPath, file),

    onSuccess: () => {
      void refetch();
      enqueueSnackbar('Upload successful', { variant: 'success' });
    }
  });


  const deleteFileMutation = useMutation({

    mutationFn: (path: string) =>
      deleteFile(deviceId!, path),

    onSuccess: () => {
      void refetch();
      enqueueSnackbar('Deleted successfully', { variant: 'success' });
    }
  });


  const renameMutation = useMutation({

    mutationFn: (payload: { oldPath: string; newName: string }) =>
      renameFile(deviceId!, payload.oldPath, payload.newName),

    onSuccess: () => {
      void refetch();
      enqueueSnackbar('Renamed successfully', { variant: 'success' });
      setRenameDialog(false);
    }
  });


  // ---------- Handlers ----------

  const handleNavigateUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parent);
  };


  const handleFileOpen = (file: ExplorerFile) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    }
  };


  const handleUploadInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFileMutation.mutate(file);
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (file) uploadFileMutation.mutate(file);
  };


  const handleDownload = async (file: ExplorerFile) => {

    const blob = await downloadFile(deviceId!, file.path);

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();

    URL.revokeObjectURL(url);
  };


  const openRenameDialog = (file: ExplorerFile) => {
    setSelectedFile(file);
    setRenameValue(file.name);
    setRenameDialog(true);
  };


  const submitRename = () => {
    if (!selectedFile) return;

    renameMutation.mutate({
      oldPath: selectedFile.path,
      newName: renameValue
    });
  };


  const handleContextMenu = (
    event: React.MouseEvent,
    file: ExplorerFile
  ) => {
    event.preventDefault();

    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      file
    });
  };


  const closeContextMenu = () => setContextMenu(null);


  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const pathParts = currentPath.split('/').filter(Boolean);


  // ---------- UI ----------

  return (

    <Box onDrop={handleDrop} onDragOver={e => e.preventDefault()}>

      {/* Header */}

      <Box display="flex" justifyContent="space-between" mb={2}>

        <Typography variant="h5">File Explorer</Typography>

        <Box>
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleUploadInput}
          />

          <Button
            variant="outlined"
            startIcon={<UploadFile />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ mr: 1 }}
          >
            Upload
          </Button>

          <Button
            variant="contained"
            startIcon={<CreateNewFolder />}
            onClick={() => setNewFolderDialog(true)}
          >
            New Folder
          </Button>
        </Box>

      </Box>


      {/* Toolbar */}

      <Paper sx={{ p: 2, mb: 2 }}>

        <Box display="flex" alignItems="center" gap={1}>

          <IconButton onClick={handleNavigateUp} disabled={currentPath === '/'}>
            <ArrowUpward />
          </IconButton>

          <Breadcrumbs sx={{ flexGrow: 1 }}>

            <Link component="button" onClick={() => setCurrentPath('/')}>
              Root
            </Link>

            {pathParts.map((part, index) => {

              const path = `/${pathParts.slice(0, index + 1).join('/')}`;

              return (
                <Link
                  key={path}
                  component="button"
                  onClick={() => setCurrentPath(path)}
                >
                  {part}
                </Link>
              );
            })}
          </Breadcrumbs>

          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1 }} />
            }}
          />

          <IconButton onClick={() => refetch()}>
            <Refresh />
          </IconButton>

        </Box>

      </Paper>


      {/* File List */}

      <Paper>

        {isLoading ? (

          <Box p={3} textAlign="center">
            <CircularProgress />
          </Box>

        ) : filteredFiles.length === 0 ? (

          <Box p={3} textAlign="center">
            <Typography>No files found</Typography>
          </Box>

        ) : (

          <List>

            {filteredFiles.map(file => (

              <ListItem
                key={file.path}
                component="div"
                onDoubleClick={() => handleFileOpen(file)}
                onContextMenu={e => handleContextMenu(e, file)}
                sx={{ cursor: 'pointer' }}
              >

                <ListItemIcon>
                  {file.isDirectory ? <Folder /> : <InsertDriveFile />}
                </ListItemIcon>

                <ListItemText
                  primary={file.name}
                  secondary={!file.isDirectory ? formatBytes(file.size) : ''}
                />

              </ListItem>

            ))}

          </List>

        )}

      </Paper>


      {/* New Folder Dialog */}

      <Dialog open={newFolderDialog} onClose={() => setNewFolderDialog(false)}>

        <DialogTitle>Create Folder</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setNewFolderDialog(false)}>Cancel</Button>

          <Button
            variant="contained"
            disabled={!newFolderName.trim()}
            onClick={() => createFolderMutation.mutate(newFolderName.trim())}
          >
            Create
          </Button>
        </DialogActions>

      </Dialog>


      {/* Rename Dialog */}

      <Dialog open={renameDialog} onClose={() => setRenameDialog(false)}>

        <DialogTitle>Rename</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="New name"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setRenameDialog(false)}>Cancel</Button>

          <Button
            variant="contained"
            disabled={!renameValue.trim()}
            onClick={submitRename}
          >
            Rename
          </Button>
        </DialogActions>

      </Dialog>


      {/* Context Menu */}

      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >

        <MenuItem onClick={() => {
          handleDownload(contextMenu!.file);
          closeContextMenu();
        }}>
          <Download fontSize="small" sx={{ mr: 1 }} /> Download
        </MenuItem>

        <MenuItem onClick={() => {
          openRenameDialog(contextMenu!.file);
          closeContextMenu();
        }}>
          <DriveFileRenameOutline fontSize="small" sx={{ mr: 1 }} /> Rename
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            deleteFileMutation.mutate(contextMenu!.file.path);
            closeContextMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>

      </Menu>

    </Box>
  );
};

export default FileExplorer;
