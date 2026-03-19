import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    IconButton,
    TextField,
    InputAdornment,
    CircularProgress,
    Button,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    SelectChangeEvent
} from '@mui/material';
import {
    Search,
    Refresh,
    MoreVert,
    ChatBubbleOutline,
    ThumbUp,
    Share,
    Bookmark,
    Flag,
    FilterList,
    Sort,
    Facebook,
    Twitter,
    Instagram,
    WhatsApp,
    Telegram
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
    getSocialMediaActivity,
    SocialMediaPost
} from '../../../../services/socialMedia';
import { useState } from 'react';

/* -----------------------------
   TYPES
------------------------------*/

type SortOption = 'recent' | 'likes' | 'comments';

type PlatformFilter =
    | 'all'
    | 'facebook'
    | 'twitter'
    | 'instagram'
    | 'whatsapp'
    | 'telegram';

/* -----------------------------
   PLATFORM CONFIG
------------------------------*/

const platforms = {
    facebook: { name: 'Facebook', icon: <Facebook color="primary" />, color: '#1877F2' },
    twitter: { name: 'Twitter', icon: <Twitter sx={{ color: '#1DA1F2' }} />, color: '#1DA1F2' },
    instagram: { name: 'Instagram', icon: <Instagram color="secondary" />, color: '#E4405F' },
    whatsapp: { name: 'WhatsApp', icon: <WhatsApp sx={{ color: '#25D366' }} />, color: '#25D366' },
    telegram: { name: 'Telegram', icon: <Telegram sx={{ color: '#0088CC' }} />, color: '#0088CC' }
};

const SocialMedia = () => {
    const { id: deviceId } = useParams<{ id: string }>();

    const [activeTab, setActiveTab] = useState<PlatformFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const { enqueueSnackbar } = useSnackbar();

    /* -----------------------------
       FETCH DATA (React Query v5)
    ------------------------------*/

    const {
        data: posts = [],
        isLoading,
        error,
        refetch
    } = useQuery<SocialMediaPost[]>({
        queryKey: ['socialMedia', deviceId, activeTab, sortBy, searchQuery],
        queryFn: () =>
            getSocialMediaActivity(deviceId!, {
                platform: activeTab === 'all' ? undefined : activeTab,
                sort: sortBy,
                search: searchQuery
            }),
        enabled: !!deviceId,
        refetchOnWindowFocus: false
    });

    /* -----------------------------
       HANDLERS
    ------------------------------*/

    const handleTabChange = (_: React.SyntheticEvent, newValue: PlatformFilter) => {
        setActiveTab(newValue);
    };

    const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
        setSortBy(event.target.value as SortOption);
    };

    const handleMenuClick = (
        event: React.MouseEvent<HTMLElement>,
        post: SocialMediaPost
    ) => {
        setAnchorEl(event.currentTarget);
        setSelectedPost(post);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleViewDetails = () => {
        setIsDetailOpen(true);
        handleMenuClose();
    };

    const handleCloseDetails = () => {
        setIsDetailOpen(false);
    };

    const handleRefresh = async () => {
        await refetch();
        enqueueSnackbar('Feed refreshed', { variant: 'success' });
    };

    /* -----------------------------
       FILTER + SORT
    ------------------------------*/

    const filteredPosts = posts.filter((post: SocialMediaPost) =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedPosts = [...filteredPosts].sort((a, b) => {
        if (sortBy === 'recent') {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        if (sortBy === 'likes') {
            return b.likes - a.likes;
        }
        if (sortBy === 'comments') {
            return b.comments - a.comments;
        }
        return 0;
    });

    /* -----------------------------
       UI
    ------------------------------*/

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h5">Social Media Activity</Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    Refresh
                </Button>
            </Box>

            <Paper sx={{ p: 2 }}>
                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab value="all" label="All" icon={<FilterList />} iconPosition="start" />
                    {Object.entries(platforms).map(([key, { icon }]) => (
                        <Tab
                            key={key}
                            value={key}
                            label={key}
                            icon={icon}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>

                {/* Search + Sort */}
                <Box display="flex" gap={2} my={2}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortBy}
                            label="Sort By"
                            onChange={handleSortChange}
                        >
                            <MenuItem value="recent">Most Recent</MenuItem>
                            <MenuItem value="likes">Most Likes</MenuItem>
                            <MenuItem value="comments">Most Comments</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Content */}
                {isLoading ? (
                    <Box textAlign="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">
                        Failed to load social media activity
                    </Typography>
                ) : sortedPosts.length === 0 ? (
                    <Typography color="text.secondary">
                        No posts found
                    </Typography>
                ) : (
                    <List>
                        {sortedPosts.map((post: SocialMediaPost) => (
                            <Box key={post.id}>
                                <ListItem
                                    alignItems="flex-start"
                                    secondaryAction={
                                        <IconButton
                                            onClick={(e) => handleMenuClick(e, post)}
                                        >
                                            <MoreVert />
                                        </IconButton>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            src={post.authorAvatar}
                                            sx={{
                                                bgcolor:
                                                    platforms[
                                                        post.platform as keyof typeof platforms
                                                    ]?.color || 'primary.main'
                                            }}
                                        >
                                            {post.author.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Typography fontWeight="bold">
                                                {post.author}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography sx={{ mt: 0.5 }}>
                                                    {post.content}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {formatDistanceToNow(
                                                        new Date(post.timestamp),
                                                        { addSuffix: true }
                                                    )}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                                <Divider />
                            </Box>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Dialog */}
            {selectedPost && (
                <Dialog open={isDetailOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
                    <DialogTitle>{selectedPost.author}</DialogTitle>
                    <DialogContent dividers>
                        <Typography sx={{ mb: 2 }}>
                            {selectedPost.content}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDetails}>Close</Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Context Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <Bookmark fontSize="small" sx={{ mr: 1 }} />
                    Save Post
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <Flag fontSize="small" sx={{ mr: 1 }} />
                    Report
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default SocialMedia;