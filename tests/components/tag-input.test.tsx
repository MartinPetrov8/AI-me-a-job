import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagInput from '@/components/tag-input';

describe('TagInput', () => {
  it('renders with initial tags', () => {
    const tags = ['JavaScript', 'TypeScript'];
    render(<TagInput value={tags} onChange={vi.fn()} />);

    expect(screen.getByText('JavaScript')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
  });

  it('adding a tag updates the list', () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'Python' } });
    fireEvent.click(button);

    expect(onChange).toHaveBeenCalledWith(['Python']);
  });

  it('removing a tag updates the list', () => {
    const onChange = vi.fn();
    const tags = ['JavaScript', 'TypeScript'];
    render(<TagInput value={tags} onChange={onChange} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('duplicate tag not added', () => {
    const onChange = vi.fn();
    const tags = ['JavaScript'];
    render(<TagInput value={tags} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /add/i });

    // Try to add duplicate (case-insensitive)
    fireEvent.change(input, { target: { value: 'javascript' } });
    fireEvent.click(button);

    // onChange should not be called because it's a duplicate
    expect(onChange).not.toHaveBeenCalled();
  });

  it('max limit enforced', () => {
    const onChange = vi.fn();
    const tags = ['One', 'Two'];
    render(<TagInput value={tags} onChange={onChange} max={2} />);

    // Should show max reached message
    expect(screen.getByText(/maximum 2 reached/i)).toBeTruthy();

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /add/i });

    // Input should be disabled
    expect(input.hasAttribute('disabled')).toBe(true);

    // Try to add another tag
    fireEvent.change(input, { target: { value: 'Three' } });
    fireEvent.click(button);

    // onChange should not be called because max is reached
    expect(onChange).not.toHaveBeenCalled();
  });
});
