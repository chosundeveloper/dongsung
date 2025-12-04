import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, Stack, IconButton, ImageList, ImageListItem, Dialog, DialogContent } from '@mui/material';
import { Close as CloseIcon, ZoomIn as ZoomInIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { API_URL } from '../utils/api';

const PostForm = ({ onCancel, onSave, initialDate }) => {
  const [authorName, setAuthorName] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // If an initialDate is provided, you might want to display it or use it implicitly
    // For now, we'll just ensure it's used during submission.
  }, [initialDate]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);

    // 미리보기 생성
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('authorName', authorName);
    formData.append('password', password);
    formData.append('title', title);
    formData.append('content', content);

    // 여러 이미지 추가
    imageFiles.forEach((file, index) => {
      formData.append('images', file);
    });

    // If initialDate is provided, add it to formData
    if (initialDate) {
      formData.append('createdAt', format(initialDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
    }

    fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.message || '게시물 저장에 실패했습니다.');
          });
        }
        return response.json();
      })
      .then(data => {
        alert('게시물이 성공적으로 저장되었습니다.');
        onSave(); // Notify parent component (HomePage) about successful save
      })
      .catch(error => {
        console.error('Error saving post:', error);
        alert(`오류: ${error.message}`);
      });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 960,
        margin: '0 auto',
        p: 5,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #e2e8f0',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        align="center"
        gutterBottom
        sx={{
          fontWeight: 800,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 4,
        }}
      >
        ✏️ 새 글 작성 {initialDate && `(${format(initialDate, 'yyyy년 MM월 dd일')})`}
      </Typography>
      <Stack spacing={3}>
        <TextField
          label="작성자 이름"
          id="authorName"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          required
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover fieldset': {
                borderColor: '#667eea',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
                borderWidth: 2,
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#667eea',
            }
          }}
        />
        <TextField
          label="비밀번호 (수정/삭제 시 필요)"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover fieldset': {
                borderColor: '#667eea',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
                borderWidth: 2,
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#667eea',
            }
          }}
        />
        <TextField
          label="제목"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover fieldset': {
                borderColor: '#667eea',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
                borderWidth: 2,
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#667eea',
            }
          }}
        />
        <TextField
          label="내용"
          id="content"
          multiline
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              lineHeight: 1.8,
              '&:hover fieldset': {
                borderColor: '#667eea',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
                borderWidth: 2,
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#667eea',
            }
          }}
        />
        <Box>
          <Button
            variant="outlined"
            component="label"
            sx={{
              px: 4,
              py: 1.5,
              borderColor: '#667eea',
              color: '#667eea',
              borderRadius: 3,
              fontWeight: 600,
              '&:hover': {
                borderColor: '#764ba2',
                background: 'rgba(102, 126, 234, 0.08)',
              }
            }}
          >
            📷 사진 첨부 ({imageFiles.length})
            <input
              type="file"
              id="image"
              accept="image/*"
              multiple
              hidden
              onChange={handleImageChange}
            />
          </Button>
          {previewImages.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#475569' }}>
                첨부된 사진 ({previewImages.length}개)
              </Typography>
              <ImageList sx={{ width: '100%', maxHeight: 300 }} cols={3} rowHeight={150}>
                {previewImages.map((image, index) => (
                  <ImageListItem key={index} sx={{ position: 'relative' }}>
                    <img
                      src={image}
                      alt={`preview ${index}`}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleImageClick(image)}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                        },
                        width: 28,
                        height: 28,
                      }}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                        },
                        width: 28,
                        height: 28,
                      }}
                      size="small"
                      onClick={() => handleImageClick(image)}
                    >
                      <ZoomInIcon fontSize="small" />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}
        </Box>

        {/* 이미지 확대 다이얼로그 */}
        <Dialog
          open={Boolean(selectedImage)}
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#000' }}>
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.8)',
                },
                zIndex: 1,
              }}
              onClick={handleCloseDialog}
            >
              <CloseIcon />
            </IconButton>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="확대 이미지"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            )}
          </DialogContent>
        </Dialog>
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4, pt: 3, borderTop: '1px solid #e2e8f0' }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              px: 4,
              py: 1.5,
              borderColor: '#cbd5e1',
              color: '#64748b',
              borderRadius: 3,
              fontWeight: 600,
              '&:hover': {
                borderColor: '#94a3b8',
                background: '#f8fafc',
              }
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            type="submit"
            sx={{
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)',
              borderRadius: 3,
              fontWeight: 700,
              '&:hover': {
                boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            저장
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default PostForm;
