import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Avatar,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    IconButton,
    LinearProgress,
    Skeleton,
    Alert,
    Stack,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Switch,
    FormControlLabel,
    Rating,
    Paper
} from '@mui/material';
import {
    Edit,
    Save,
    Cancel,
    Person,
    Email,
    LocationOn,
    School,
    Star,
    SwapHoriz,
    Visibility,
    VisibilityOff,
    Notifications,
    Security,
    Language,
    Palette,
    Delete,
    Upload,
    CameraAlt
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface UserProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    location: string;
    bio: string;
    profilePhoto: string | null;
    rating: number;
    swapsCompleted: number;
    skillsCount: number;
    memberSince: string;
    isPublic: boolean;
    notificationsEnabled: boolean;
    skills: string[];
}

export const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [openPhotoDialog, setOpenPhotoDialog] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        location: '',
        bio: '',
        isPublic: true,
        notificationsEnabled: true
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await apiService.getMockData();
            const userProfile = data.users.find((u: any) => u.id === user?.id) || data.users[0];
            setProfile(userProfile);
            setFormData({
                firstName: userProfile.firstName || userProfile.name?.split(' ')[0] || '',
                lastName: userProfile.lastName || userProfile.name?.split(' ')[1] || '',
                email: userProfile.email,
                location: userProfile.location,
                bio: userProfile.bio || 'No bio yet...',
                isPublic: userProfile.isPublic,
                notificationsEnabled: userProfile.notificationsEnabled
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setEditing(true);
    };

    const handleCancel = () => {
        setEditing(false);
        fetchProfile(); // Reset form data
    };

    const handleSave = async () => {
        try {
            await apiService.updateProfile(formData);
            toast.success('Profile updated successfully');
            setEditing(false);
            fetchProfile();
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile');
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Simulate photo upload
                toast.success('Photo uploaded successfully');
                setOpenPhotoDialog(false);
            } catch (error) {
                console.error('Failed to upload photo:', error);
                toast.error('Failed to upload photo');
            }
        }
    };

    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            toast.success('Account deletion requested');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>My Profile</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mb: 2 }} />
                                <Skeleton variant="text" width="60%" height={24} />
                                <Skeleton variant="text" width="40%" height={20} />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Skeleton variant="text" width="80%" height={24} />
                                <Skeleton variant="text" width="60%" height={20} />
                                <Skeleton variant="text" width="40%" height={20} />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        );
    }

    if (!profile) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load profile</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    My Profile
                </Typography>
                {!editing ? (
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                    >
                        Edit Profile
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Cancel />}
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                        >
                            Save Changes
                        </Button>
                    </Box>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Profile Photo & Basic Info */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                                <Avatar
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        fontSize: '3rem',
                                        bgcolor: 'primary.main'
                                    }}
                                >
                                    {profile.firstName?.charAt(0) || profile.name?.charAt(0) || 'U'}
                                </Avatar>
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'primary.dark' }
                                    }}
                                    onClick={() => setOpenPhotoDialog(true)}
                                >
                                    <CameraAlt />
                                </IconButton>
                            </Box>

                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {profile.firstName} {profile.lastName}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Member since {new Date(profile.memberSince).toLocaleDateString()}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                <Rating value={profile.rating} precision={0.1} readOnly size="small" />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                    ({profile.rating})
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                                <Chip
                                    icon={<SwapHoriz />}
                                    label={`${profile.swapsCompleted} swaps`}
                                    size="small"
                                    color="primary"
                                />
                                <Chip
                                    icon={<School />}
                                    label={`${profile.skillsCount} skills`}
                                    size="small"
                                    color="secondary"
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Profile Details */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Profile Information
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        disabled={!editing}
                                        InputProps={{
                                            startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        disabled={!editing}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!editing}
                                        InputProps={{
                                            startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        disabled={!editing}
                                        InputProps={{
                                            startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Bio"
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        disabled={!editing}
                                        placeholder="Tell us about yourself..."
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* Settings */}
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Settings
                            </Typography>

                            <Stack spacing={2}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isPublic}
                                            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                            disabled={!editing}
                                        />
                                    }
                                    label="Public Profile"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.notificationsEnabled}
                                            onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                                            disabled={!editing}
                                        />
                                    }
                                    label="Email Notifications"
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Skills */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                My Skills
                            </Typography>

                            {profile.skills && profile.skills.length > 0 ? (
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {profile.skills.map((skill, index) => (
                                        <Chip
                                            key={index}
                                            label={skill}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No skills added yet. Go to the Skills page to add your skills!
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Account Actions */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                Danger Zone
                            </Typography>

                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={handleDeleteAccount}
                            >
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Photo Upload Dialog */}
            <Dialog open={openPhotoDialog} onClose={() => setOpenPhotoDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Profile Photo</DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="photo-upload"
                            type="file"
                            onChange={handlePhotoUpload}
                        />
                        <label htmlFor="photo-upload">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<Upload />}
                            >
                                Choose Photo
                            </Button>
                        </label>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Supported formats: JPG, PNG, GIF (Max 5MB)
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPhotoDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};