import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock audioManager
jest.mock('../utils/audioManager', () => ({
  audioManager: {
    playSuccess: jest.fn(),
    playWarning: jest.fn(),
    playAlert: jest.fn(),
    shouldPlayAlert: jest.fn(() => false),
    resetAlert: jest.fn(),
  }
}));

// Mock API
jest.mock('../services/api', () => ({
  getPostureStatus: jest.fn(() =>
    Promise.resolve({
      status: 'Good Posture',
      pcs: 88.5,
      alert: false,
      sedentary_time: 240,
      recommendations: ['Keep chin level with screen.'],
      neck_angle: 8.2,
      shoulder_angle: 2.1,
      spine_angle: 5.4,
      landmarks_detected: true,
      last_updated: '2026-10-05 22:50:00',
    })
  ),
  getLLMAdvice: jest.fn(() =>
    Promise.resolve({
      status: 'success',
      advice: 'Sit tall and roll your shoulders back gently.',
    })
  ),
  startSession: jest.fn(() => Promise.resolve({ status: 'session active' })),
  getAnalytics: jest.fn(() =>
    Promise.resolve({
      total_checks: 120,
      avg_pcs: 85.0,
      good_percentage: 82.5,
      session_duration: 600,
      good_posture_count: 100,
      warning_count: 15,
      bad_posture_count: 5,
    })
  ),
  getDetectionMode: jest.fn(() => Promise.resolve({ mode: 'ml' })),
  setDetectionMode: jest.fn(() => Promise.resolve({ status: 'success', mode: 'rule' })),
  getHistory: jest.fn(() => Promise.resolve({ history: [] })),
}));

// Mock Recharts ResponsiveContainer for jsdom
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div className="recharts-responsive-container" style={{ width: 400, height: 240 }}>
        {children}
      </div>
    ),
  };
});

import Dashboard from './Dashboard';
import PostureGauge from '../components/PostureGauge';
import BiometricSilhouette from '../components/BiometricSilhouette';
import CameraViewport from '../components/CameraViewport';
import AngleTelemetryGauges from '../components/AngleTelemetryGauges';
import BreathingModal from '../components/BreathingModal';
import TelemetryStream from '../components/TelemetryStream';

describe('VertAIx Reactive Feature Suite', () => {
  test('PostureGauge renders correct score, arc, and optimal status badge', () => {
    render(<PostureGauge score={92.4} status="Good Posture" alert={false} />);
    expect(screen.getByText('92.4')).toBeInTheDocument();
    expect(screen.getByText('Live PCS Radar')).toBeInTheDocument();
    expect(screen.getByText('OPTIMAL')).toBeInTheDocument();
  });

  test('PostureGauge dynamically updates to critical badge on low score or alert', () => {
    render(<PostureGauge score={35.0} status="Bad Posture" alert={true} />);
    expect(screen.getByText('35.0')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  test('BiometricSilhouette renders spine vertebrae, cranium, and kinematic callouts', () => {
    render(
      <BiometricSilhouette
        neckAngle={12.5}
        shoulderAngle={3.2}
        spineAngle={7.8}
        status="Good Posture"
        landmarksDetected={true}
      />
    );
    expect(screen.getByText('Live Pose Kinematics')).toBeInTheDocument();
    expect(screen.getByText(/MediaPipe Locked/i)).toBeInTheDocument();
    expect(screen.getByText(/NECK \+12.5°/i)).toBeInTheDocument();
  });

  test('CameraViewport renders HUD overlay and handles state tester buttons', () => {
    const simulateFn = jest.fn();
    render(
      <CameraViewport
        status="Good Posture"
        pcs={85}
        landmarksDetected={true}
        onSimulateState={simulateFn}
      />
    );
    expect(screen.getByText('Real-Time Pose Tracker')).toBeInTheDocument();
    expect(screen.getByText('Enable Camera')).toBeInTheDocument();
    expect(screen.getByText(/OPTICAL EYE LEVEL AXIS/i)).toBeInTheDocument();

    const textNeckBtn = screen.getByText('Text Neck');
    fireEvent.click(textNeckBtn);
    expect(simulateFn).toHaveBeenCalledWith('warning');
  });

  test('AngleTelemetryGauges renders Cervical, Clavicle, and Spine meters with thresholds', () => {
    render(<AngleTelemetryGauges neckAngle={14.2} shoulderAngle={2.5} spineAngle={6.1} />);
    expect(screen.getByText('Cervical Pitch')).toBeInTheDocument();
    expect(screen.getByText('Clavicle Tilt')).toBeInTheDocument();
    expect(screen.getByText('Spine Inclination')).toBeInTheDocument();
    expect(screen.getByText('14.2°')).toBeInTheDocument();
  });

  test('BreathingModal renders 4-4-4-4 box breathing cycle and closes on action', () => {
    const closeFn = jest.fn();
    render(<BreathingModal isOpen={true} onClose={closeFn} />);
    expect(screen.getByText('Ergonomic Micro-Break')).toBeInTheDocument();
    expect(screen.getByText(/4-4-4-4 Box Breathing/i)).toBeInTheDocument();

    const finishBtn = screen.getByText('Finish Break');
    fireEvent.click(finishBtn);
    expect(closeFn).toHaveBeenCalledTimes(1);
  });

  test('TelemetryStream renders live rolling events and PCS badges', () => {
    const sampleEvents = [
      { time: '22:50:01', type: 'good', message: 'Optimal spinal alignment', pcs: 91.0 },
      { time: '22:50:05', type: 'warning', message: 'Moderate forward head tilt', pcs: 68.0 },
    ];
    render(<TelemetryStream events={sampleEvents} />);
    expect(screen.getByText('Live Telemetry Event Log')).toBeInTheDocument();
    expect(screen.getByText('Optimal spinal alignment')).toBeInTheDocument();
    expect(screen.getByText('Moderate forward head tilt')).toBeInTheDocument();
  });

  test('Dashboard main console renders all biometric components and reacts to user actions', async () => {
    render(<Dashboard />);
    
    // Check main title
    expect(screen.getByText('Posture Monitoring Console')).toBeInTheDocument();
    
    // Check HUD and meters render
    await waitFor(() => {
      expect(screen.getByText('Live PCS Radar')).toBeInTheDocument();
      expect(screen.getByText('Live Pose Kinematics')).toBeInTheDocument();
      expect(screen.getByText('Real-Time Pose Tracker')).toBeInTheDocument();
      expect(screen.getByText('Cervical Pitch')).toBeInTheDocument();
    });

    // Check Micro-Break button opens modal
    const microBreakBtn = screen.getByRole('button', { name: /Micro-Break/i });
    fireEvent.click(microBreakBtn);
    expect(screen.getByText('Ergonomic Micro-Break')).toBeInTheDocument();

    // Close modal
    const finishBtn = screen.getByText('Finish Break');
    fireEvent.click(finishBtn);
    expect(screen.queryByText('4-4-4-4 Box Breathing & Postural Decompression')).not.toBeInTheDocument();
  });
});
