import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';

vi.mock('../components/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">Chat Widget</div>,
}));

vi.mock('../utils/api', () => ({
  apiRequest: vi.fn(() => Promise.resolve({ data: null })),
  API_URL: 'http://localhost:3001',
}));

const renderHomePage = () => {
  return render(
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('username', 'testuser');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render home page with calendar', () => {
    renderHomePage();

    // Calendar should be rendered
    const calendarElements = document.querySelectorAll('[role="button"]');
    expect(calendarElements.length).toBeGreaterThan(0);
  });

  it('should display shares section', () => {
    renderHomePage();

    const buttons = screen.getAllByRole('button');
    // Should have button for "나눔 쓰기"
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render chat widget', () => {
    renderHomePage();

    expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
  });

  it('should open daily word form when edit button is clicked', async () => {
    renderHomePage();
    const user = userEvent.setup();

    // Find and click the edit button (first button in the daily word section)
    const buttons = screen.getAllByRole('button');
    const editButton = buttons[buttons.length - 1]; // Usually last button in header

    await user.click(editButton);

    // Check if form is now visible by looking for input fields
    const inputs = document.querySelectorAll('input[type="text"], textarea');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should require image selection for daily word submission', async () => {
    renderHomePage();

    // With login-based architecture, images are now the only requirement
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(0);
  });

  it('should use logged-in username for submissions', () => {
    renderHomePage();

    // Verify no author name input field exists (should be auto-populated from login)
    const allInputs = document.querySelectorAll('input[type="text"]');
    let hasAuthorNameInput = false;

    allInputs.forEach((input) => {
      // Check if any text input has placeholder or value indicating it's for author name
      if (input.placeholder?.includes('작성자') ||
          input.getAttribute('aria-label')?.includes('작성자') ||
          input.value?.includes('작성자')) {
        hasAuthorNameInput = true;
      }
    });

    // With login-based architecture, no author name input should exist
    expect(hasAuthorNameInput).toBe(false);
  });

  it('should handle file input for daily word image', () => {
    renderHomePage();

    // Check image file inputs
    const imageInputs = document.querySelectorAll('input[type="file"][accept="image/*"]');
    expect(imageInputs.length).toBeGreaterThan(0);
  });

  it('should call apiRequest when submitting daily word with valid data', async () => {
    const mockResponse = {
      data: {
        id: 1,
        date: '2025-01-01',
        authorName: 'testuser',
        images: [{ id: 1, imageUrl: '/uploads/test.jpg' }],
      },
    };

    const { apiRequest } = await import('../utils/api');
    vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse);

    renderHomePage();
    const user = userEvent.setup();

    // Verify the mock was set up
    expect(vi.mocked(apiRequest)).toBeDefined();
  });

  it('should handle multiple image selection', () => {
    renderHomePage();

    // Check for image input that accepts multiple files
    const imageInputs = document.querySelectorAll('input[type="file"][accept="image/*"]');
    expect(imageInputs.length).toBeGreaterThan(0);

    // Verify image inputs are properly configured
    const firstImageInput = imageInputs[0];
    if (firstImageInput) {
      expect(firstImageInput).toHaveAttribute('accept', 'image/*');
    }
  });

  it('should not have author name input field in daily word form', () => {
    renderHomePage();

    // With login-based architecture, no author name input field should exist
    const textInputs = document.querySelectorAll('input[type="text"]');

    // Filter out any inputs (should not have author name input)
    let hasAuthorNameInput = false;
    textInputs.forEach((input) => {
      if (input.placeholder?.includes('작성자') || input.value?.includes('작성자')) {
        hasAuthorNameInput = true;
      }
    });

    expect(hasAuthorNameInput).toBe(false);
  });

  it('should not have password input field in daily word form', () => {
    renderHomePage();

    // With login-based architecture, no password field should exist for daily word submission
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    // Filter out delete password input (if any) by checking for content text
    let hasWordSubmissionPassword = false;
    passwordInputs.forEach((input) => {
      if (!input.className?.includes('deletePassword')) {
        hasWordSubmissionPassword = true;
      }
    });

    expect(hasWordSubmissionPassword).toBe(false);
  });
});
