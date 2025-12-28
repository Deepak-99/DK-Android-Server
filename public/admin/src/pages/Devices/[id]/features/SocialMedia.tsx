import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Tabs, Tab,
    List, ListItem, ListItemText, ListItemAvatar,
    Avatar, Divider, IconButton, TextField,
    InputAdornment, CircularProgress, Chip, Button,
    Menu, MenuItem, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, Badge
} from '@mui/material';
import {
    Search, Refresh, MoreVert,
    ChatBubbleOutline, ThumbUp, Share,
    Bookmark, Flag, FilterList, Sort,
    Facebook, Twitter, Instagram, WhatsApp, Telegram
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getSocialMediaActivity, SocialMediaPost } from '../../../../services/socialMedia';

const platforms = {
    facebook: { name: 'Facebook', icon: <Facebook color="primary" />, color: '#1877F2' },
    twitter: { name: 'Twitter', icon: <Twitter style={{ color: '#1DA1F2' }} />, color: '#1DA1F2' },
    instagram: { name: 'Instagram', icon: <Instagram color="secondary" />, color: '#E4405F' },
    whatsapp: { name: 'WhatsApp', icon: <WhatsApp style={{ color: '#25D366' }} />, color: '#25D366' },
    telegram: { name: 'Telegram', icon: <Telegram style={{ color: '#0088CC' }} />, color: '#0088CC' }
};

const SocialMedia = () => {
    const { id: deviceId } = useParams();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const { data: posts = [], isLoading, error, refetch } = useQuery(
        ['socialMedia', deviceId, activeTab, sortBy],
        () => getSocialMediaActivity(deviceId!, {
            platform: activeTab === 'all' ? undefined : activeTab,
            sort: sortBy,
            search: searchQuery
        }),
        {
            enabled: !!deviceId,
            refetchOnWindowFocus: false,
        }
    );

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
    };

    const handleSortChange = (event: any) => {
        setSortBy(event.target.value);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, post: SocialMediaPost) => {
        setAnchorEl(event.currentTarget);
        setSelectedPost(post);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPost(null);
    };

    const handleViewDetails = () => {
        setIsDetailOpen(true);
        handleMenuClose();
    };

    const handleCloseDetails = () => {
        setIsDetailOpen(false);
    };

    const handleRefresh = async () => {
        try {
            await refetch();
            enqueueSnackbar('Social media feed updated', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to refresh feed', { variant: 'error' });
        }
    };

    const filteredPosts = posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedPosts = [...filteredPosts].sort((a, b) => {
        if (sortBy === 'recent') {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else if (sortBy === 'likes') {
            return b.likes - a.likes;
        } else if (sortBy === 'comments') {
            return b.comments - a.comments;
        }
        return 0;
    });

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Social Media Activity</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={handleRefresh}
                        disabled={isLoading}
                        sx={{ mr: 1 }}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ flexGrow: 1, minWidth: 0 }}
                    >
                        <Tab
                            label="All Platforms"
                            value="all"
                            icon={<FilterList />}
                            iconPosition="start"
                        />
                        {Object.entries(platforms).map(([key, { icon }]) => (
                            <Tab
                                key={key}
                                label={key.charAt(0).toUpperCase() + key.slice(1)}
                                value={key}
                                icon={icon}
                                iconPosition="start"
                            />
                        ))}
                    </Tabs>
                </Box>

                <Box display="flex" gap={2} mb={3}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortBy}
                            onChange={handleSortChange}
                            label="Sort By"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Sort />
                                </InputAdornment>
                            }
                        >
                            <MenuItem value="recent">Most Recent</MenuItem>
                            <MenuItem value="likes">Most Likes</MenuItem>
                            <MenuItem value="comments">Most Comments</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {isLoading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box textAlign="center" p={4}>
                        <Typography color="error">Failed to load social media activity</Typography>
                        <Button
                            variant="outlined"
                            onClick={() => refetch()}
                            startIcon={<Refresh />}
                            sx={{ mt: 2 }}
                        >
                            Retry
                        </Button>
                    </Box>
                ) : sortedPosts.length === 0 ? (
                    <Box textAlign="center" p={4}>
                        <Typography color="text.secondary">No posts found</Typography>
                    </Box>
                ) : (
                    <List>
                        {sortedPosts.map((post) => (
                            <div key={post.id}>
                                <ListItem
                                    alignItems="flex-start"
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => handleMenuClick(e, post)}
                                        >
                                            <MoreVert />
                                        </IconButton>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            src={post.authorAvatar}
                                            alt={post.author}
                                            sx={{
                                                bgcolor: platforms[post.platform as keyof typeof platforms]?.color || 'primary.main'
                                            }}
                                        >
                                            {post.author.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography component="span" fontWeight="bold">
                                                    {post.author}
                                                </Typography>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: '50%',
                                                        bgcolor: 'text.secondary',
                                                        mx: 0.5
                                                    }}
                                                />
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                                                </Typography>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: '50%',
                                                        bgcolor: 'text.secondary',
                                                        mx: 0.5
                                                    }}
                                                />
                                                {platforms[post.platform as keyof typeof platforms]?.icon}
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.primary"
                                                    sx={{ display: 'block', mt: 0.5 }}
                                                >
                                                    {post.content}
                                                </Typography>
                                                {post.mediaUrl && (
                                                    <Box
                                                        component="img"
                                                        src={post.mediaUrl}
                                                        alt="Post media"
                                                        sx={{
                                                            maxWidth: '100%',
                                                            maxHeight: 200,
                                                            mt: 1,
                                                            borderRadius: 1
                                                        }}
                                                    />
                                                )}
                                                <Box display="flex" gap={2} mt={1}>
                                                    <Box display="flex" alignItems="center">
                                                        <ThumbUp fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {post.likes}
                                                        </Typography>
                                                    </Box>
                                                    <Box display="flex" alignItems="center">
                                                        <ChatBubbleOutline fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {post.comments}
                                                        </Typography>
                                                    </Box>
                                                    <Box display="flex" alignItems="center">
                                                        <Share fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {post.shares}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </>
                                        }
                                    />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </div>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Post Detail Dialog */}
            {selectedPost && (
                <Dialog
                    open={isDetailOpen}
                    onClose={handleCloseDetails}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                                src={selectedPost.authorAvatar}
                                alt={selectedPost.author}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: platforms[selectedPost.platform as keyof typeof platforms]?.color || 'primary.main'
                                }}
                            >
                                {selectedPost.author.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {selectedPost.author}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDistanceToNow(new Date(selectedPost.timestamp), { addSuffix: true })}
                                    </Typography>
                                    <Box
                                        component="span"
                                        sx={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: '50%',
                                            bgcolor: 'text.secondary',
                                            mx: 0.5
                                        }}
                                    />
                                    {platforms[selectedPost.platform as keyof typeof platforms]?.icon}
                                </Box>
                            </Box>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Typography paragraph>{selectedPost.content}</Typography>
                        {selectedPost.mediaUrl && (
                            <Box
                                component="img"
                                src={selectedPost.mediaUrl}
                                alt="Post media"
                                sx={{
                                    maxWidth: '100%',
                                    maxHeight: 400,
                                    display: 'block',
                                    margin: '0 auto',
                                    borderRadius: 1
                                }}
                            />
                        )}
                        <Box display="flex" justifyContent="space-between" mt={2} pt={2} borderTop={1} borderColor="divider">
                            <Box display="flex" alignItems="center">
                                <ThumbUp color="primary" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {selectedPost.likes} likes
                                </Typography>
                            </Box>
                            <Box display="flex" gap={2}>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedPost.comments} comments
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedPost.shares} shares
                                </Typography>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            startIcon={<ThumbUp />}
                            onClick={() => enqueueSnackbar('Like action not implemented', { variant: 'info' })}
                        >
                            Like
                        </Button>
                        <Button
                            startIcon={<ChatBubbleOutline />}
                            onClick={() => enqueueSnackbar('Comment action not implemented', { variant: 'info' })}
                        >
                            Comment
                        </Button>
                        <Button
                            startIcon={<Share />}
                            onClick={() => enqueueSnackbar('Share action not implemented', { variant: 'info' })}
                        >
                            Share
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
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