import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Breadcrumbs, Link,
    List, ListItem, ListItemIcon, ListItemText,
    IconButton, TextField, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    InputAdornment, Menu, MenuItem, Tooltip
} from '@mui/material';
import {
    Folder, InsertDriveFile, ArrowUpward, Refresh,
    CreateNewFolder, UploadFile, Download, Delete,
    MoreVert, ContentCopy, Cut, Paste, Rename
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    getDirectoryContents,
    createDirectory,
    uploadFile,
    deleteFile,
    renameFile
} from '../../../services/fileExplorer';
import { formatFileSize } from '../../../utils/format';

const FileExplorer = () => {
    const { id: deviceId } = useParams();
    const [currentPath, setCurrentPath] = useState('/sdcard');
    const [searchTerm, setSearchTerm] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [openNewFolderDialog, setOpenNewFolderDialog] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        file: any;
    } | null>(null);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { enqueueSnackbar } = useSnackbar();

    const { data: files = [], isLoading, refetch } = useQuery(
        ['files', deviceId, currentPath],
        () => getDirectoryContents(deviceId!, currentPath),
        { enabled: !!deviceId }
    );

    const createFolderMutation = useMutation(
        (folderName: string) => createDirectory(deviceId!, `${currentPath}/${folderName}`),
        {
            onSuccess: () => {
                refetch();
                setOpenNewFolderDialog(false);
                setNewFolderName('');
                enqueueSnackbar('Folder created successfully', { variant: 'success' });
            },
        }
    );

    const uploadFileMutation = useMutation(
        (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return uploadFile(deviceId!, currentPath, formData);
        },
        {
            onSuccess: () => {
                refetch();
                enqueueSnackbar('File uploaded successfully', { variant: 'success' });
            },
        }
    );

    const deleteFileMutation = useMutation(
        (filePath: string) => deleteFile(deviceId!, filePath),
        {
            onSuccess: () => {
                refetch();
                enqueueSnackbar('Item deleted successfully', { variant: 'success' });
            },
        }
    );

    const handleFileClick = (file: any) => {
        if (file.isDirectory) {
            setCurrentPath(file.path);
        }
    };

    const handleNavigateUp = () => {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
    };

    const handleContextMenu = (event: React.MouseEvent, file: any) => {
        event.preventDefault();
        setSelectedFile(file);
        setContextMenu(
            contextMenu === null
                ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4, file }
                : null
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadFileMutation.mutate(file);
        }
    };

    const handleDelete = () => {
        if (selectedFile) {
            deleteFileMutation.mutate(selectedFile.path);
            handleCloseContextMenu();
        }
    };

    const pathParts = currentPath.split('/').filter(Boolean);

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">File Explorer</Typography>
                <Box>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
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
                        onClick={() => setOpenNewFolderDialog(true)}
                    >
                        New Folder
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                    <IconButton onClick={handleNavigateUp} disabled={currentPath === '/'}>
                        <ArrowUpward />
                    </IconButton>
                    <Breadcrumbs sx={{ flexGrow: 1, ml: 1 }}>
                        <Link
                            component="button"
                            onClick={() => setCurrentPath('/')}
                            color="inherit"
                        >
                            Root
                        </Link>
                        {pathParts.map((part, index) => {
                            const path = `/${pathParts.slice(0, index + 1).join('/')}`;
                            return (
                                <Link
                                    key={path}
                                    component="button"
                                    onClick={() => setCurrentPath(path)}
                                    color="inherit"
                                >
                                    {part}
                                </Link>
                            );
                        })}
                    </Breadcrumbs>
                    <TextField
                        size="small"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <Search fontSize="small" sx={{ mr: 1 }} />,
                        }}
                        sx={{ width: 250 }}
                    />
                    <IconButton onClick={() => refetch()} disabled={isLoading}>
                        <Refresh />
                    </IconButton>
                </Box>

                <List>
                    {isLoading ? (
                        <Box display="flex" justifyContent="center" p={2}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : files.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" textAlign="center" p={2}>
                            No files found
                        </Typography>
                    ) : (
                        files
                            .filter((file) =>
                                file.name.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((file) => (
                                <ListItem
                                    key={file.path}
                                    button
                                    onDoubleClick={() => handleFileClick(file)}
                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <ListItemIcon>
                                        {file.isDirectory ? <Folder color="primary" /> : <InsertDriveFile />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={file.name}
                                        secondary={
                                            !file.isDirectory && file.size
                                                ? formatFileSize(file.size)
                                                : null
                                        }
                                    />
                                    {!file.isDirectory && (
                                        <Typography variant="body2" color="text.secondary">
                                            {file.extension?.toUpperCase()}
                                        </Typography>
                                    )}
                                </ListItem>
                            ))
                    )}
                </List>
            </Paper>

            {/* New Folder Dialog */}
            <Dialog
                open={openNewFolderDialog}
                onClose={() => setOpenNewFolderDialog(false)}
            >
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Folder Name"
                        fullWidth
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && newFolderName.trim()) {
                                createFolderMutation.mutate(newFolderName.trim());
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewFolderDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => createFolderMutation.mutate(newFolderName.trim())}
                        disabled={!newFolderName.trim() || createFolderMutation.isLoading}
                        variant="contained"
                    >
                        {createFolderMutation.isLoading ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Context Menu */}
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <Download fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Download</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <Rename fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Rename</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <ContentCopy fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleCloseContextMenu}>
                    <ListItemIcon>
                        <Cut fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Cut</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        handleDelete();
                        handleCloseContextMenu();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default FileExplorer;