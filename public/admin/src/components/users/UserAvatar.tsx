import type { FC } from 'react';
import { Avatar, SxProps, Theme, useTheme } from '@mui/material';
import { User } from '../../types/user';

interface UserAvatarProps {
  user: Pick<User, 'fullName' | 'avatar' | 'username'>;
  size?: number;
  sx?: SxProps<Theme>;
  onClick?: () => void;
}

const UserAvatar: FC<UserAvatarProps> = ({
  user,
  size = 40,
  sx = {},
  onClick
}) => {

  const theme = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (str: string) => {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  const baseColor = getRandomColor(
    user.username || user.fullName || 'User'
  );

  const avatarSx: SxProps<Theme> = {
    width: size,
    height: size,
    fontSize: size * 0.4,
    bgcolor: baseColor,
    color: theme.palette.getContrastText(baseColor),
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': onClick
      ? {
          transform: 'scale(1.05)',
          boxShadow: 2
        }
      : {},
    ...sx
  };

  if (user.avatar) {
    return (
      <Avatar
        src={user.avatar}
        alt={user.fullName || user.username}
        sx={avatarSx}
        onClick={onClick}
      />
    );
  }

  return (
    <Avatar sx={avatarSx} onClick={onClick}>
      {getInitials(user.fullName || user.username || 'U')}
    </Avatar>
  );
};

export default UserAvatar;
