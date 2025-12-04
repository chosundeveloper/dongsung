import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  IconButton,
  Collapse,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Avatar,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
// Removed framer-motion for performance
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CircleIcon from '@mui/icons-material/Circle';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { API_URL, apiRequest } from '../utils/api';
import ChatWidget from '../components/ChatWidget';

const formatDate = (date) => format(date, 'yyyy-MM-dd');
const formatDisplayDate = (value) => {
  try {
    return format(parseISO(value), 'M월 d일 (EEE)', { locale: ko });
  } catch (error) {
    return value;
  }
};

const formatTimestamp = (value) => {
  try {
    return format(parseISO(value), 'M월 d일 HH:mm', { locale: ko });
  } catch (error) {
    return value;
  }
};

// Modern Glassmorphism & Neumorphism Styles
const glassStyle = {
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    bgcolor: 'rgba(15, 23, 42, 0.6)',
    color: '#fff',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#818cf8', borderWidth: 2 },
    '&.Mui-focused': { bgcolor: 'rgba(15, 23, 42, 0.8)' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(148, 163, 184, 0.8)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
};

const initialShareForm = { authorName: '', password: '', content: '' };

const ShareDialog = ({ open, mode, values, onClose, onSubmit, onChange }) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 4,
        bgcolor: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    }}
  >
    <DialogTitle sx={{ fontWeight: 700 }}>{mode === 'edit' ? '나눔 수정' : '나눔 삭제'}</DialogTitle>
    <DialogContent>
      {mode === 'edit' && (
        <TextField
          label="내용"
          multiline
          minRows={4}
          margin="normal"
          fullWidth
          value={values.content}
          onChange={(e) => onChange('content', e.target.value)}
          sx={inputStyle}
        />
      )}
      <TextField
        label="비밀번호"
        type="password"
        margin="normal"
        fullWidth
        value={values.password}
        onChange={(e) => onChange('password', e.target.value)}
        autoComplete="current-password"
        sx={inputStyle}
      />
    </DialogContent>
    <DialogActions sx={{ p: 2.5 }}>
      <Button onClick={onClose} sx={{ color: '#94a3b8' }}>취소</Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        color={mode === 'delete' ? 'error' : 'primary'}
        sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
      >
        {mode === 'edit' ? '수정완료' : '삭제하기'}
      </Button>
    </DialogActions>
  </Dialog>
);

function ServerDay(props) {
  const { highlightedDays = {}, day, outsideCurrentMonth, ...other } = props;
  const dateStr = format(day, 'yyyy-MM-dd');
  const dayData = highlightedDays[dateStr];

  const hasWord = dayData?.hasWord;
  const shareCount = dayData?.shareCount || 0;

  return (
    <Badge
      key={props.day.toString()}
      overlap="circular"
      badgeContent={shareCount > 0 ? shareCount : undefined}
      color="secondary"
      sx={{
        '& .MuiBadge-badge': {
          fontSize: '0.6rem',
          height: 16,
          minWidth: 16,
          right: 4,
          top: 4,
        }
      }}
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
        sx={{
          ...(hasWord && !outsideCurrentMonth && {
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: '#818cf8',
            }
          })
        }}
      />
    </Badge>
  );
}

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarSummary, setCalendarSummary] = useState({});

  const [dailyWord, setDailyWord] = useState(null);
  const [dailyWordFormOpen, setDailyWordFormOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // 기존 이미지 (서버에서 가져온)
  const [imagesToDelete, setImagesToDelete] = useState([]); // 삭제할 기존 이미지 ID
  const [fileAttachment, setFileAttachment] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [wordAuthorName, setWordAuthorName] = useState('');
  const [wordPassword, setWordPassword] = useState('');

  const [shareForm, setShareForm] = useState(initialShareForm);
  const [shareFormOpen, setShareFormOpen] = useState(false);
  const [shares, setShares] = useState([]);

  const [loadingDailyWord, setLoadingDailyWord] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [shareDialog, setShareDialog] = useState({ open: false, mode: 'edit', share: null, content: '', password: '' });

  const selectedDateStr = useMemo(() => formatDate(selectedDate), [selectedDate]);
  const dateLabel = useMemo(() => formatDisplayDate(selectedDateStr), [selectedDateStr]);

  useEffect(() => {
    fetchCalendarSummary();
  }, []); // Initial fetch

  useEffect(() => {
    fetchDailyWord();
    fetchShares();
  }, [selectedDateStr]);

  useEffect(() => {
    setImageFiles([]);
    setImagePreviews([]);
    setFileAttachment(null);
    setDeletePassword('');
    setWordAuthorName('');
    setWordPassword('');
    setImagesToDelete([]);
    // 기존 이미지 설정
    if (dailyWord?.images?.length > 0) {
      setExistingImages(dailyWord.images);
    } else if (dailyWord?.imageUrl) {
      // 레거시 단일 이미지 지원
      setExistingImages([{ id: 'legacy', imageUrl: dailyWord.imageUrl }]);
    } else {
      setExistingImages([]);
    }
  }, [dailyWord]);

  const fetchCalendarSummary = async () => {
    try {
      const data = await apiRequest(`/api/calendar/summary`);
      setCalendarSummary(data.data || {});
    } catch (error) {
      console.error('Failed to fetch calendar summary:', error);
    }
  };

  const fetchDailyWord = async () => {
    setLoadingDailyWord(true);
    try {
      const data = await apiRequest(`/api/daily-words/${selectedDateStr}`, { ignoreNotFound: true });
      setDailyWord(data.data || null);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
      setDailyWord(null);
    } finally {
      setLoadingDailyWord(false);
    }
  };

  const fetchShares = async () => {
    setLoadingShares(true);
    try {
      const data = await apiRequest(`/api/word-shares/${selectedDateStr}`, { headers: {} });
      setShares(data.data || []);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
      setShares([]);
    }
 finally {
      setLoadingShares(false);
    }
  };

  const handleShareFormChange = (field, value) => {
    setShareForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setImageFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imageId) => {
    if (imageId === 'legacy') {
      // 레거시 이미지는 실제로 삭제할 수 없으므로 UI에서만 숨김
      setExistingImages(prev => prev.filter(img => img.id !== 'legacy'));
    } else {
      setImagesToDelete(prev => [...prev, imageId]);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFileAttachment(file);
  };

  const handleDailyWordSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!wordAuthorName.trim() || !wordPassword.trim()) {
        throw new Error('이름과 비밀번호를 입력해 주세요.');
      }
      // 기존 이미지가 있거나 새 이미지가 있어야 함
      const hasExistingImages = existingImages.length > 0;
      const hasNewImages = imageFiles.length > 0;
      if (!hasExistingImages && !hasNewImages && !dailyWord?.imageUrl) {
        throw new Error('등록할 사진을 선택해 주세요.');
      }

      const formData = new FormData();
      formData.append('date', selectedDateStr);
      formData.append('authorName', wordAuthorName);
      formData.append('password', wordPassword);
      formData.append('title', `${dateLabel} 말씀`);
      formData.append('passage', '');
      formData.append('content', '사진 말씀입니다.');

      // 모든 새 이미지 추가
      imageFiles.forEach(file => {
        formData.append('image', file);
      });

      // 삭제할 이미지 ID 추가 (legacy 제외)
      const deleteIds = imagesToDelete.filter(id => id !== 'legacy');
      if (deleteIds.length > 0) {
        formData.append('deleteImages', deleteIds.join(','));
      }

      if (fileAttachment) formData.append('file', fileAttachment);

      const data = await apiRequest(`/api/daily-words`, {
        method: 'POST',
        body: formData,
      });
      setDailyWord(data.data);
      setImageFiles([]);
      setImagePreviews([]);
      setImagesToDelete([]);
      setFileAttachment(null);
      setWordAuthorName('');
      setWordPassword('');
      setFeedback({ type: 'success', message: '말씀 사진이 등록되었습니다.' });
      setDailyWordFormOpen(false);
      fetchCalendarSummary();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const handleDailyWordDelete = async () => {
    if (!deletePassword) {
      setFeedback({ type: 'error', message: '삭제하려면 관리자 비밀번호(1234)를 입력해 주세요.' });
      return;
    }
    try {
      await apiRequest(`/api/daily-words/${selectedDateStr}`, {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword }),
      });
      setDailyWord(null);
      setImageFiles([]);
      setImagePreviews([]);
      setDeletePassword('');
      setFeedback({ type: 'success', message: '말씀이 삭제되었습니다.' });
      fetchCalendarSummary();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const handleShareSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...shareForm, date: selectedDateStr };
      const data = await apiRequest(`/api/word-shares`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setShares((prev) => [...prev, data.data]);
      setShareForm(initialShareForm);
      setShareFormOpen(false);
      setFeedback({ type: 'success', message: '나눔이 등록되었습니다.' });
      fetchCalendarSummary(); // Update calendar badges
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const openShareDialog = (share, mode) => {
    setShareDialog({
      open: true,
      mode,
      share,
      content: mode === 'edit' ? share.content : '',
      password: '',
    });
  };

  const closeShareDialog = () => setShareDialog((prev) => ({ ...prev, open: false }));
  const handleShareDialogChange = (field, value) => setShareDialog((prev) => ({ ...prev, [field]: value }));

  const handleShareDialogSubmit = async () => {
    if (!shareDialog.share) return;
    try {
      if (shareDialog.mode === 'edit') {
        const data = await apiRequest(`/api/word-shares/${shareDialog.share.id}`, {
          method: 'PUT',
          body: JSON.stringify({ password: shareDialog.password, content: shareDialog.content }),
        });
        setShares((prev) => prev.map((item) => (item.id === data.data.id ? data.data : item)));
        setFeedback({ type: 'success', message: '나눔이 수정되었습니다.' });
      } else {
        await apiRequest(`/api/word-shares/${shareDialog.share.id}`, {
          method: 'DELETE',
          body: JSON.stringify({ password: shareDialog.password }),
        });
        setShares((prev) => prev.filter((item) => item.id !== shareDialog.share.id));
        setFeedback({ type: 'success', message: '나눔이 삭제되었습니다.' });
      }
      closeShareDialog();
      fetchCalendarSummary(); // Update calendar badges
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
      <Container maxWidth="sm" sx={{ px: 2, pt: 3 }}>

        {/* Calendar Section */}
        <Box>
          <Paper sx={{ ...glassStyle, borderRadius: 2, mb: 4, p: 2, color: '#fff' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
              <DateCalendar
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slots={{
                  day: ServerDay,
                }}
                slotProps={{
                  day: {
                    highlightedDays: calendarSummary,
                  },
                }}
                sx={{
                  color: '#fff',
                  width: '100%',
                  '& .MuiPickersCalendarHeader-root': { color: '#fff' },
                  '& .MuiDayCalendar-weekDayLabel': { color: '#94a3b8' },
                  '& .MuiPickersDay-root': {
                    color: '#fff',
                    '&.Mui-selected': {
                      bgcolor: '#fff !important',
                      color: '#0f172a !important',
                      fontWeight: 'bold'
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  },
                  '& .MuiPickersYear-yearButton': { color: '#fff' },
                  '& .MuiIconButton-root': { color: '#fff' }
                }}
              />
            </LocalizationProvider>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#818cf8' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>말씀 등록됨</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: theme.palette.secondary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>N</Box>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>나눔 개수</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {feedback && (
          <Box>
            <Alert
              severity={feedback.type}
              onClose={() => setFeedback(null)}
              sx={{ mb: 3, borderRadius: 3, bgcolor: 'rgba(30, 41, 59, 0.9)', color: '#fff' }}
            >
              {feedback.message}
            </Alert>
          </Box>
        )}

        {/* Daily Word Section */}
        <Box>
          <Paper elevation={0} sx={{ ...glassStyle, borderRadius: 2, overflow: 'hidden', mb: 4 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                label={dateLabel}
                sx={{ bgcolor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 600 }}
              />
              <Button
                size="small"
                onClick={() => setDailyWordFormOpen(!dailyWordFormOpen)}
                sx={{ color: '#94a3b8', minWidth: 'auto' }}
              >
                {dailyWordFormOpen ? <CloseIcon /> : <EditIcon />}
              </Button>
            </Box>

            <Collapse in={dailyWordFormOpen}>
                  <Box component="form" onSubmit={handleDailyWordSubmit} sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                        오늘의 말씀 사진을 올려주세요.
                      </Typography>

                      <TextField
                        placeholder="이름"
                        size="small"
                        required
                        value={wordAuthorName}
                        onChange={(e) => setWordAuthorName(e.target.value)}
                        sx={inputStyle}
                      />
                      <TextField
                        placeholder="비밀번호 (수정/삭제 시 필요)"
                        size="small"
                        type="password"
                        required
                        value={wordPassword}
                        onChange={(e) => setWordPassword(e.target.value)}
                        sx={inputStyle}
                      />

                      <Stack direction="row" spacing={1}>
                        <Button component="label" variant="outlined" size="large" fullWidth sx={{ borderRadius: 2, color: '#cbd5e1', borderColor: '#475569', py: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <CameraAltIcon />
                          <span style={{ fontSize: '0.85rem' }}>사진 촬영</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>또는 선택</span>
                          <input type="file" accept="image/*" multiple hidden onChange={handleImageChange} />
                        </Button>
                        <Button component="label" variant="outlined" size="large" fullWidth sx={{ borderRadius: 2, color: '#cbd5e1', borderColor: '#475569', py: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <AttachFileIcon />
                          <span style={{ fontSize: '0.85rem' }}>파일 첨부</span>
                          <input type="file" hidden onChange={handleFileChange} />
                        </Button>
                      </Stack>

                      {/* 기존 이미지 표시 */}
                      {existingImages.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                            기존 사진 (X를 눌러 삭제)
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {existingImages.map((img) => (
                              <Box key={img.id} sx={{ position: 'relative' }}>
                                <img
                                  src={`${API_URL}${img.imageUrl}`}
                                  alt="기존 이미지"
                                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #4ade80' }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveExistingImage(img.id)}
                                  sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    bgcolor: 'rgba(239,68,68,0.9)',
                                    color: '#fff',
                                    width: 22,
                                    height: 22,
                                    '&:hover': { bgcolor: 'rgba(220,38,38,1)' }
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* 새로 추가할 이미지 미리보기 */}
                      {imagePreviews.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                            새로 추가할 사진
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {imagePreviews.map((preview, idx) => (
                              <Box key={idx} sx={{ position: 'relative' }}>
                                <img src={preview} alt={`Preview ${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #818cf8' }} />
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveImage(idx)}
                                  sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    bgcolor: 'rgba(0,0,0,0.7)',
                                    color: '#fff',
                                    width: 22,
                                    height: 22,
                                    '&:hover': { bgcolor: 'rgba(239,68,68,0.9)' }
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {fileAttachment && (
                        <Typography variant="caption" sx={{ color: '#818cf8' }}>
                          첨부파일: {fileAttachment.name}
                        </Typography>
                      )}

                      <Button type="submit" variant="contained" fullWidth sx={{ borderRadius: 2, py: 1.5, fontWeight: 700, background: 'linear-gradient(to right, #6366f1, #8b5cf6)', fontSize: '1rem' }}>
                        {dailyWord ? '사진 수정하기' : '사진 등록하기'}
                      </Button>

                      {dailyWord && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block' }}>삭제하려면 비밀번호를 입력하세요.</Typography>
                          <Stack direction="row" spacing={1}>
                            <TextField
                              size="small"
                              type="password"
                              placeholder="비밀번호"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              sx={inputStyle}
                            />
                            <Button onClick={handleDailyWordDelete} color="error" variant="outlined" sx={{ borderRadius: 2 }}>
                              삭제
                            </Button>
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Box>
            </Collapse>

            {loadingDailyWord ? (
              <Box sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>로딩중...</Box>
            ) : dailyWord ? (
              <Box>
                {/* 다중 이미지 표시 */}
                {dailyWord.images && dailyWord.images.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dailyWord.images.map((img, idx) => (
                      <Box key={img.id} sx={{ position: 'relative', width: '100%' }}>
                        <Box
                          component="img"
                          src={`${API_URL}${img.imageUrl}`}
                          alt={`Daily Word ${idx + 1}`}
                          sx={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : dailyWord.imageUrl && (
                  <Box sx={{ position: 'relative', width: '100%' }}>
                    <Box
                      component="img"
                      src={`${API_URL}${dailyWord.imageUrl}`}
                      alt="Daily Word"
                      sx={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                  </Box>
                )}
                <Box sx={{ p: 2 }}>
                  {dailyWord.fileUrl && (
                    <Button
                      component="a"
                      href={`${API_URL}${dailyWord.fileUrl}`}
                      target="_blank"
                      startIcon={<AttachFileIcon />}
                      fullWidth
                      variant="outlined"
                      sx={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}
                    >
                      첨부파일 다운로드
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 6, textAlign: 'center', color: '#64748b' }}>
                <Typography variant="body1">등록된 말씀 사진이 없습니다.</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Shares Section */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon sx={{ color: '#f472b6' }} />
            나눔 공간 <Box component="span" sx={{ fontSize: '0.8em', color: '#64748b', ml: 1 }}>{shares.length}</Box>
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShareFormOpen(true)}
            sx={{
              bgcolor: '#f472b6',
              color: '#fff',
              borderRadius: 10,
              px: 2,
              '&:hover': { bgcolor: '#db2777' }
            }}
          >
            나눔 쓰기
          </Button>
        </Box>

        <Collapse in={shareFormOpen} sx={{ mb: shareFormOpen ? 3 : 0 }}>
              <Paper sx={{ ...glassStyle, p: 3, borderRadius: 2 }}>
                <Stack spacing={2} component="form" onSubmit={handleShareSubmit}>
                  <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>새로운 나눔 작성</Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField placeholder="이름" size="small" required value={shareForm.authorName} onChange={(e) => handleShareFormChange('authorName', e.target.value)} sx={inputStyle} />
                    <TextField placeholder="비밀번호" size="small" type="password" required value={shareForm.password} onChange={(e) => handleShareFormChange('password', e.target.value)} sx={inputStyle} />
                  </Stack>
                  <TextField placeholder="오늘 받은 은혜를 나누어 주세요..." multiline minRows={3} required value={shareForm.content} onChange={(e) => handleShareFormChange('content', e.target.value)} sx={inputStyle} />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button onClick={() => setShareFormOpen(false)} sx={{ color: '#94a3b8' }}>취소</Button>
                    <Button type="submit" variant="contained" sx={{ borderRadius: 2, bgcolor: '#818cf8' }}>등록</Button>
                  </Stack>
                </Stack>
              </Paper>
        </Collapse>

        <Stack spacing={2}>
            {loadingShares ? (
              <Typography sx={{ textAlign: 'center', color: '#64748b', py: 4 }}>나눔을 불러오는 중...</Typography>
            ) : shares.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
                <Typography variant="body1" sx={{ color: '#94a3b8' }}>첫 번째 나눔의 주인공이 되어보세요!</Typography>
              </Box>
            ) : (
              shares.map((share) => (
                  <Paper key={share.id} sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    '&:hover': { bgcolor: 'rgba(30, 41, 59, 0.6)' },
                    transition: 'all 0.2s'
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#334155', fontSize: '0.8rem', fontWeight: 700 }}>
                          {share.authorName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                            {share.authorName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {formatTimestamp(share.updatedAt || share.createdAt)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Box>
                        <IconButton size="small" onClick={() => openShareDialog(share, 'edit')} sx={{ color: '#475569', '&:hover': { color: '#94a3b8' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => openShareDialog(share, 'delete')} sx={{ color: '#475569', '&:hover': { color: '#ef4444' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Stack>
                    <Typography sx={{ mt: 2, color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.95rem', pl: 1, borderLeft: '2px solid #475569' }}>
                      {share.content}
                    </Typography>
                  </Paper>
              ))
            )}
        </Stack>

        <ShareDialog
          open={shareDialog.open}
          mode={shareDialog.mode}
          values={shareDialog}
          onClose={closeShareDialog}
          onSubmit={handleShareDialogSubmit}
          onChange={handleShareDialogChange}
        />
      </Container>
      <ChatWidget appName="dongsung" />
    </Box>
  );
};

export default HomePage;
