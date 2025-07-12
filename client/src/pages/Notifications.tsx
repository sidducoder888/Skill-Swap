import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Badge,
    Skeleton,
    Alert,
    Stack,
    Tabs,
    Tab,
    Menu,
    MenuItem,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    Notifications,
    SwapHoriz,
    Person,
    School,
    Message,
    CheckCircle,
    Cancel,
    Schedule,
    Delete,
    MoreVert,
    MarkEmailRead,
    MarkEmailUnread,
    FilterList,
    Clear
} from '@mui/icons-material';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface Notification {
    id: number;
    type: 'swap_request' | 'swap_accepted' | 'swap_rejected' | 'swap_completed' | 'message' | 'skill_added' | 'rating_received';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    senderId?: number;
    senderName?: string;
    senderAvatar?: string;
    actionUrl?: string;
    actionText?: string;
}

export const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showRead, setShowRead] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await apiService.getMockData();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            await apiService.markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            toast.success('Marked as read');
        } catch (error) {
            console.error('Failed to mark as read:', error);
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiService.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const handleDeleteNotification = async (notificationId: number) => {
        try {
            await apiService.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            toast.success('Notification deleted');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const handleClearAll = async () => {
        try {
            await apiService.clearAllNotifications();
            setNotifications([]);
            toast.success('All notifications cleared');
        } catch (error) {
            console.error('Failed to clear notifications:', error);
            toast.error('Failed to clear notifications');
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'swap_request': return <SwapHoriz />;
            case 'swap_accepted': return <CheckCircle />;
            case 'swap_rejected': return <Cancel />;
            case 'swap_completed': return <CheckCircle />;
            case 'message': return <Message />;
            case 'skill_added': return <School />;
            case 'rating_received': return <Person />;
            default: return <Notifications />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'swap_request': return 'info';
            case 'swap_accepted': return 'success';
            case 'swap_rejected': return 'error';
            case 'swap_completed': return 'success';
            case 'message': return 'primary';
            case 'skill_added': return 'secondary';
            case 'rating_received': return 'warning';
            default: return 'default';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'swap_request': return 'Swap Request';
            case 'swap_accepted': return 'Swap Accepted';
            case 'swap_rejected': return 'Swap Rejected';
            case 'swap_completed': return 'Swap Completed';
            case 'message': return 'Message';
            case 'skill_added': return 'Skill Added';
            case 'rating_received': return 'Rating Received';
            default: return 'Notification';
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        if (tabValue === 0) return !notification.isRead;
        if (tabValue === 1) return notification.isRead;
        return true; // All notifications
    }).filter(notification => {
        if (!showRead) return !notification.isRead;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>Notifications</Typography>
                <Stack spacing={2}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Skeleton variant="text" width="60%" height={20} />
                                        <Skeleton variant="text" width="40%" height={16} />
                                    </Box>
                                </Box>
                                <Skeleton variant="text" width="80%" height={16} />
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Notifications
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Stay updated with your skill swap activities
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<MarkEmailRead />}
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                    >
                        Mark All Read
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Clear />}
                        onClick={handleClearAll}
                        disabled={notifications.length === 0}
                    >
                        Clear All
                    </Button>
                </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Unread
                                {unreadCount > 0 && (
                                    <Badge badgeContent={unreadCount} color="error" />
                                )}
                            </Box>
                        }
                    />
                    <Tab label="Read" />
                    <Tab label="All" />
                </Tabs>
            </Box>

            {/* Filter */}
            <Box sx={{ mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showRead}
                            onChange={(e) => setShowRead(e.target.checked)}
                        />
                    }
                    label="Show read notifications"
                />
            </Box>

            {/* Notifications List */}
            {filteredNotifications.length > 0 ? (
                <Stack spacing={2}>
                    {filteredNotifications.map((notification) => (
                        <Card
                            key={notification.id}
                            sx={{
                                border: notification.isRead ? 'none' : '2px solid',
                                borderColor: 'primary.main',
                                bgcolor: notification.isRead ? 'background.paper' : 'primary.50'
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    {/* Avatar */}
                                    <Avatar
                                        sx={{
                                            bgcolor: `${getNotificationColor(notification.type)}.main`,
                                            width: 48,
                                            height: 48
                                        }}
                                    >
                                        {getNotificationIcon(notification.type)}
                                    </Avatar>

                                    {/* Content */}
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                    {notification.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {notification.message}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => setAnchorEl(e.currentTarget)}
                                            >
                                                <MoreVert />
                                            </IconButton>
                                        </Box>

                                        {/* Meta Info */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Chip
                                                label={getTypeLabel(notification.type)}
                                                size="small"
                                                color={getNotificationColor(notification.type) as any}
                                                variant="outlined"
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </Typography>
                                            {!notification.isRead && (
                                                <Chip
                                                    label="New"
                                                    size="small"
                                                    color="primary"
                                                />
                                            )}
                                        </Box>

                                        {/* Actions */}
                                        {notification.actionText && (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => {
                                                        // Handle action
                                                        toast.success('Action completed');
                                                    }}
                                                >
                                                    {notification.actionText}
                                                </Button>
                                                {!notification.isRead && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                    >
                                                        Mark as Read
                                                    </Button>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            ) : (
                <Alert severity="info">
                    {tabValue === 0
                        ? 'No unread notifications'
                        : tabValue === 1
                            ? 'No read notifications'
                            : 'No notifications yet'
                    }
                </Alert>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => {
                    // Handle view details
                    setAnchorEl(null);
                }}>
                    View Details
                </MenuItem>
                <MenuItem onClick={() => {
                    // Handle mark as read
                    setAnchorEl(null);
                }}>
                    Mark as Read
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        // Handle delete
                        setAnchorEl(null);
                    }}
                    sx={{ color: 'error.main' }}
                >
                    Delete
                </MenuItem>
            </Menu>
        </Box>
    );
}; 