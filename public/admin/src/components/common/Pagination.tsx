import {
    Box,
    Pagination,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Typography
} from '@mui/material';

interface PaginationProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    rowsPerPageOptions?: number[];
}

const PaginationComponent = ({
                                 count,
                                 page,
                                 rowsPerPage,
                                 onPageChange,
                                 onRowsPerPageChange,
                                 rowsPerPageOptions = [10, 25, 50, 100]
                             }: PaginationProps) => {
    const handleChangePage = (event: unknown, newPage: number) => {
        onPageChange(newPage);
    };

    const handleChangeRowsPerPage = (event: SelectChangeEvent<number>) => {
        onRowsPerPageChange(Number(event.target.value));
        onPageChange(1); // Reset to first page when rows per page changes
    };

    const start = count === 0 ? 0 : (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, count);

    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
            p={2}
        >
            <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                    Rows per page:
                </Typography>
                <FormControl size="small" variant="standard">
                    <Select
                        value={rowsPerPage}
                        onChange={handleChangeRowsPerPage}
                        disableUnderline
                        sx={{
                            '& .MuiSelect-select': {
                                py: 0.5,
                                px: 1,
                                borderRadius: 1,
                                border: '1px solid rgba(0, 0, 0, 0.23)'
                            }
                        }}
                    >
                        {rowsPerPageOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                    {start}-{end} of {count}
                </Typography>
            </Box>
            <Pagination
                count={Math.ceil(count / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
                showFirstButton
                showLastButton
            />
        </Box>
    );
};

export default PaginationComponent;