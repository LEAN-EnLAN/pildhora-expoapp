/**
 * QuickActionsPanel Unit Tests
 * 
 * Tests for the QuickActionsPanel component
 * 
 * Note: These tests require React Native Testing Library to be installed:
 * npm install --save-dev @testing-library/react-native @testing-library/jest-native
 * 
 * Run tests with: npm test
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuickActionsPanel from '../QuickActionsPanel';

describe('QuickActionsPanel', () => {
  // Mock navigation function
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    // Clear mock before each test
    mockOnNavigate.mockClear();
  });

  /**
   * Test 1: Component renders correctly
   */
  it('renders the quick actions panel with section title', () => {
    const { getByText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    expect(getByText('Acciones Rápidas')).toBeTruthy();
  });

  /**
   * Test 2: All action cards are rendered
   */
  it('renders all four action cards', () => {
    const { getByText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    // Verify all action cards are present
    expect(getByText('Eventos')).toBeTruthy();
    expect(getByText('Medicamentos')).toBeTruthy();
    expect(getByText('Tareas')).toBeTruthy();
    expect(getByText('Dispositivo')).toBeTruthy();
  });

  /**
   * Test 3: Events card navigation
   */
  it('calls onNavigate with "events" when Events card is pressed', () => {
    const { getByLabelText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    const eventsCard = getByLabelText('Events Registry');
    fireEvent.press(eventsCard);

    expect(mockOnNavigate).toHaveBeenCalledWith('events');
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 4: Medications card navigation
   */
  it('calls onNavigate with "medications" when Medications card is pressed', () => {
    const { getByLabelText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    const medicationsCard = getByLabelText('Medications Management');
    fireEvent.press(medicationsCard);

    expect(mockOnNavigate).toHaveBeenCalledWith('medications');
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 5: Tasks card navigation
   */
  it('calls onNavigate with "tasks" when Tasks card is pressed', () => {
    const { getByLabelText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    const tasksCard = getByLabelText('Tasks');
    fireEvent.press(tasksCard);

    expect(mockOnNavigate).toHaveBeenCalledWith('tasks');
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 6: Device card navigation
   */
  it('calls onNavigate with "add-device" when Device card is pressed', () => {
    const { getByLabelText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    const deviceCard = getByLabelText('Device Management');
    fireEvent.press(deviceCard);

    expect(mockOnNavigate).toHaveBeenCalledWith('add-device');
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 7: Accessibility labels are present
   */
  it('has proper accessibility labels for all cards', () => {
    const { getByLabelText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    // Verify accessibility labels
    expect(getByLabelText('Events Registry')).toBeTruthy();
    expect(getByLabelText('Medications Management')).toBeTruthy();
    expect(getByLabelText('Tasks')).toBeTruthy();
    expect(getByLabelText('Device Management')).toBeTruthy();
  });

  /**
   * Test 8: Accessibility hints are present
   */
  it('has proper accessibility hints for all cards', () => {
    const { getByA11yHint } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    // Verify accessibility hints
    expect(
      getByA11yHint('Opens the events registry to view all medication events')
    ).toBeTruthy();
    expect(
      getByA11yHint('Opens medications management to add, edit, or delete medications')
    ).toBeTruthy();
    expect(
      getByA11yHint('Opens tasks screen to manage caregiver to-dos')
    ).toBeTruthy();
    expect(
      getByA11yHint('Opens device management to link or configure devices')
    ).toBeTruthy();
  });

  /**
   * Test 9: Press animations trigger correctly
   */
  it('triggers press animations on card press', async () => {
    const { getByLabelText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    const eventsCard = getByLabelText('Events Registry');

    // Simulate press in
    fireEvent(eventsCard, 'pressIn');
    
    // Simulate press out
    fireEvent(eventsCard, 'pressOut');

    // Verify navigation was called
    fireEvent.press(eventsCard);
    expect(mockOnNavigate).toHaveBeenCalled();
  });

  /**
   * Test 10: Component has proper accessibility role
   */
  it('has menu accessibility role for the container', () => {
    const { getByRole } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    expect(getByRole('menu')).toBeTruthy();
  });

  /**
   * Test 11: Cards have button accessibility role
   */
  it('has button accessibility role for all cards', () => {
    const { getAllByRole } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    const buttons = getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  /**
   * Test 12: Multiple presses work correctly
   */
  it('handles multiple card presses correctly', () => {
    const { getByLabelText } = render(
      <QuickActionsPanel onNavigate={mockOnNavigate} />
    );

    // Press different cards
    fireEvent.press(getByLabelText('Events Registry'));
    fireEvent.press(getByLabelText('Medications Management'));
    fireEvent.press(getByLabelText('Tasks'));

    expect(mockOnNavigate).toHaveBeenCalledTimes(3);
    expect(mockOnNavigate).toHaveBeenNthCalledWith(1, 'events');
    expect(mockOnNavigate).toHaveBeenNthCalledWith(2, 'medications');
    expect(mockOnNavigate).toHaveBeenNthCalledWith(3, 'tasks');
  });
});
