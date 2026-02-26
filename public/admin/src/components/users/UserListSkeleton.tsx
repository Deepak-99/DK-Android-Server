import {
    Box,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';

interface UserListSkeletonProps {
    rows?: number;
    showHeader?: boolean;
}

const UserListSkeleton = ({
    rows = 5,
    showHeader = true
}: UserListSkeletonProps) => {

    return (
        <TableContainer component={Paper}>
            <Table>

                {showHeader && (
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                )}

                <TableBody>
                    {Array.from({ length: rows }).map((_, index) => (
                        <TableRow key={index} hover>

                            <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Skeleton variant="circular" width={40} height={40} />
                                    <Box>
                                        <Skeleton width={120} height={20} />
                                        <Skeleton width={80} height={16} sx={{ mt: 0.5 }} />
                                    </Box>
                                </Box>
                            </TableCell>

                            <TableCell>
                                <Skeleton width={180} height={20} />
                            </TableCell>

                            <TableCell>
                                <Skeleton
                                    variant="rectangular"
                                    width={80}
                                    height={24}
                                    sx={{ borderRadius: 2 }}
                                />
                            </TableCell>

                            <TableCell>
                                <Skeleton width={60} height={20} />
                            </TableCell>

                            <TableCell align="right">
                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                    <Skeleton variant="circular" width={32} height={32} />
                                    <Skeleton variant="circular" width={32} height={32} />
                                </Box>
                            </TableCell>

                        </TableRow>
                    ))}
                </TableBody>

            </Table>
        </TableContainer>
    );
};

export default UserListSkeleton;
