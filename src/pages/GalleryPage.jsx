import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Button,
  TextField,
  Stack,
  Paper,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { API_URL, apiRequest } from '../utils/api';

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'rgba(15, 23, 42, 0.6)',
    color: '#fff',
    '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#818cf8' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(148, 163, 184, 0.8)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
};

const GalleryPage = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, photo: null });
  const [feedback, setFeedback] = useState(null);

  // Upload form state
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const data = await apiRequest('/api/gallery');
      setPhotos(data.data || []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setFeedback({ type: 'error', message: '로그인이 필요합니다.' });
      return;
    }
    if (!imageFile) {
      setFeedback({ type: 'error', message: '사진을 선택해 주세요.' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('image', imageFile);

      const response = await fetch(`${API_URL}/api/gallery`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사진 업로드에 실패했습니다.');
      }

      // Refresh the photo list from server
      await fetchPhotos();
      setUploadOpen(false);
      setTitle('');
      setImageFile(null);
      setImagePreview(null);
      setFeedback({ type: 'success', message: '사진이 등록되었습니다.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setFeedback({ type: 'error', message: '로그인이 필요합니다.' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/gallery/${deleteDialog.photo.id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사진 삭제에 실패했습니다.');
      }

      setPhotos(prev => prev.filter(p => p.id !== deleteDialog.photo.id));
      setDeleteDialog({ open: false, photo: null });
      setSelectedImage(null);
      setFeedback({ type: 'success', message: '사진이 삭제되었습니다.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  return (
    <Box sx={{
      bgcolor: '#0f172a',
      minHeight: '100vh',
      pb: 10,
      background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)'
    }}>
      <Container maxWidth="lg" sx={{ px: 2, pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
            사진 갤러리
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{
              bgcolor: '#818cf8',
              borderRadius: 10,
              px: 2,
              '&:hover': { bgcolor: '#6366f1' }
            }}
          >
            사진 올리기
          </Button>
        </Box>

        {feedback && (
          <Alert
            severity={feedback.type}
            onClose={() => setFeedback(null)}
            sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', color: '#fff' }}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Upload Form */}
        {uploadOpen && (
          <Paper sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            bgcolor: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
              새 사진 올리기
            </Typography>
            <Stack spacing={2} component="form" onSubmit={handleUpload}>
              <TextField
                placeholder="제목 (선택)"
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={inputStyle}
                fullWidth
              />
              <Button
                component="label"
                variant="outlined"
                fullWidth
                sx={{
                  py: 2,
                  borderRadius: 2,
                  color: '#cbd5e1',
                  borderColor: '#475569',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <CameraAltIcon />
                <span>사진 촬영 또는 선택</span>
                <input type="file" accept="image/*" hidden onChange={handleImageSelect} />
              </Button>
              {imagePreview && (
                <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', display: 'block', borderRadius: 8 }} />
                </Box>
              )}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={() => {
                  setUploadOpen(false);
                  setImageFile(null);
                  setImagePreview(null);
                }} sx={{ color: '#94a3b8' }}>
                  취소
                </Button>
                <Button type="submit" variant="contained" disabled={uploading} sx={{ borderRadius: 2, bgcolor: '#818cf8' }}>
                  {uploading ? '업로드 중...' : '등록'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#818cf8' }} />
          </Box>
        ) : photos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: '#64748b' }}>
              아직 등록된 사진이 없습니다. 첫 번째 사진을 올려보세요!
            </Typography>
          </Box>
        ) : (
          <ImageList variant="masonry" cols={3} gap={8}>
            {photos.filter(photo => photo && photo.id).map((photo) => (
              <ImageListItem
                key={photo.id}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2,
                  overflow: 'hidden',
                  '&:hover': { opacity: 0.9, transform: 'scale(1.02)' },
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedImage(photo)}
              >
                <img
                  src={`${API_URL}${photo.imageUrl}`}
                  alt={photo.title || '갤러리 사진'}
                  loading="lazy"
                  style={{ borderRadius: 8 }}
                />
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  borderRadius: '0 0 8px 8px'
                }}>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                    {photo.authorName}
                  </Typography>
                  {photo.title && (
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                      {photo.title}
                    </Typography>
                  )}
                </Box>
              </ImageListItem>
            ))}
          </ImageList>
        )}

        {/* View Image Dialog */}
        <Dialog
          open={Boolean(selectedImage) && !deleteDialog.open}
          onClose={() => setSelectedImage(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { bgcolor: '#000', borderRadius: 2 } }}
        >
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#fff',
              bgcolor: 'rgba(0,0,0,0.5)',
              zIndex: 1,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <IconButton
            onClick={() => setDeleteDialog({ open: true, photo: selectedImage })}
            sx={{
              position: 'absolute',
              top: 8,
              right: 56,
              color: '#ef4444',
              bgcolor: 'rgba(0,0,0,0.5)',
              zIndex: 1,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <DeleteIcon />
          </IconButton>
          {selectedImage && (
            <Box>
              <img
                src={`${API_URL}${selectedImage.imageUrl}`}
                alt={selectedImage.title || '갤러리 사진'}
                style={{ width: '100%', display: 'block' }}
              />
              <Box sx={{ p: 2 }}>
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>{selectedImage.authorName}</Typography>
                {selectedImage.title && <Typography sx={{ color: '#94a3b8' }}>{selectedImage.title}</Typography>}
              </Box>
            </Box>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, photo: null })}
          PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', borderRadius: 3 } }}
        >
          <DialogContent>
            <Typography sx={{ mb: 2 }}>정말로 삭제하시겠습니까?</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialog({ open: false, photo: null })} sx={{ color: '#94a3b8' }}>
              취소
            </Button>
            <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>
              삭제
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default GalleryPage;
