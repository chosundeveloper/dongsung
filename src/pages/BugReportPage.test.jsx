import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BugReportPage from './BugReportPage';

const mockBugsData = [
  {
    key: 'BUG-1',
    id: 1,
    title: '로그인 버튼 작동 안 함',
    description: '로그인 버튼을 클릭해도 반응이 없음',
    priority: 'high',
    status: 'backlog',
    assignee: '테스터',
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z',
    projectName: 'dongsung',
  },
  {
    key: 'BUG-2',
    id: 2,
    title: '페이지 로딩 느림',
    description: '홈페이지 로딩이 매우 느림',
    priority: 'medium',
    status: 'inProgress',
    assignee: '개발자',
    createdAt: '2025-12-02T10:00:00Z',
    updatedAt: '2025-12-02T10:00:00Z',
    projectName: 'dongsung',
  },
];

const renderBugReportPage = () => {
  return render(
    <BrowserRouter>
      <BugReportPage />
    </BrowserRouter>
  );
};

describe('BugReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('페이지 렌더링', () => {
    it('should render bug report page with title and button', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();

      await waitFor(() => {
        expect(screen.getByText('버그 리포트')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '버그 등록' })).toBeInTheDocument();
      });
    });

    it('should display loading spinner initially', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderBugReportPage();

      const loadingSpinner = document.querySelector('[role="progressbar"]');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should load and display bugs from API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();

      await waitFor(() => {
        expect(screen.getByText('로그인 버튼 작동 안 함')).toBeInTheDocument();
        expect(screen.getByText('페이지 로딩 느림')).toBeInTheDocument();
      });
    });

    it('should display empty state when no bugs exist', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      renderBugReportPage();

      await waitFor(() => {
        expect(screen.getByText('등록된 버그가 없습니다. 버그를 발견하면 등록해주세요!')).toBeInTheDocument();
      });
    });

    it('should display error message on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      renderBugReportPage();

      await waitFor(() => {
        expect(screen.getByText('이슈 목록을 불러오는데 실패했습니다.')).toBeInTheDocument();
      });
    });
  });

  describe('버그 등록 다이얼로그', () => {
    it('should open dialog when register button is clicked', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();
      const user = userEvent.setup();

      const registerButton = await screen.findByRole('button', { name: /버그 등록/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getAllByText('버그 등록').length).toBeGreaterThan(1);
      });
    });

    it('should close dialog when cancel button is clicked', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();
      const user = userEvent.setup();

      const registerButton = await screen.findByRole('button', { name: '버그 등록' });
      await user.click(registerButton);

      const cancelButton = await screen.findByRole('button', { name: '취소' });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('버그 제목을 입력하세요')).not.toBeInTheDocument();
      });
    });

    it('should require all fields for bug submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();
      const user = userEvent.setup();

      const registerButton = await screen.findByRole('button', { name: '버그 등록' });
      await user.click(registerButton);

      const submitButton = await screen.findByRole('button', { name: '등록하기' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
      });
    });

    it('should validate title field', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();
      const user = userEvent.setup();

      const registerButton = await screen.findByRole('button', { name: '버그 등록' });
      await user.click(registerButton);

      const descriptionInput = await screen.findByPlaceholderText('버그에 대한 상세 설명을 입력하세요');
      const reporterInput = await screen.findByPlaceholderText('이름을 입력하세요');
      const submitButton = await screen.findByRole('button', { name: '등록하기' });

      await user.type(descriptionInput, '테스트 설명');
      await user.type(reporterInput, '테스터');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
      });
    });

    it('should validate description field', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();
      const user = userEvent.setup();

      const registerButton = await screen.findByRole('button', { name: '버그 등록' });
      await user.click(registerButton);

      const titleInput = await screen.findByPlaceholderText('버그 제목을 입력하세요');
      const reporterInput = await screen.findByPlaceholderText('이름을 입력하세요');
      const submitButton = await screen.findByRole('button', { name: '등록하기' });

      await user.type(titleInput, '테스트 제목');
      await user.type(reporterInput, '테스터');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('설명을 입력해주세요.')).toBeInTheDocument();
      });
    });

    it('should validate reporter field', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();
      const user = userEvent.setup();

      const registerButton = await screen.findByRole('button', { name: '버그 등록' });
      await user.click(registerButton);

      const titleInput = await screen.findByPlaceholderText('버그 제목을 입력하세요');
      const descriptionInput = await screen.findByPlaceholderText('버그에 대한 상세 설명을 입력하세요');
      const submitButton = await screen.findByRole('button', { name: '등록하기' });

      await user.type(titleInput, '테스트 제목');
      await user.type(descriptionInput, '테스트 설명');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('작성자를 입력해주세요.')).toBeInTheDocument();
      });
    });
  });

  describe('버그 등록 제출', () => {
    it('should successfully submit bug with valid data', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockBugsData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { key: 'BUG-3', id: 3 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockBugsData }),
        });

      renderBugReportPage();
      const user = userEvent.setup();

      const registerButton = await screen.findByRole('button', { name: '버그 등록' });
      await user.click(registerButton);

      const titleInput = await screen.findByPlaceholderText('버그 제목을 입력하세요');
      const descriptionInput = await screen.findByPlaceholderText('버그에 대한 상세 설명을 입력하세요');
      const reporterInput = await screen.findByPlaceholderText('이름을 입력하세요');
      const submitButton = await screen.findByRole('button', { name: '등록하기' });

      await user.type(titleInput, '새 버그');
      await user.type(descriptionInput, '새 버그 설명');
      await user.type(reporterInput, '테스터');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/issues'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });
    });

    it('should display error on submission failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockBugsData }),
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      renderBugReportPage();
      const user = userEvent.setup();

      const registerButton = await screen.findByRole('button', { name: '버그 등록' });
      await user.click(registerButton);

      const titleInput = await screen.findByPlaceholderText('버그 제목을 입력하세요');
      const descriptionInput = await screen.findByPlaceholderText('버그에 대한 상세 설명을 입력하세요');
      const reporterInput = await screen.findByPlaceholderText('이름을 입력하세요');
      const submitButton = await screen.findByRole('button', { name: '등록하기' });

      await user.type(titleInput, '새 버그');
      await user.type(descriptionInput, '새 버그 설명');
      await user.type(reporterInput, '테스터');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('이슈 생성에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument();
      });
    });
  });

  describe('버그 목록 상호작용', () => {
    it('should display bug details correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();

      await waitFor(() => {
        const titleElements = screen.queryAllByText('로그인 버튼 작동 안 함');
        expect(titleElements.length).toBeGreaterThan(0);
      });

      expect(screen.getByText('로그인 버튼을 클릭해도 반응이 없음')).toBeInTheDocument();
      expect(screen.getAllByText(/작성자:/).length).toBeGreaterThan(0);
    });

    it('should display correct priority colors and labels', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();

      await waitFor(() => {
        expect(screen.getByText('높음')).toBeInTheDocument();
        expect(screen.getByText('보통')).toBeInTheDocument();
      });
    });

    it('should have refresh button', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();

      const refreshButton = await screen.findByTitle('새로고침');
      expect(refreshButton).toBeInTheDocument();
    });

    it('should refresh bugs when refresh button is clicked', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockBugsData }),
      });

      renderBugReportPage();
      const user = userEvent.setup();

      await screen.findByText('로그인 버튼 작동 안 함');

      const refreshButton = await screen.findByTitle('새로고침');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
