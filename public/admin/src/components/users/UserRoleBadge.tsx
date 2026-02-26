import { Chip, ChipProps } from '@mui/material';
import { UserRole } from '../../types/user';

interface UserRoleBadgeProps
    extends Omit<ChipProps, 'label' | 'color' | 'size'> {
    role: UserRole;
    size?: 'small' | 'medium';
}

const UserRoleBadge = ({
    role,
    size = 'small',
    sx,
    ...props
}: UserRoleBadgeProps) => {

    const roleConfig = {
        admin: {
            label: 'Admin',
            color: 'primary' as const,
            icon: '👑',
        },
        manager: {
            label: 'Manager',
            color: 'secondary' as const,
            icon: '👔',
        },
        user: {
            label: 'User',
            color: 'default' as const,
            icon: '👤',
        },
    };

    const config = roleConfig[role] ?? roleConfig.user;

    return (
        <Chip
            label={
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '1.1em' }}>{config.icon}</span>
                    <span>{config.label}</span>
                </span>
            }
            size={size}
            color={config.color}
            variant="outlined"
            sx={{
                fontWeight: 500,
                borderWidth: 1.5,
                '& .MuiChip-label': {
                    px: 1,
                },
                ...sx,
            }}
            {...props}
        />
    );
};

export default UserRoleBadge;
