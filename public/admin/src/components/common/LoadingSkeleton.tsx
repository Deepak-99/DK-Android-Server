// src/components/common/LoadingSkeleton.tsx
import { Skeleton, Box } from '@mui/material';

interface LoadingSkeletonProps {
    type?: 'table' | 'card' | 'list' | 'text';
    rows?: number;
    height?: number | string;
    width?: number | string;
    animation?: 'pulse' | 'wave' | false;
}

const LoadingSkeleton = ({
                             type = 'text',
                             rows = 3,
                             height = 40,
                             width = '100%',
                             animation = 'wave'
                         }: LoadingSkeletonProps) => {
    if (type === 'table') {
        return (
            <Box width={width}>
                {[...Array(rows)].map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="rectangular"
                        height={height}
                        width={width}
                        animation={animation}
                        sx={{ mb: 1, borderRadius: 1 }}
                    />
                ))}
            </Box>
        );
    }

    if (type === 'card') {
        return (
            <Box sx={{ p: 2, width: '100%' }}>
                <Skeleton variant="rectangular" height={140} animation={animation} />
                <Box sx={{ pt: 0.5 }}>
                    <Skeleton animation={animation} />
                    <Skeleton width="60%" animation={animation} />
                </Box>
            </Box>
        );
    }

    if (type === 'list') {
        return (
            <Box>
                {[...Array(rows)].map((_, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} animation={animation} />
                        <Box sx={{ ml: 2, width: '100%' }}>
                            <Skeleton width="60%" animation={animation} />
                            <Skeleton width="40%" animation={animation} />
                        </Box>
                    </Box>
                ))}
            </Box>
        );
    }

  return (
    <Box width={width}>
      {[...Array(rows)].map((_, i) => (
        <Skeleton
          key={i}
          height={height}
          sx={{ mb: 1, borderRadius: 1 }}
        />
      ))}
    </Box>
  );
};

export default LoadingSkeleton;