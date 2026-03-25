import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders sidebar with CTF Tools title', () => {
  render(<App />);
  expect(screen.getByText('CTF Tools')).toBeInTheDocument();
});

test('renders Base Converter by default', () => {
  render(<App />);
  expect(
    screen.getByText('Base Converter', { selector: '.fui-CardHeader__header *' }),
  ).toBeInTheDocument();
});

test('can navigate to a different tool via sidebar', async () => {
  render(<App />);
  const caesarNav = screen.getByText('Caesar / ROT-N');
  await userEvent.click(caesarNav);
  // Just verify navigation happened - there should be at least 2 "Caesar" texts (nav + heading)
  const matches = screen.getAllByText(/Caesar/);
  expect(matches.length).toBeGreaterThanOrEqual(2);
});
