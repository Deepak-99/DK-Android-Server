import { useState, useEffect } from 'react';

interface UseSearchProps {
    initialQuery?: string;
    initialFilter?: string;
    debounceTime?: number;
    onSearch?: (query: string, filter?: string) => void;
}

const useSearch = ({
                       initialQuery = '',
                       initialFilter = '',
                       debounceTime = 300,
                       onSearch,
                   }: UseSearchProps = {}) => {
    const [query, setQuery] = useState(initialQuery);
    const [filter, setFilter] = useState(initialFilter);

    useEffect(() => {
        if (typeof onSearch !== 'function') return;

        const timer = setTimeout(() => {
            onSearch(query, filter);
        }, debounceTime);

        return () => clearTimeout(timer);
    }, [query, filter, debounceTime, onSearch]);

    const handleSearch = (newQuery: string) => {
        setQuery(newQuery);
    };

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
    };

    const clearSearch = () => {
        setQuery('');
        setFilter(initialFilter);
    };

    return {
        query,
        filter,
        handleSearch,
        handleFilterChange,
        clearSearch,
    };
};

export default useSearch;