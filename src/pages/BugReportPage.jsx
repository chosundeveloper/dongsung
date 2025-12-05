import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

// 개발환경에서는 Vite 프록시 사용, 프로덕션에서는 직접 호출
const TRACKER_API_BASE = import.meta.env.DEV
  ? '/tracker-api'
  : 'http://tracker25.duckdns.org/api';
const TRACKER_API_KEY = 'pt_hzfEbq9xDbekwhCbe20IbPbj';

// Tracker API status → 내부 status 매핑
const mapStatusFromTracker = (status) => {
  const mapping = {
    backlog: 'open',
    selected: 'open',
    inProgress: 'in_progress',
    inReview: 'resolved',
    done: 'closed',
  };
  return mapping[status] || 'open';
};

// 내부 status → Tracker API status 매핑
const mapStatusToTracker = (status) => {
  const mapping = {
    open: 'backlog',
    in_progress: 'inProgress',
    resolved: 'inReview',
    closed: 'done',
  };
  return mapping[status] || 'backlog';
};

// Tracker API priority → 내부 priority 매핑
const mapPriorityFromTracker = (priority) => {
  const mapping = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    blocker: 'critical',
  };
  return mapping[priority] || 'medium';
};

// 내부 priority → Tracker API priority 매핑
const mapPriorityToTracker = (priority) => {
  const mapping = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'blocker',
  };
  return mapping[priority] || 'medium';
};

// API에서 이슈 목록 조회 (dongsung 프로젝트만 필터링)
const PROJECT_NAME = 'dongsung';

const fetchIssuesFromTracker = async () => {
  const res = await fetch(`${TRACKER_API_BASE}/issues`);
  if (!res.ok) throw new Error('Failed to fetch issues');
  const { data } = await res.json();
  // dongsung 프로젝트 이슈만 필터링
  const filtered = data.filter((issue) => issue.projectName === PROJECT_NAME);
  return filtered.map((issue) => ({
    id: issue.key || issue.id?.toString(),
    title: issue.title,
    description: issue.description || '',
    priority: mapPriorityFromTracker(issue.priority),
    status: mapStatusFromTracker(issue.status),
    reporter: issue.assignee || '',
    createdAt: issue.createdAt || new Date().toISOString(),
    updatedAt: issue.updatedAt || new Date().toISOString(),
  }));
};

// API에 이슈 생성
const createIssueOnTracker = async (bug) => {
  const res = await fetch(`${TRACKER_API_BASE}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': TRACKER_API_KEY,
    },
    body: JSON.stringify({
      title: bug.title,
      description: bug.description,
      priority: mapPriorityToTracker(bug.priority),
      status: mapStatusToTracker(bug.status),
      assignee: bug.reporter,
    }),
  });
  if (!res.ok) throw new Error('Failed to create issue');
  const { data } = await res.json();
  return data;
};

const STATUS_OPTIONS = [
  { value: 'open', label: '접수됨', color: '#ef4444' },
  { value: 'in_progress', label: '처리중', color: '#f59e0b' },
  { value: 'resolved', label: '해결됨', color: '#22c55e' },
  { value: 'closed', label: '종료', color: '#6b7280' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: '낮음', color: '#6b7280' },
  { value: 'medium', label: '보통', color: '#3b82f6' },
  { value: 'high', label: '높음', color: '#f59e0b' },
  { value: 'critical', label: '긴급', color: '#ef4444' },
];

const getStatusInfo = (status) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
const getPriorityInfo = (priority) => PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];

const BugReportPage = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
    reporter: '',
  });
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');

  // Load bugs from Tracker API
  const loadBugs = async () => {
    setLoading(true);
    setApiError('');
    try {
      const issues = await fetchIssuesFromTracker();
      setBugs(issues);
    } catch (err) {
      console.error('[tracker] Failed to load issues', err);
      setApiError('이슈 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugs();
  }, []);

  const handleOpenDialog = (bug = null) => {
    if (bug) {
      setEditingBug(bug);
      setFormData({
        title: bug.title,
        description: bug.description,
        priority: bug.priority,
        status: bug.status,
        reporter: bug.reporter,
      });
    } else {
      setEditingBug(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
        reporter: '',
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBug(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
      reporter: '',
    });
    setError('');
  };

  const handleSubmit = async () => {
    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedReporter = formData.reporter.trim();

    if (!trimmedTitle) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!trimmedDescription) {
      setError('설명을 입력해주세요.');
      return;
    }
    if (!trimmedReporter) {
      setError('작성자를 입력해주세요.');
      return;
    }

    if (editingBug) {
      // 수정은 현재 API에서 지원하지 않음 - 로컬에서만 UI 업데이트
      setError('수정 기능은 현재 지원되지 않습니다.');
      return;
    } else {
      // Create new bug via API
      try {
        await createIssueOnTracker({
          ...formData,
          title: trimmedTitle,
          description: trimmedDescription,
          reporter: trimmedReporter,
        });
        // 생성 후 목록 새로고침
        await loadBugs();
        handleCloseDialog();
      } catch (err) {
        console.error('[tracker] Failed to create issue', err);
        setError('이슈 생성에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleStatusChange = (bugId, newStatus) => {
    // API에서 수정 미지원 - 로컬 UI만 업데이트 (새로고침 시 원복됨)
    setApiError('⚠️ 상태 변경 기능은 아직 지원되지 않습니다. 등록된 이슈만 조회할 수 있습니다.');
  };

  const handleDelete = (bugId) => {
    // API에서 삭제 미지원
    setApiError('⚠️ 삭제 기능은 아직 지원되지 않습니다. 관리자에게 문의해주세요.');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderImage: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%) 1',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BugReportIcon sx={{ fontSize: 32, color: '#ef4444' }} />
          <Typography
            variant="h4"
            component="h1"
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            버그 리포트
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={loadBugs}
            disabled={loading}
            sx={{
              color: '#6b7280',
              '&:hover': { color: '#3b82f6' },
            }}
            title="새로고침"
          >
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
              boxShadow: '0 4px 15px 0 rgba(239, 68, 68, 0.4)',
              borderRadius: 3,
              fontWeight: 600,
              '&:hover': {
                boxShadow: '0 6px 20px 0 rgba(239, 68, 68, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            버그 등록
          </Button>
        </Box>
      </Box>

      {/* API Error Alert */}
      {apiError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={loadBugs}>
              다시 시도
            </Button>
          }
        >
          {apiError}
        </Alert>
      )}

      {/* Bug List */}
      {bugs.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          등록된 버그가 없습니다. 버그를 발견하면 등록해주세요!
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {bugs.map((bug) => {
            const statusInfo = getStatusInfo(bug.status);
            const priorityInfo = getPriorityInfo(bug.priority);

            return (
              <Card
                key={bug.id}
                sx={{
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  bgcolor: 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    borderColor: statusInfo.color,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        flex: 1,
                        minWidth: 200,
                      }}
                    >
                      {bug.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={priorityInfo.label}
                        size="small"
                        sx={{
                          bgcolor: `${priorityInfo.color}20`,
                          color: priorityInfo.color,
                          fontWeight: 600,
                          border: `1px solid ${priorityInfo.color}40`,
                        }}
                      />
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={bug.status}
                          onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                          disabled
                          title="상태 변경 기능은 아직 지원되지 않습니다"
                          sx={{
                            bgcolor: `${statusInfo.color}20`,
                            color: statusInfo.color,
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            '.MuiOutlinedInput-notchedOutline': {
                              borderColor: `${statusInfo.color}40`,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: statusInfo.color,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: statusInfo.color,
                            },
                            '.MuiSelect-icon': {
                              color: statusInfo.color,
                            },
                          }}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mb: 2,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7,
                    }}
                  >
                    {bug.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        작성자: <strong>{bug.reporter}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        등록: {new Date(bug.createdAt).toLocaleDateString('ko-KR')}
                      </Typography>
                      {bug.updatedAt !== bug.createdAt && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          수정: {new Date(bug.updatedAt).toLocaleDateString('ko-KR')}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'none', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => handleOpenDialog(bug)}
                        sx={{ color: '#3b82f6' }}
                        disabled
                        title="수정 기능은 아직 지원되지 않습니다"
                      >
                        수정
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleDelete(bug.id)}
                        sx={{ color: '#ef4444' }}
                        disabled
                        title="삭제 기능은 아직 지원되지 않습니다"
                      >
                        삭제
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Bug Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, fontWeight: 700 }}>
          {editingBug ? '버그 수정' : '버그 등록'}
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="제목"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="버그 제목을 입력하세요"
          />
          <TextField
            label="설명"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="버그에 대한 상세 설명을 입력하세요"
          />
          <TextField
            label="작성자"
            fullWidth
            value={formData.reporter}
            onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="이름을 입력하세요"
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>우선순위</InputLabel>
              <Select
                value={formData.priority}
                label="우선순위"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>상태</InputLabel>
              <Select
                value={formData.status}
                label="상태"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={editingBug}
            title={editingBug ? '수정 기능은 아직 지원되지 않습니다' : ''}
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
              fontWeight: 600,
            }}
          >
            {editingBug ? '수정하기' : '등록하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BugReportPage;
