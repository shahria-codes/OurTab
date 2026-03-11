"use client";

import React from 'react';
import Typography from '@mui/material/Typography';

export default function CloudReceiptProcessor() {
    return (
        <div className="cloud-processing-container">
            <style>{`
        .cloud-processing-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: inherit;
        }

        .animation-scene {
          position: relative;
          width: 200px;
          height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }

        /* --- 1. The AI Cloud --- */
        .cloud-container {
          position: relative;
          z-index: 3;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .cloud-icon {
          width: 90px;
          height: 90px;
          color: #94a3b8; /* Starts gray */
          animation: cloudGlow 3.5s infinite;
        }

        /* The AI Sparkles around the cloud */
        .ai-sparkle {
          position: absolute;
          color: #a855f7;
          opacity: 0;
          animation: sparkleSpin 3.5s infinite;
        }
        .s-top { top: -5px; right: -10px; width: 24px; }
        .s-bottom { bottom: 5px; left: -15px; width: 20px; color: #ec4899; animation-delay: 0.1s; }

        /* --- 2. The Dotted Data Path --- */
        .data-path {
          position: absolute;
          top: 70px;
          bottom: 90px;
          width: 2px;
          border-left: 3px dashed #cbd5e1;
          z-index: 1;
        }

        /* --- 3. The Phone --- */
        .phone {
          position: relative;
          width: 76px;
          height: 120px;
          background: #ffffff;
          border: 4px solid #475569;
          border-radius: 16px;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .phone-notch {
          width: 24px;
          height: 4px;
          background: #475569;
          border-radius: 0 0 4px 4px;
        }

        /* --- 4. The Flying Receipt --- */
        .flying-receipt {
          position: absolute;
          bottom: 120px; /* Starts inside the phone */
          width: 36px;
          height: 48px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 2;
          padding: 6px 4px;
          box-sizing: border-box;
          opacity: 0;
          animation: flyToCloud 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Tiny lines inside the flying receipt */
        .mini-line {
          height: 3px;
          background: #e2e8f0;
          border-radius: 2px;
          margin-bottom: 4px;
        }

        /* --- Animations --- */

        /* Receipt flies up and gets absorbed */
        @keyframes flyToCloud {
          0% { transform: translateY(40px) scale(0.5); opacity: 0; }
          10% { transform: translateY(-10px) scale(1); opacity: 1; } /* Pops out of phone */
          20% { transform: translateY(-10px) scale(1); opacity: 1; } /* Pauses briefly */
          40% { transform: translateY(-150px) scale(0.6); opacity: 1; } /* Reaches cloud */
          45% { transform: translateY(-150px) scale(0); opacity: 0; } /* Sucked in */
          100% { transform: translateY(-150px) scale(0); opacity: 0; }
        }

        /* Cloud turns purple and pulses when receipt enters */
        @keyframes cloudGlow {
          0%, 35% { color: #94a3b8; filter: drop-shadow(0 0 0 transparent); transform: scale(1); }
          40% { color: #a855f7; transform: scale(1.05); }
          50%, 75% { color: #ec4899; filter: drop-shadow(0 0 16px rgba(236, 72, 153, 0.5)); transform: scale(1.08); }
          85%, 100% { color: #94a3b8; filter: drop-shadow(0 0 0 transparent); transform: scale(1); }
        }

        /* Sparkles spin and pop out during processing */
        @keyframes sparkleSpin {
          0%, 35% { opacity: 0; transform: scale(0) rotate(0deg); }
          45% { opacity: 1; transform: scale(1.2) rotate(45deg); }
          60%, 70% { opacity: 1; transform: scale(1) rotate(90deg); filter: drop-shadow(0 0 8px currentColor); }
          80%, 100% { opacity: 0; transform: scale(0) rotate(180deg); }
        }

        /* Loading text fades smoothly */
        .loading-text {
          margin-top: 1rem;
          font-weight: bold;
          color: #6C63FF;
          animation: fade 1.5s infinite alternate ease-in-out;
        }

        @keyframes fade {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

            <div className="animation-scene">
                {/* The Cloud & AI Elements at the top */}
                <div className="cloud-container">
                    <svg className="ai-sparkle s-top" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
                    </svg>
                    <svg className="ai-sparkle s-bottom" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
                    </svg>
                    {/* Solid Cloud SVG */}
                    <svg className="cloud-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.5 18C4.01472 18 2 15.9853 2 13.5C2 11.2426 3.66442 9.3728 5.83454 9.04519C6.54922 6.36794 8.99596 4.5 11.8333 4.5C15.3333 4.5 18.2575 7.14333 18.6366 10.5441C20.5284 10.9578 22 12.6557 22 14.6667C22 17.0599 20.0599 19 17.6667 19H6.5Z" />
                    </svg>
                </div>

                {/* The Dotted Track in the middle */}
                <div className="data-path"></div>

                {/* The Animated Receipt */}
                <div className="flying-receipt">
                    <div className="mini-line" style={{ width: '60%' }}></div>
                    <div className="mini-line" style={{ width: '100%' }}></div>
                    <div className="mini-line" style={{ width: '80%' }}></div>
                    <div className="mini-line" style={{ width: '100%', marginTop: '8px' }}></div>
                </div>

                {/* The Phone at the bottom */}
                <div className="phone">
                    <div className="phone-notch"></div>
                </div>
            </div>
            <Typography className="loading-text" variant="h6" sx={{ mt: 3, fontWeight: 'bold', color: 'primary.main' }}>
                AI is processing your receipt...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Please wait while we extract items and prices
            </Typography>

        </div>
    );
}