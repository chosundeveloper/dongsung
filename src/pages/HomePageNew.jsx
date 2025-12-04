import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, CircularProgress, Alert, Button, Container, TextField, IconButton, Avatar, Divider } from '@mui/material';
import { format } from 'date-fns';
import { useNavigate, useOutletContext } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import GoogleCalendar from '../components/GoogleCalendar';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { API_URL } from '../utils/api';

const HomePage = () => {
  const { isAuthenticated } = useOutletContext();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyPhoto, setDailyPhoto] = useState(null);
  const [comments, setComments] = useState([]);
  const [photoDates, setPhotoDates] = useState({});
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadImages, setUploadImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Get current user info from token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUser(payload.user);
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
    }
  }, [isAuthenticated, navigate]);

  const fetchPhotoDates = () => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/daily-photos/counts/all`, {
      headers: {
        'x-auth-token': token,
      },
    })
      .then(response => response.json())
      .then(data => {
        setPhotoDates(data.data || {});
      })
      .catch(err => {
        console.error('Error fetching photo dates:', err);
      });
  };

  const fetchDailyPhoto = () => {
    if (!isAuthenticated) return;
    setLoadingPhoto(true);
    setError(null);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const token = localStorage.getItem('token');

    fetch(`${API_URL}/api/daily-photos/${formattedDate}`, {
      headers: {
        'x-auth-token': token,
      },
    })
      .then(response => response.json())
      .then(data => {
        setDailyPhoto(data.data);
        if (data.data) {
          fetchComments(data.data.id);
        } else {
          setComments([]);
        }
      })
      .catch(err => {
        console.error('Error fetching daily photo:', err);
        setError('사진을 불러오는 데 실패했습니다.');
      })
      .finally(() => {
        setLoadingPhoto(false);
      });
  };

  const fetchComments = (dailyPhotoId) => {
    if (!dailyPhotoId) return;
    setLoadingComments(true);
    const token = localStorage.getItem('token');

    fetch(`${API_URL}/api/comments/${dailyPhotoId}`, {
      headers: {
        'x-auth-token': token,
      },
    })
      .then(response => response.json())
      .then(data => {
        setComments(data.data || []);
      })
      .catch(err => {
        console.error('Error fetching comments:', err);
      })
      .finally(() => {
        setLoadingComments(false);
      });
  };

  useEffect(() => {
    fetchPhotoDates();
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDailyPhoto();
  }, [selectedDate, isAuthenticated]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setUploadImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (e) => {
    e.preventDefault();
    if (!uploadAuthor.trim() || !uploadPassword.trim()) {
      alert('이름과 비밀번호를 입력해주세요.');
      return;
    }
    if (uploadImages.length === 0) {
      alert('사진을 선택해주세요.');
      return;
    }

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('authorName', uploadAuthor);
    formData.append('password', uploadPassword);
    formData.append('date', format(selectedDate, 'yyyy-MM-dd'));

    uploadImages.forEach(file => {
      formData.append('images', file);
    });

    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/daily-photos`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.data) {
          setDailyPhoto(data.data);
          fetchPhotoDates();
          setShowUploadForm(false);
          setUploadAuthor('');
          setUploadPassword('');
          setUploadImages([]);
          setPreviewImages([]);
        }
      })
      .catch(error => {
        console.error('Error uploading photo:', error);
        alert('사진 업로드에 실패했습니다.');
      })
      .finally(() => {
        setIsUploadingPhoto(false);
      });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !dailyPhoto) return;

    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        dailyPhotoId: dailyPhoto.id,
        content: newComment,
      }),
    })
      .then(response => response.json())
      .then(data => {
        setNewComment('');
        fetchComments(dailyPhoto.id);
      })
      .catch(error => {
        console.error('Error posting comment:', error);
        alert('묵상 작성에 실패했습니다.');
      });
  };

  const handleDeleteComment = (commentId) => {
    if (!window.confirm('이 묵상을 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    })
      .then(response => response.json())
      .then(() => {
        fetchComments(dailyPhoto.id);
      })
      .catch(error => {
        console.error('Error deleting comment:', error);
        alert('묵상 삭제에 실패했습니다.');
      });
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="warning">로그인해야 이 페이지를 볼 수 있습니다.</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login')}>로그인 페이지로 이동</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', my: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 5,
          pb: 3,
          borderBottom: '2px solid',
          borderImage: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%) 1',
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
          }}
        >
          말씀 묵상 달력
        </Typography>
      </Box>

      {/* 달력 */}
      <Box sx={{ mb: 4 }}>
        <GoogleCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          photoDates={photoDates}
        />
      </Box>

      {/* 사진과 묵상 */}
      <Box>
          <Typography
            variant="h5"
            component="h3"
            gutterBottom
            sx={{
              mb: 3,
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            📖 {format(selectedDate, 'yyyy년 MM월 dd일')}
          </Typography>

          {loadingPhoto ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              {/* 사진 업로드/표시 영역 */}
              <Paper
                elevation={0}
                sx={{
                  mb: 4,
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                {dailyPhoto ? (
                  <Box
                    component="img"
                    src={`${API_URL}${dailyPhoto.imageUrl}`}
                    alt="Daily photo"
                    sx={{
                      width: '100%',
                      maxHeight: '500px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : !showUploadForm ? (
                  <Box
                    sx={{
                      p: 8,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      오늘의 말씀을 등록해주세요
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setShowUploadForm(true)}
                      sx={{
                        mt: 2,
                        px: 4,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)',
                        borderRadius: 3,
                        fontWeight: 600,
                        '&:hover': {
                          boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
                        },
                      }}
                    >
                      📖 말씀 등록
                    </Button>
                  </Box>
                ) : (
                  <Box
                    component="form"
                    onSubmit={handlePhotoUpload}
                    sx={{
                      p: 4,
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#1e293b' }}>
                      📖 말씀 사진 등록
                    </Typography>
                    <TextField
                      label="작성자 이름"
                      value={uploadAuthor}
                      onChange={(e) => setUploadAuthor(e.target.value)}
                      required
                      fullWidth
                      sx={{ mb: 2, bgcolor: 'white', borderRadius: 2 }}
                    />
                    <TextField
                      label="비밀번호 (수정/삭제 시 필요)"
                      type="password"
                      value={uploadPassword}
                      onChange={(e) => setUploadPassword(e.target.value)}
                      required
                      fullWidth
                      sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
                    />
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{
                        mb: 2,
                        py: 2,
                        borderColor: '#667eea',
                        color: '#667eea',
                        borderRadius: 2,
                        fontWeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        '&:hover': {
                          borderColor: '#764ba2',
                          background: 'rgba(102, 126, 234, 0.08)',
                        }
                      }}
                    >
                      <span>📷 사진 촬영</span>
                      <span style={{ fontSize: '0.85rem' }}>또는 선택</span>
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                      />
                    </Button>
                    {previewImages.length > 0 && (
                      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {previewImages.map((img, idx) => (
                          <Box key={idx} sx={{ position: 'relative' }}>
                            <img
                              src={img}
                              alt={`preview ${idx}`}
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveImage(idx)}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                width: 24,
                                height: 24,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setShowUploadForm(false);
                          setUploadImages([]);
                          setPreviewImages([]);
                        }}
                        sx={{ flex: 1, py: 1.5, borderRadius: 2 }}
                      >
                        취소
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isUploadingPhoto}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          fontWeight: 600,
                        }}
                      >
                        {isUploadingPhoto ? '등록 중...' : '등록하기'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>

              {/* 묵상 댓글 영역 */}
              {dailyPhoto && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}
                  >
                    📜 오늘의 묵상 노트
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    한 줄 댓글 느낌이 아닌, 오늘 받은 은혜와 다짐을 정성껏 기록해 주세요.
                  </Typography>

                  {/* 댓글 작성 폼 */}
                  <Box
                    component="form"
                    onSubmit={handleCommentSubmit}
                    sx={{
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
                      borderRadius: 3,
                      border: '1px solid #e0e7ff',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#4338ca', fontWeight: 600, mb: 1 }}>
                      나눔 제목 (선택)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="말씀을 통해 느낀 감동, 적용하고 싶은 삶의 방향을 구체적으로 적어주세요."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          background: '#ffffff',
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: '#c7d2fe',
                          },
                          '&:hover fieldset': {
                            borderColor: '#818cf8',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#4f46e5',
                          }
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        endIcon={<SendIcon />}
                        disabled={!newComment.trim()}
                        sx={{
                          px: 4,
                          py: 1.2,
                          fontWeight: 600,
                          borderRadius: 999,
                          background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(79, 70, 229, 0.3)',
                          }
                        }}
                      >
                        묵상 기록하기
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 4 }} />

                  {/* 댓글 목록 */}
                  {loadingComments ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : comments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary">
                        첫 번째 묵상을 정성껏 남겨주세요.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {comments.map((comment) => (
                        <Paper
                          key={comment.id}
                          elevation={0}
                          sx={{
                            p: 3.5,
                            borderRadius: 4,
                            border: '1px solid rgba(99,102,241,0.2)',
                            background: 'linear-gradient(135deg, #ffffff 0%, #fdf4ff 100%)',
                            position: 'relative',
                          }}
                        >
                          <FormatQuoteIcon
                            fontSize="large"
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              color: 'rgba(99,102,241,0.3)'
                            }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                                  fontSize: '1rem',
                                }}
                              >
                                {comment.username.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1f2937' }}>
                                  {comment.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(comment.createdAt).toLocaleString('ko-KR', {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                            {currentUser && currentUser.id === comment.userId && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComment(comment.id)}
                                sx={{ color: '#ef4444' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              color: '#1f2937',
                              lineHeight: 1.9,
                              fontSize: '1.05rem',
                              whiteSpace: 'pre-wrap',
                              fontWeight: 500,
                            }}
                          >
                            {comment.content}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Paper>
              )}
            </>
          )}
      </Box>
    </Box>
  );
};

export default HomePage;
