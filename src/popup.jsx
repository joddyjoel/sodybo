'use client';

import React from 'react';
import './popup.css';

const MetaMaskPopup = ({
  isOpen = true,
  onClose,
  title = "Pending",
  message = "Verifying",
  headerText = "MetaMask",
  logoUrl = "./images/metamask.svg",
  closeIconUrl = "./images/black-close-cross.svg",
  width = 343,
  height = 351
}) => {
  if (!isOpen) return null;

  return (
    <div id="popup" style={{ display: 'block', position: 'fixed' }}>
      <div tabIndex={0}>
        <div className="hNHEtw">
          <div 
            id="popup-content" 
            role="dialog" 
            className="dkAhZx" 
            style={{ pointerEvents: 'auto' }}
          >
            <div id="popup-overlay"></div>
            <div className="hBuwwI" style={{ 
              '--height': `${height}px`, 
              '--width': `${width}px` 
            }}>
              
              {/* Center guide line */}
              <div style={{
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'var(--width)',
                zIndex: 9,
                transition: 'width .2s ease 0s'
              }}></div>
              
              {/* Main popup card */}
              <div className="RrATt active">
                
                {/* Close button */}
                <div className="gcowpW">
                  <button 
                    id="popup-close-button"
                    aria-label="Close"
                    className="hFEFWT"
                    onClick={onClose}
                  >
                    <img src={closeIconUrl || "/placeholder.svg"} alt="Close" />
                  </button>
                </div>
                
                {/* Header text */}
                <div className="dLUlU">
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    opacity: 1
                  }}>
                    {headerText}
                  </div>
                </div>
                
                {/* Main content */}
                <div className="gcbNhn">
                  <div className="hVhjow active-scale-up">
                    <div style={{ pointerEvents: 'auto' }} className="dmNTWR">
                      <div style={{
                        zIndex: 2,
                        opacity: 1,
                        transform: 'none'
                      }}>
                        
                        {/* Logo and spinner section */}
                        <div className="jKlSZW">
                          <div className="cBtLfS">
                            <div className="lbAEgN"></div>
                            <div className="hLWHUX">
                              <div className="czUBmg">
                                <div className="epSHCc">
                                  <div className="jhhhSe">
                                    <div style={{
                                      transform: 'scale(.86)',
                                      position: 'relative',
                                      width: '100%'
                                    }}>
                                      <img 
                                        src={logoUrl || "/placeholder.svg"} 
                                        alt={headerText} 
                                      />
                                    </div>
                                  </div>
                                  <div className="eFjHkq">
                                    <div className="dYEcPx" style={{ opacity: 1 }}>
                                      <svg 
                                        aria-hidden="true" 
                                        width="70" 
                                        height="70" 
                                        viewBox="0 0 102 102" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path 
                                          d="M52 100C24.3858 100 2 77.6142 2 50" 
                                          stroke="url(#paint0_linear_1943_4139)" 
                                          strokeWidth="3.5" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                        <defs>
                                          <linearGradient 
                                            id="paint0_linear_1943_4139" 
                                            x1="2" 
                                            y1="48.5" 
                                            x2="53" 
                                            y2="100" 
                                            gradientUnits="userSpaceOnUse"
                                          >
                                            <stop stopColor="var(--ck-spinner-color)" />
                                            <stop offset="1" stopColor="var(--ck-spinner-color)" stopOpacity="0" />
                                          </linearGradient>
                                        </defs>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Text content section */}
                        <div className="liyQQU">
                          <div className="dWkvrK">
                            <div className="emnDjo">
                              <h1 className="fqLYro">{title}</h1>
                              <div className="CcNJP">{message}</div>
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaMaskPopup;
