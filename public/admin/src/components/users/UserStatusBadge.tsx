import { Box, Typography, SxProps, Theme } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';

interface UserStatusBadgeProps {
    isActive: boolean;
    showText?: boolean;
    size?: 'small' | 'medium' | 'large';
    sx?: SxProps<Theme>;
}

const UserStatusBadge = ({
    isActive,
    showText = true,
    size = 'medium',
    sx = {},
}: UserStatusBadgeProps) => {

    const sizeMap = {
        small: { icon: 14, text: 'caption' },
        medium: { icon: 18, text: 'body2' },
        large: { icon: 24, text: 'body1' },
    } as const;

    const { icon: iconSize, text: textVariant } = sizeMap[size];

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: isActive ? 'success.main' : 'error.main',
                ...sx,
            }}
        >
            {isActive ? (
                <CheckCircle sx={{ fontSize: iconSize }} />
            ) : (
                <Cancel sx={{ fontSize: iconSize }} />
            )}

            {showText && (
                <Typography
                    variant={textVariant}
                    component="span"
                    sx={{
                        lineHeight: 1,
                        color: 'inherit',
                        fontWeight: 500,
                    }}
                >
                    {isActive ? 'Active' : 'Inactive'}
                </Typography>
            )}
        </Box>
    );
};

export default UserStatusBadge;
