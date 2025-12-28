// src/hooks/useResponsive.ts
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export default function useResponsive(
    query: 'up' | 'down' | 'between' | 'only',
    start: Breakpoint,
    end?: Breakpoint
) {
    const theme = useTheme();

    if (query === 'up') {
        return useMediaQuery(theme.breakpoints.up(start));
    }

    if (query === 'down') {
        return useMediaQuery(theme.breakpoints.down(start));
    }

    if (query === 'between') {
        if (!end) {
            throw new Error('End breakpoint is required for "between" query');
        }
        return useMediaQuery(theme.breakpoints.between(start, end));
    }

    if (query === 'only') {
        return useMediaQuery(theme.breakpoints.only(start as any));
    }

    return false;
}