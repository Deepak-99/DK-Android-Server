import { useState } from 'react';
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    SelectChangeEvent,
    useTheme,
    useMediaQuery,
    IconButton,
    Popover,
    FormControlLabel,
    Checkbox,
    Divider,
    Stack,
    InputAdornment,
    Typography,
} from '@mui/material';

import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { UserRole } from '../../types/user';

interface UserFilterProps {
    search: string;
    role: string;
    isActive: boolean | null;
    onSearchChange: (value: string) => void;
    onRoleChange: (value: string) => void;
    onStatusChange: (value: boolean | null) => void;
    onReset: () => void;
}

const UserFilter = ({
    search,
    role,
    isActive,
    onSearchChange,
    onRoleChange,
    onStatusChange,
    onReset,
}: UserFilterProps) => {

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const open = Boolean(anchorEl);
    const popoverId = open ? 'filter-popover' : undefined;

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleRoleChange = (event: SelectChangeEvent) => {
        onRoleChange(event.target.value);
    };

    const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onStatusChange(event.target.checked ? true : null);
    };

    const handleClearFilters = () => {
        onSearchChange('');
        onRoleChange('all');
        onStatusChange(null);
        handleClose();
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">

                {/* Search */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        fullWidth
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: search && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => onSearchChange('')}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />
                </Grid>

                {/* Desktop Filters */}
                {!isMobile && (
                    <>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={role}
                                    label="Role"
                                    onChange={handleRoleChange}
                                >
                                    <MenuItem value="all">All Roles</MenuItem>
                                    <MenuItem value="admin">Administrator</MenuItem>
                                    <MenuItem value="manager">Manager</MenuItem>
                                    <MenuItem value="user">User</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={isActive === null ? 'all' : String(isActive)}
                                    label="Status"
                                    onChange={(e) =>
                                        onStatusChange(
                                            e.target.value === 'all'
                                                ? null
                                                : e.target.value === 'true'
                                        )
                                    }
                                >
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="true">Active</MenuItem>
                                    <MenuItem value="false">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={onReset}
                                startIcon={<RefreshIcon />}
                            >
                                Reset
                            </Button>
                        </Grid>
                    </>
                )}

                {/* Mobile Filters */}
                {isMobile && (
                    <>
                        <Grid size={12}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FilterListIcon />}
                                onClick={handleOpen}
                            >
                                Filters
                            </Button>
                        </Grid>

                        <Popover
                            open={open}
                            anchorEl={anchorEl}
                            onClose={handleClose}
                        >
                            <Box sx={{ p: 2, width: 300 }}>

                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={2}
                                >
                                    <Typography variant="subtitle1">
                                        Filters
                                    </Typography>

                                    <Button
                                        size="small"
                                        onClick={handleClearFilters}
                                        disabled={!search && role === 'all' && isActive === null}
                                    >
                                        Clear
                                    </Button>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Stack spacing={2}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Role</InputLabel>
                                        <Select
                                            value={role}
                                            label="Role"
                                            onChange={handleRoleChange}
                                        >
                                            <MenuItem value="all">All Roles</MenuItem>
                                            <MenuItem value="admin">Administrator</MenuItem>
                                            <MenuItem value="manager">Manager</MenuItem>
                                            <MenuItem value="user">User</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isActive === true}
                                                onChange={handleStatusChange}
                                            />
                                        }
                                        label="Active users only"
                                    />

                                    <Button
                                        variant="contained"
                                        onClick={handleClose}
                                        fullWidth
                                    >
                                        Apply Filters
                                    </Button>
                                </Stack>

                            </Box>
                        </Popover>
                    </>
                )}

            </Grid>
        </Box>
    );
};

export default UserFilter;
