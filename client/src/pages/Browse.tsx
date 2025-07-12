import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Rating,
    Badge,
    Skeleton,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Divider
} from '@mui/material';
import {
    Search,
    LocationOn,
    School,
    SwapHoriz,
    Message,
    Star,
    FilterList,
    Clear
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface User {
    id: number;
    name: string;
    email: string;
    location: string;
    availability: string;
    profilePhoto: string | null;
    isPublic: boolean;
    skills: string[];
    rating: number;
    swapsCompleted: number;
}

export const Browse = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await apiService.getMockData();
            setUsers(data.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSkill = !skillFilter || user.skills.some(skill =>
            skill.toLowerCase().includes(skillFilter.toLowerCase())
        );
        const matchesLocation = !locationFilter || user.location.toLowerCase().includes(locationFilter.toLowerCase());

        return matchesSearch && matchesSkill && matchesLocation;
    });

    const handleViewProfile = (userId: number) => {
        navigate(`/user/${userId}`);
    };

    const handleStartSwap = (userId: number) => {
        navigate(`/swaps?userId=${userId}`);
    };

    const handleMessage = (userId: number) => {
        toast.success('Message feature coming soon!');
    };

    const getSkillColor = (skill: string) => {
        const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error'];
        return colors[skill.length % colors.length] as any;
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>Browse Users</Typography>
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Skeleton variant="circular" width={60} height={60} sx={{ mr: 2 }} />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Skeleton variant="text" width="60%" height={24} />
                                            <Skeleton variant="text" width="40%" height={20} />
                                        </Box>
                                    </Box>
                                    <Skeleton variant="text" width="80%" height={20} />
                                    <Skeleton variant="text" width="60%" height={20} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Browse Users
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Discover people with skills to share and learn from
                </Typography>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <Clear />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Skill</InputLabel>
                            <Select
                                value={skillFilter}
                                onChange={(e) => setSkillFilter(e.target.value)}
                                label="Skill"
                            >
                                <MenuItem value="">All Skills</MenuItem>
                                <MenuItem value="javascript">JavaScript</MenuItem>
                                <MenuItem value="react">React</MenuItem>
                                <MenuItem value="python">Python</MenuItem>
                                <MenuItem value="design">Design</MenuItem>
                                <MenuItem value="cooking">Cooking</MenuItem>
                                <MenuItem value="photography">Photography</MenuItem>
                                <MenuItem value="fitness">Fitness</MenuItem>
                                <MenuItem value="language">Language</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Location</InputLabel>
                            <Select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                label="Location"
                            >
                                <MenuItem value="">All Locations</MenuItem>
                                <MenuItem value="new york">New York</MenuItem>
                                <MenuItem value="san francisco">San Francisco</MenuItem>
                                <MenuItem value="los angeles">Los Angeles</MenuItem>
                                <MenuItem value="chicago">Chicago</MenuItem>
                                <MenuItem value="seattle">Seattle</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={() => {
                                setSearchTerm('');
                                setSkillFilter('');
                                setLocationFilter('');
                            }}
                        >
                            Clear
                        </Button>
                    </Grid>
                </Grid>
            </Card>

            {/* Results */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="text.secondary">
                    {filteredUsers.length} users found
                </Typography>
            </Box>

            {/* Users Grid */}
            {filteredUsers.length > 0 ? (
                <Grid container spacing={3}>
                    {filteredUsers.map((user) => (
                        <Grid item xs={12} sm={6} md={4} key={user.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    {/* User Header */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar
                                            sx={{
                                                width: 60,
                                                height: 60,
                                                mr: 2,
                                                bgcolor: 'primary.main',
                                                fontSize: '1.5rem'
                                            }}
                                        >
                                            {user.name.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {user.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {user.location}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Rating */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Rating value={user.rating} precision={0.1} readOnly size="small" />
                                        <Typography variant="body2" sx={{ ml: 1 }}>
                                            ({user.rating})
                                        </Typography>
                                        <Chip
                                            label={`${user.swapsCompleted} swaps`}
                                            size="small"
                                            color="info"
                                            sx={{ ml: 'auto' }}
                                        />
                                    </Box>

                                    {/* Skills */}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Skills:
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {user.skills.slice(0, 3).map((skill, index) => (
                                                <Chip
                                                    key={index}
                                                    label={skill}
                                                    size="small"
                                                    color={getSkillColor(skill)}
                                                    variant="outlined"
                                                />
                                            ))}
                                            {user.skills.length > 3 && (
                                                <Chip
                                                    label={`+${user.skills.length - 3} more`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Stack>
                                    </Box>

                                    {/* Availability */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Available:</strong> {user.availability}
                                        </Typography>
                                    </Box>

                                    {/* Actions */}
                                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => handleViewProfile(user.id)}
                                        >
                                            View Profile
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<SwapHoriz />}
                                            fullWidth
                                            onClick={() => handleStartSwap(user.id)}
                                        >
                                            Start Swap
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Alert severity="info">
                    No users found matching your criteria. Try adjusting your filters.
                </Alert>
            )}
        </Box>
    );
};