import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { MapPin, User, Truck, Phone, AlertCircle } from 'lucide-react';

const LabelPrintTemplate = ({ label, onClose }) => {
  const {
    siteId = 'SITE-003',
    siteName = 'THE WAVERLY',
    siteAddress = '123 MAIN STREET ASS DE 10129',
    attn = 'CIARA RODRIGUEZ',
    boxId = 'BOX C/D — KITS',
    boxNum = '4',
    totalBoxes = '3',
    weight = '40.0',
    batchId = 'B-2026-001',
    packDate = '1/20/2026',
    supportPhone = '800-555-0199',
  } = label || {};

  const boxZone = boxId.split(' — ')[0].replace('BOX ', '').replace('CARTON ', '');
  const kitsTag = boxId.includes('KITS');

  const qrPayload = JSON.stringify({
    siteId,
    siteName,
    boxNum,
    totalBoxes,
    batch: batchId,
    ts: packDate
  });

  return (
    <div 
      id="sipjolt-label-print" 
      className="bg-white flex flex-col justify-between overflow-hidden select-none relative" 
      style={{ 
        width: '4in', 
        height: '6in', 
        padding: '0.15in',
        boxSizing: 'border-box',
        border: '6pt solid black',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Black Sidebar */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-black flex items-center justify-center" 
        style={{ width: '0.22in' }}
      >
        <p 
          className="text-white font-black uppercase origin-center -rotate-90 whitespace-nowrap" 
          style={{ fontSize: '8pt', letterSpacing: '0.15em' }}
        >
          SIPJOLT V98
        </p>
      </div>

      <div className="h-full flex flex-col justify-between" style={{ paddingLeft: '0.28in' }}>
        {/* Header Section */}
        <div className="border-b-[2pt] border-black" style={{ paddingBottom: '0.1in' }}>
          <div className="flex justify-between items-start">
            <div 
              className="bg-black text-white font-[900] leading-none tracking-tight" 
              style={{ fontSize: '15pt', padding: '4pt 8pt' }}
            >
              {siteId}
            </div>
            <div className="flex flex-col items-end">
              <div className="flex flex-col items-start">
                <span className="font-[1000] leading-none" style={{ fontSize: '20pt', borderBottom: '3pt solid black', paddingBottom: '2pt' }}>SIPJOLT</span>
              </div>
              <div 
                className="border-[1.2pt] border-black font-black uppercase" 
                style={{ fontSize: '6.5pt', padding: '2pt 4pt', marginTop: '3pt', letterSpacing: '0.05em' }}
              >
                MILK RUN LOGISTICS
              </div>
            </div>
          </div>
          
          <h1 
            className="font-[900] leading-[1] uppercase tracking-tighter" 
            style={{ fontSize: '32pt', marginTop: '0.12in', marginBottom: '0.05in' }}
          >
            {siteName}
          </h1>
          
          <div style={{ paddingLeft: '2pt' }}>
            <p className="font-[800] uppercase flex items-center" style={{ fontSize: '10pt', gap: '4pt', marginBottom: '4pt' }}>
              <MapPin size={12} strokeWidth={3} />
              {siteAddress}
            </p>
            <div className="border-t-[1.5pt] border-black" style={{ marginTop: '2pt', paddingTop: '4pt' }}>
              <p className="font-[800] uppercase flex items-center" style={{ fontSize: '10pt', gap: '4pt' }}>
                <User size={12} strokeWidth={3} />
                ATTN: {attn}
              </p>
            </div>
          </div>
        </div>

        {/* Main Box Section */}
        <div className="flex-grow flex flex-col items-center justify-center relative" style={{ padding: '0.15in 0' }}>
          <div className="flex items-center justify-center w-full" style={{ gap: '0.15in' }}>
            <div className="font-[900] leading-none uppercase" style={{ fontSize: '80pt', letterSpacing: '-0.05em' }}>
              {boxZone}
            </div>
            <div className="bg-black" style={{ width: '3.5pt', height: '1.2in' }}></div>
            <div className="flex flex-col items-start">
              <span className="font-black uppercase" style={{ fontSize: '14pt', marginBottom: '-5pt' }}>BOX</span>
              <span className="font-[900] leading-none" style={{ fontSize: '65pt' }}>
                {boxNum}/{totalBoxes}
              </span>
            </div>
          </div>
          
          {kitsTag && (
            <div 
              className="bg-black text-white font-black uppercase text-center" 
              style={{ fontSize: '12pt', padding: '4pt 20pt', marginTop: '10pt' }}
            >
              KITS
            </div>
          )}
        </div>

        {/* Weight and QR Section */}
        <div className="border-t-[2.5pt] border-black" style={{ paddingTop: '0.08in' }}>
          <div className="flex justify-between items-end">
            <div className="flex-1">
              <div className="font-black uppercase" style={{ fontSize: '8pt', marginBottom: '1pt' }}>NET WEIGHT</div>
              <div className="flex items-baseline gap-1">
                <span className="font-[900]" style={{ fontSize: '38pt', lineHeight: '1' }}>{weight}</span>
                <span className="font-black" style={{ fontSize: '14pt' }}>LB</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-1 border-t-[1.5pt] border-black" style={{ paddingTop: '2pt' }}>
                <div>
                  <div className="font-black uppercase" style={{ fontSize: '6pt', color: '#666' }}>BATCH</div>
                  <div className="font-bold" style={{ fontSize: '8pt' }}>{batchId}</div>
                </div>
                <div>
                  <div className="font-black uppercase" style={{ fontSize: '6pt', color: '#666' }}>DATE</div>
                  <div className="font-bold" style={{ fontSize: '8pt' }}>{packDate}</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center" style={{ width: '1.4in', marginLeft: '0.1in' }}>
              <div className="border-[1.5pt] border-black p-[2pt] bg-white">
                <QRCodeCanvas 
                  value={qrPayload}
                  size={110}
                  level="H"
                />
              </div>
              <div className="font-black uppercase mt-1" style={{ fontSize: '6.5pt', letterSpacing: '0.05em' }}>SCAN TO VERIFY</div>
            </div>
          </div>
        </div>

        {/* Driver Instructions Footer */}
        <div className="bg-black text-white rounded-[4pt] mt-1" style={{ padding: '4pt 6pt' }}>
          <div className="flex justify-between items-center border-b border-white/30 pb-0.5 mb-0.5">
            <div className="flex items-center gap-2 font-black uppercase" style={{ fontSize: '8pt' }}>
              <Truck size={10} fill="white" /> DRIVER
            </div>
            <div className="flex items-center gap-1 font-bold" style={{ fontSize: '8pt' }}>
              <Phone size={8} fill="white" /> {supportPhone}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div className="flex items-center gap-1.5">
              <div className="bg-white text-black rounded-full flex items-center justify-center font-black" style={{ width: '9pt', height: '9pt', fontSize: '6pt' }}>1</div>
              <span className="font-black uppercase" style={{ fontSize: '7pt' }}>CLOSET ONLY</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="bg-white text-black rounded-full flex items-center justify-center font-black" style={{ width: '9pt', height: '9pt', fontSize: '6pt' }}>2</div>
              <span className="font-black uppercase" style={{ fontSize: '7pt' }}>MATCH ZONE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="bg-white text-black rounded-full flex items-center justify-center font-black" style={{ width: '9pt', height: '9pt', fontSize: '6pt' }}>3</div>
              <span className="font-black uppercase" style={{ fontSize: '7pt' }}>PHOTO RACK</span>
            </div>
            <div className="bg-white text-black rounded-full px-1.5 py-0.5 flex items-center gap-1 w-fit">
              <AlertCircle size={8} fill="black" stroke="white" />
              <span className="font-black uppercase" style={{ fontSize: '6.5pt' }}>WET = REFUSE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelPrintTemplate;
