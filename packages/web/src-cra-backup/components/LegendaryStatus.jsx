import React, { useState, useEffect } from 'react';

const LegendaryStatus = () => {
  const [envInfo, setEnvInfo] = useState({});

  useEffect(() => {
    // Simulate gathering environment info
    setEnvInfo({
      nodeVersion: 'Powered by fnm + pnpm',
      platform: navigator.platform,
      timestamp: new Date().toISOString(),
      status: 'LEGENDARY 🔥'
    });
  }, []);

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '10px',
      fontFamily: 'monospace'
    }}>
      <h1>🚀 Legendary Dev Environment Test</h1>
      <div style={{ marginTop: '1rem' }}>
        <p>📦 Package Manager: pnpm (superior choice)</p>
        <p>🟢 Node Manager: fnm (lightning fast)</p>
        <p>🐚 Shell: Enhanced Zsh with modular detection</p>
        <p>🔐 GPG: Ready for signed commits</p>
        <p>🌿 Git: Automated GitHub PAT workflow</p>
        <p>⚡ CLI Tools: eza, bat, fzf, and more</p>
        <p>🎯 Status: {envInfo.status}</p>
        <p>⏰ Built: {envInfo.timestamp}</p>
      </div>
    </div>
  );
};

export default LegendaryStatus;
