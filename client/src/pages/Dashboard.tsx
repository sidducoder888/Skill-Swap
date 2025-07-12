import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Person,
  School,
  SwapHoriz,
  TrendingUp,
  LocationOn,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface Skill {
  id: number;
  name: string;
  type: 'offered' | 'wanted';
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface Swap {
  id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  offeredSkillName: string;
  wantedSkillName: string;
}

interface DashboardData {
  user: any;
  skills: Skill[];
  swaps: Swap[];
  stats: {
    skillsCount: number;
    swapsCount: number;
  };
}

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!dashboardData) {
    return <Alert severity="error">Failed to load dashboard data.</Alert>;
  }

  const { user: userData, skills, swaps, stats } = dashboardData;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Welcome back, {userData.name}!
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Swaps
              </Typography>
              <List>
                {swaps.slice(0, 5).map((swap, index) => (
                  <React.Fragment key={swap.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <SwapHoriz />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${swap.offeredSkillName} for ${swap.wantedSkillName}`}
                        secondary={`Status: ${swap.status}`}
                      />
                    </ListItem>
                    {index < swaps.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                My Skills
              </Typography>
              <List>
                {skills.slice(0, 5).map((skill, index) => (
                  <React.Fragment key={skill.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <School />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={skill.name}
                        secondary={`Level: ${skill.level} (${skill.type})`}
                      />
                    </ListItem>
                    {index < skills.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6">{userData.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userData.email}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption">
                      {userData.location || 'Not set'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/profile')}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Stats
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School sx={{ mr: 1 }} />
                <Typography>
                  {stats.skillsCount} Skills
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SwapHoriz sx={{ mr: 1 }} />
                <Typography>
                  {stats.swapsCount} Swaps
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
