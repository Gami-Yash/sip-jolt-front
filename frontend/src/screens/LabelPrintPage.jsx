import React, { useEffect, useState } from 'react';
import LabelPrintTemplate from '../components/LabelPrintTemplate';

const LabelPrintPage = () => {
  const [labelData, setLabelData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
      try {
        setLabelData(JSON.parse(decodeURIComponent(data)));
      } catch (e) {
        console.error('Failed to parse label data:', e);
      }
    }
  }, []);

  const handleClose = () => {
    window.close();
  };

  if (!labelData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        Loading label...
      </div>
    );
  }

  return <LabelPrintTemplate label={labelData} onClose={handleClose} />;
};

export default LabelPrintPage;
