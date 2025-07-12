import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface Skill {
  id: number;
  name: string;
  description: string;
  type: 'offered' | 'wanted';
  level: 'beginner' | 'intermediate' | 'advanced';
}

export const Skills = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'offered' as 'offered' | 'wanted',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
  });
  const [tab, setTab] = useState<'offered' | 'wanted'>('offered');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const { skills } = await apiService.getMySkills();
      setSkills(skills.offered.concat(skills.wanted));
    } catch (error) {
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData(skill);
    } else {
      setEditingSkill(null);
      setFormData({
        name: '',
        description: '',
        type: tab,
        level: 'beginner',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      if (editingSkill) {
        await apiService.updateSkill(editingSkill.id, formData);
        toast.success('Skill updated successfully');
      } else {
        await apiService.createSkill(formData);
        toast.success('Skill added successfully');
      }
      fetchSkills();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save skill');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteSkill(id);
      toast.success('Skill deleted successfully');
      fetchSkills();
    } catch (error) {
      toast.error('Failed to delete skill');
    }
  };

  const filteredSkills = skills.filter((skill) => skill.type === tab);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        My Skills
      </Typography>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Offered" value="offered" />
        <Tab label="Wanted" value="wanted" />
      </Tabs>
      <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
        Add Skill
      </Button>
      {loading ? (
        <CircularProgress sx={{ mt: 4 }} />
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {filteredSkills.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">No {tab} skills yet.</Alert>
            </Grid>
          ) : (
            filteredSkills.map((skill) => (
              <Grid item xs={12} sm={6} md={4} key={skill.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{skill.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {skill.description}
                    </Typography>
                    <Chip label={skill.level} sx={{ mt: 2 }} />
                    <Box sx={{ mt: 2 }}>
                      <IconButton onClick={() => handleOpenDialog(skill)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(skill.id)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add Skill'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
            >
              <MenuItem value="offered">Offered</MenuItem>
              <MenuItem value="wanted">Wanted</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Level</InputLabel>
            <Select
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value as any })
              }
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {editingSkill ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
