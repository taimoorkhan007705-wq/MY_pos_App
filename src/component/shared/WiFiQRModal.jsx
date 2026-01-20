import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const WiFiQRModal = ({ isOpen, onClose, wifiSSID, wifiPassword, userPanelUrl }) => {
  if (!isOpen) return null;

  // WiFi QR Code format for auto-connect
  // Format: WIFI:T:WPA;S:<SSID>;P:<PASSWORD>;;
  const wifiQRData = `WIFI:T:WPA;S:${wifiSSID};P:${wifiPassword};;`;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: 700, 
          marginBottom: '0.5rem',
          color: '#1f2937'
        }}>
          📱 Connect to WiFi
        </h2>
        
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}>
          Scan this QR code with your mobile camera to auto-connect
        </p>

        {/* WiFi QR Code */}
        <div style={{
          background: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '16px',
          marginBottom: '1.5rem',
          display: 'inline-block'
        }}>
          <QRCodeSVG 
            value={wifiQRData}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* WiFi Details */}
        <div style={{
          background: '#eff6ff',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#1e40af', fontSize: '0.875rem' }}>WiFi Name:</strong>
            <div style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600,
              color: '#1f2937',
              marginTop: '0.25rem'
            }}>
              {wifiSSID}
            </div>
          </div>
          <div>
            <strong style={{ color: '#1e40af', fontSize: '0.875rem' }}>Password:</strong>
            <div style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600,
              color: '#1f2937',
              marginTop: '0.25rem',
              fontFamily: 'monospace'
            }}>
              {wifiPassword}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, #d1d5db, transparent)',
          margin: '1.5rem 0'
        }}></div>

        {/* User Panel URL QR Code */}
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 700, 
          marginBottom: '0.5rem',
          color: '#1f2937'
        }}>
          🌐 Open User Panel
        </h3>
        
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          After connecting, scan this to open the app
        </p>

        <div style={{
          background: '#f0fdf4',
          padding: '1.5rem',
          borderRadius: '16px',
          marginBottom: '1.5rem',
          display: 'inline-block'
        }}>
          <QRCodeSVG 
            value={userPanelUrl}
            size={180}
            level="M"
            includeMargin={true}
          />
        </div>

        <div style={{
          background: '#dcfce7',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <strong style={{ color: '#166534', fontSize: '0.8rem' }}>URL:</strong>
          <div style={{ 
            color: '#15803d',
            fontSize: '0.9rem',
            wordBreak: 'break-all',
            marginTop: '0.25rem',
            fontFamily: 'monospace'
          }}>
            {userPanelUrl}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#fef3c7',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            📋 How to use:
          </div>
          <ol style={{ 
            margin: 0, 
            paddingLeft: '1.25rem',
            color: '#78350f',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            <li>Open camera app on your mobile</li>
            <li>Scan the <strong>top QR code</strong> to connect to WiFi</li>
            <li>Wait for WiFi connection</li>
            <li>Scan the <strong>bottom QR code</strong> to open the app</li>
          </ol>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
};

export default WiFiQRModal;
