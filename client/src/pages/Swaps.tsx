import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Avatar,
  Divider,
} from '@mui/material';
import { SwapHoriz, CheckCircle, Cancel, Pending } from '@mui/icons-material';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Swap {
  id: number;
  fromUserId: number;
  toUserId: number;
  offeredSkillId: number;
  wantedSkillId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  fromUserName: string;
  toUserName: string;
  offeredSkillName: string;
  wantedSkillName: string;
}

export const Swaps = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const { swaps } = await apiService.getMySwaps();
      setSwaps(swaps);
    } catch (error) {
      toast.error('Failed to load swaps');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await apiService.updateSwapStatus(id, status);
      toast.success('Swap status updated');
      fetchSwaps();
    } catch (error) {
      toast.error('Failed to update swap status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'info';
      case 'rejected':
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Pending />;
      case 'accepted':
        return <CheckCircle />;
      case 'rejected':
      case 'cancelled':
        return <Cancel />;
      case 'completed':
        return <CheckCircle />;
      default:
        return <SwapHoriz />;
    }
  };

  const filteredSwaps =
    tab === 'all' ? swaps : swaps.filter((swap) => swap.status === tab);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        My Swaps
      </Typography>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All" value="all" />
        <Tab label="Pending" value="pending" />
        <Tab label="Accepted" value="accepted" />
        <Tab label="Completed" value="completed" />
        <Tab label="Rejected/Cancelled" value="rejected" />
      </Tabs>
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {filteredSwaps.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">No swaps in this category.</Alert>
            </Grid>
          ) : (
            filteredSwaps.map((swap) => (
              <Grid item xs={12} md={6} key={swap.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <SwapHoriz />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {swap.offeredSkillName} for {swap.wantedSkillName}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(swap.status)}
                          label={swap.status}
                          size="small"
                          color={getStatusColor(swap.status)}
                        />
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography>
                        From: {swap.fromUserName}
                      </Typography>
                      <Typography>
                        To: {swap.toUserName}
                      </Typography>
                    </Box>
                    {swap.status === 'pending' && user?.id === swap.toUserId && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleStatusChange(swap.id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          sx={{ ml: 1 }}
                          onClick={() => handleStatusChange(swap.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                    {swap.status === 'pending' && user?.id === swap.fromUserId && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleStatusChange(swap.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};
