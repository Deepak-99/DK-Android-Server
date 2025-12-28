import { useState, useEffect } from 'react';
import {
    TextField,
    InputAdornment,
    IconButton,
    Box,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    SelectChangeEvent
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

interface SearchBarProps {
    onSearch: (query: string, filter?: string) => void;
    placeholder?: string;
    filterOptions?: { value: string; label: string }[];
    initialFilter?: string;
    debounceTime?: number;
}

const SearchBar = ({
                       onSearch,
                       placeholder = 'Search...',
                       filterOptions,
                       initialFilter = '',
                       debounceTime = 300
                   }: SearchBarProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceTime);

        return () => clearTimeout(timer);
    }, [searchTerm, filter, debounceTime, onSearch]);

    const handleFilterChange = (event: SelectChangeEvent) => {
        setFilter(event.target.value as string);
    };

    const handleClear = () => {
        setSearchTerm('');
        onSearch('', filter);
    };

    return (
        <Box display="flex" gap={2} alignItems="center" width="100%">
            {filterOptions && (
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                        value={filter}
                        label="Filter"
                        onChange={handleFilterChange}
                        size="small"
                    >
                        {filterOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
            <TextField
                fullWidth
                variant="outlined"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setSearchTerm('')} size="small">
                                <ClearIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
        </Box>
    );
};

export default SearchBar;