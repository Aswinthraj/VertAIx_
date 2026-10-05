import React, { useRef, useEffect } from 'react';
import { Activity, Radio, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import './TelemetryStream.css';

const TelemetryStream = ({ events = [] }) => {
  const feedEndRef = useRef(null);

  useEffect(() => {
    if (feedEndRef.current && typeof feedEndRef.current.scrollIntoView === 'function') {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'good':
        return <CheckCircle2 size={13} className="event-icon good" />;
      case 'warning':
        return <AlertTriangle size={13} className="event-icon warn" />;
      case 'bad':
        return <AlertOctagon size={13} className="event-icon bad" />;
      default:
        return <Activity size={13} className="event-icon info" />;
    }
  };

  return (
    <div className="telemetry-stream-card">
      <div className="stream-header">
        <div className="stream-title-group">
          <Radio size={14} className="live-pulse-dot" />
          <h4 className="stream-heading">Live Telemetry Event Log</h4>
        </div>
        <span className="stream-counter-tag">{events.length} Events</span>
      </div>

      <div className="stream-events-scroll">
        {events.length === 0 ? (
          <div className="stream-empty-state">
            <Activity size={18} className="spin-icon" />
            <span>Streaming posture packets from MediaPipe worker...</span>
          </div>
        ) : (
          events.map((evt, idx) => (
            <div key={idx} className={`stream-event-row ${evt.type}`}>
              <span className="event-time">{evt.time}</span>
              <div className="event-icon-box">{getEventIcon(evt.type)}</div>
              <span className="event-message">{evt.message}</span>
              {evt.pcs !== undefined && (
                <span className="event-pcs-tag">{Number(evt.pcs).toFixed(0)}%</span>
              )}
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};

export default TelemetryStream;
