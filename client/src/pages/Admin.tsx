import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import {
  People,
  SwapHoriz,
  Star,
  Block,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface Stats {
  totalUsers: number;
  totalSkills: number;
  totalSwaps: number;
  averageRating: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  skillsCount: number;
  swapRequestsCount: number;
}

export const Admin = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAdminUsers(),
      ]);
      setStats(statsData.stats);
      setUsers(usersData.users);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id: number, banned: boolean) => {
    try {
      await apiService.banUser(id, banned);
      toast.success(`User ${banned ? 'banned' : 'unbanned'} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Admin Dashboard
      </Typography>
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <People color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6">Total Users</Typography>
                <Typography variant="h4">{stats.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <SwapHoriz color="secondary" sx={{ fontSize: 40 }} />
                <Typography variant="h6">Total Swaps</Typography>
                <Typography variant="h4">{stats.totalSwaps}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Star color="action" sx={{ fontSize: 40 }} />
                <Typography variant="h6">Average Rating</Typography>
                <Typography variant="h4">{stats.averageRating.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      <Typography variant="h5" sx={{ mb: 2 }}>
        User Management
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Skills</TableCell>
              <TableCell>Swaps</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.skillsCount}</TableCell>
                <TableCell>{user.swapRequestsCount}</TableCell>
                <TableCell>
                  {user.role !== 'admin' && (
                    <Button
                      variant="contained"
                      color={user.role === 'banned' ? 'success' : 'error'}
                      onClick={() => handleBan(user.id, user.role !== 'banned')}
                    >
                      {user.role === 'banned' ? 'Unban' : 'Ban'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
