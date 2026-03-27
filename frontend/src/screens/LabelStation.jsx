import React, { useState, useEffect, useRef } from 'react';
import { Printer, AlertTriangle, Package, FileText, ArrowLeft, Trash2, Download, ListPlus, X, Eye, CheckCircle2, Smartphone, Share2 } from 'lucide-react';

const LabelStation = ({ onBack }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [siteId, setSiteId] = useState('SITE-001');
  const [siteName, setSiteName] = useState('');
  const [attn, setAttn] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [weight, setWeight] = useState('40.0');
  const [boxId, setBoxId] = useState('BOX A — LIQUIDS (SYRUP)');
  const [batchId, setBatchId] = useState('B-2026-001');
  const [packDate, setPackDate] = useState(new Date().toLocaleDateString());
  const [boxNum, setBoxNum] = useState('1');
  const [totalBoxes, setTotalBoxes] = useState('1');
  const [supportPhone, setSupportPhone] = useState('800-555-0199');
  
  const [isGenerated, setIsGenerated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [labelQueue, setLabelQueue] = useState([]);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites');
      if (res.ok) {
        const data = await res.json();
        setSites(data.sites || []);
      }
    } catch (err) {
      console.warn('Could not fetch sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSelect = (e) => {
    const site = sites.find(s => (s.site_id || s.siteId) === e.target.value);
    if (site) {
      setSiteId(site.site_id || site.siteId || 'SITE-001');
      setSiteName(site.venue_name || site.venueName || '');
      setSiteAddress(site.address || '');
      setAttn(site.primary_contact || site.primaryContact || '');
      setIsGenerated(false);
    }
  };

  const isOverweight = parseFloat(weight) > 46.5;
  const isHeavy = parseFloat(weight) > 40;

  const buildPreviewUrl = () => {
    const boxZone = boxId.split(' — ')[0].replace('BOX ', '').replace('CARTON ', '');
    const category = boxId.includes(' — ') ? boxId.split(' — ')[1] : '';
    
    const params = new URLSearchParams({
      siteId: siteId,
      siteName: siteName,
      addressLine: siteAddress,
      attnName: attn,
      zoneCode: boxZone,
      boxIndex: `${boxNum}/${totalBoxes}`,
      category: category,
      netWeightLb: weight,
      batch: batchId,
      date: packDate,
      phone: supportPhone,
      spineText: 'SIPJOLT V98'
    });

    return `/api/label-generator/preview?${params.toString()}`;
  };

  const handleGenerate = () => {
    if (isOverweight || !siteName) return;
    
    const url = buildPreviewUrl();
    setPreviewUrl(url);
    setIsGenerated(true);
  };

  const handlePreview = () => {
    if (!isGenerated) return;
    setIsPreviewLoading(true);
    setShowPreview(true);
  };

  const handleSendToApp = async () => {
    await handleDownloadPng();
  };

  const handleDownloadPng = async () => {
    if (!previewUrl && !isGenerated) return;
    
    const boxZone = boxId.split(' — ')[0].replace('BOX ', '').replace('CARTON ', '');
    const category = boxId.includes(' — ') ? boxId.split(' — ')[1] : '';
    
    try {
      const response = await fetch('/api/label-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          siteName,
          addressLine: siteAddress,
          attnName: attn,
          zoneCode: boxZone,
          boxIndex: `${boxNum}/${totalBoxes}`,
          category,
          netWeightLb: weight,
          batch: batchId,
          date: packDate,
          phone: supportPhone,
          spineText: 'SIPJOLT V1.00',
          format: 'png'
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SIPJOLT_${siteId}_${boxZone}_${boxNum}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const addToQueue = () => {
    if (!siteName || isOverweight || !isGenerated) return;
    
    const newLabel = {
      id: Date.now(),
      siteId,
      siteName,
      attn,
      siteAddress,
      weight,
      boxId,
      batchId,
      packDate,
      boxNum,
      totalBoxes,
      supportPhone,
      previewUrl: buildPreviewUrl()
    };
    
    setLabelQueue([...labelQueue, newLabel]);
    setBoxNum(String(parseInt(boxNum) + 1));
    setIsGenerated(false);
  };

  const removeFromQueue = (id) => {
    setLabelQueue(labelQueue.filter(l => l.id !== id));
  };

  const clearQueue = () => {
    setLabelQueue([]);
  };

  const resetForm = () => {
    setIsGenerated(false);
    setPreviewUrl('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center p-4 pb-24 font-inter">
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-zinc-100 transition-all active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-black tracking-tighter">LABEL STATION</h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">v1.01 PNG Engine (1200×1800)</p>
        </div>
      </div>

      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-lg">Label Preview</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">4x6 Thermal Label @ 300 DPI</p>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-grow overflow-auto p-8 flex justify-center bg-gray-100">
              <div className="relative bg-white shadow-xl" style={{ width: '384px', height: '576px' }}>
                {isPreviewLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  </div>
                )}
                <iframe 
                  src={previewUrl}
                  className={`w-full h-full border-none transition-opacity duration-300 ${isPreviewLoading ? 'opacity-0' : 'opacity-100'}`}
                  title="Label Preview"
                  onLoad={() => setIsPreviewLoading(false)}
                />
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex gap-4">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-4 px-6 border-2 border-gray-200 rounded-2xl font-bold hover:bg-white transition-all active:scale-95"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPng}
                className="flex-1 py-4 px-6 border-2 border-blue-500 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download PNG (1200×1800)
              </button>
              <button
                onClick={handleSendToApp}
                className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Smartphone size={20} />
                Shipping Printer Pro
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 space-y-6">
        {sites.length > 0 && (
          <div className="mb-4">
            <label className="block text-[10px] font-bold uppercase mb-2">Quick Site Select</label>
            <select
              onChange={handleSiteSelect}
              className="w-full border-2 border-zinc-200 p-3 rounded-lg bg-white text-sm"
            >
              <option value="">-- Select a site --</option>
              {sites.map((site, i) => (
                <option key={i} value={site.site_id || site.siteId}>
                  {site.venue_name || site.venueName} ({site.site_id || site.siteId})
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b pb-1">Destination</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Site ID</label>
                <input value={siteId} onChange={e => {setSiteId(e.target.value); resetForm();}} className="w-full border-2 border-zinc-200 p-2 rounded-lg font-mono uppercase focus:border-black outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-center">Box Count</label>
                <div className="flex items-center gap-1 font-bold">
                  <input value={boxNum} onChange={e => {setBoxNum(e.target.value); resetForm();}} className="w-full border-2 border-zinc-200 p-2 rounded-lg text-center" />
                  <span>/</span>
                  <input value={totalBoxes} onChange={e => {setTotalBoxes(e.target.value); resetForm();}} className="w-full border-2 border-zinc-200 p-2 rounded-lg text-center" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Venue Name</label>
              <input value={siteName} onChange={e => {setSiteName(e.target.value); resetForm();}} className="w-full border-2 border-zinc-200 p-2 rounded-lg uppercase font-bold focus:border-black outline-none" placeholder="Enter venue name" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">ATTN: Recipient</label>
              <input value={attn} onChange={e => {setAttn(e.target.value); resetForm();}} className="w-full border-2 border-zinc-200 p-2 rounded-lg uppercase font-bold focus:border-black outline-none" placeholder="Contact name" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Address</label>
              <textarea value={siteAddress} onChange={e => {setSiteAddress(e.target.value); resetForm();}} className="w-full border-2 border-zinc-200 p-2 rounded-lg uppercase text-sm h-14 resize-none leading-tight focus:border-black outline-none" placeholder="Full delivery address" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b pb-1">Shipment QC</h3>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Box Identifier (Zone)</label>
              <select value={boxId} onChange={e => {setBoxId(e.target.value); resetForm();}} className="w-full border-2 border-zinc-200 p-2 rounded-lg font-black bg-white text-xs">
                <option value="BOX A — LIQUIDS (SYRUP)">BOX A — LIQUIDS (SYRUP) [RED/Shelf 1]</option>
                <option value="BOX B1 — OAT + CLEANING KIT">BOX B1 — OAT + CLEANING KIT [GREEN/Shelf 2+3]</option>
                <option value="BOX B2 — DAIRY + COCOA">BOX B2 — DAIRY + COCOA [GREEN/Shelf 2]</option>
                <option value="BOX C — COFFEE + SUGAR + CHAI">BOX C — COFFEE + SUGAR + CHAI [YELLOW/Shelf 4]</option>
                <option value="CARTON E — CUPS + LIDS">CARTON E — CUPS + LIDS [BLUE/Floor]</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Weight (LB)</label>
                <input type="number" step="0.1" value={weight} onChange={e => {setWeight(e.target.value); resetForm();}} className={`w-full border-2 p-2 rounded-lg font-bold ${isOverweight ? 'border-red-500 bg-red-50 text-red-600' : 'border-zinc-200'}`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Batch ID</label>
                <input value={batchId} onChange={e => {setBatchId(e.target.value); resetForm();}} className="w-full border-2 border-zinc-200 p-2 rounded-lg font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Driver Hotline</label>
              <input value={supportPhone} onChange={e => setSupportPhone(e.target.value)} className="w-full border-2 border-zinc-200 p-2 rounded-lg font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Packed On</label>
              <input value={packDate} onChange={e => setPackDate(e.target.value)} className="w-full border-2 border-zinc-200 p-2 rounded-lg font-mono text-xs" />
            </div>
          </div>
        </div>

        {isOverweight && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-4">
            <AlertTriangle className="flex-shrink-0 text-red-600" size={24} />
            <div className="text-sm font-bold uppercase tracking-tight">Weight Violation (A-47): Remove contents to enable print.</div>
          </div>
        )}

        {isGenerated && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-4">
            <CheckCircle2 className="flex-shrink-0 text-green-600" size={24} />
            <div className="text-sm font-bold uppercase tracking-tight">Label Generated! Click Preview to view, then Print or Download.</div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-xs font-bold uppercase">
          PNG Format (1200×1800px @ 300 DPI) — Open in Shipping Printer Pro app to print 4×6 labels
        </div>
        
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold uppercase">
          Put label in clear packing list envelope. Stick on SIDE. Do not cover carrier label.
        </div>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={handleGenerate}
              disabled={isOverweight || !siteName}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isGenerated 
                  ? 'border-4 border-green-500 text-green-600 bg-green-50' 
                  : 'border-4 border-black text-black hover:bg-zinc-100'
              } disabled:opacity-20`}
            >
              {isGenerated ? <CheckCircle2 size={20} /> : <FileText size={20} />}
              {isGenerated ? 'GENERATED' : '1. GENERATE'}
            </button>
            <button 
              onClick={handlePreview}
              disabled={!isGenerated}
              className="w-full border-4 border-blue-500 text-blue-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-50 disabled:opacity-20 transition-all active:scale-[0.98]"
            >
              <Eye size={20} /> 2. PREVIEW
            </button>
            <button 
              onClick={handleDownloadPng}
              disabled={!isGenerated}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-20 transition-all active:scale-[0.98]"
            >
              <Download size={20} /> 3. PNG
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={addToQueue}
              disabled={isOverweight || !siteName || !isGenerated}
              className="w-full border-2 border-zinc-300 text-zinc-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-100 disabled:opacity-20 transition-all active:scale-[0.98]"
            >
              <ListPlus size={18} /> Add to Batch
            </button>
            <button 
              onClick={handleDownloadPng}
              disabled={!isGenerated}
              className="w-full border-2 border-zinc-300 text-zinc-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-100 disabled:opacity-20 transition-all active:scale-[0.98]"
            >
              <Download size={18} /> Download PNG
            </button>
          </div>

          {labelQueue.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-blue-900 uppercase text-sm flex items-center gap-2">
                  <Package size={16} /> Label Queue ({labelQueue.length})
                </h4>
                <button onClick={clearQueue} className="text-xs font-bold text-red-600 hover:text-red-800 uppercase flex items-center gap-1">
                  <Trash2 size={12} /> Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {labelQueue.map((label, idx) => (
                  <div key={label.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-blue-100">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">{idx + 1}</span>
                      <div className="text-xs">
                        <span className="font-bold">{label.boxId.split(' — ')[0]}</span>
                        <span className="text-zinc-500 ml-2">{label.boxNum}/{label.totalBoxes}</span>
                        <span className="text-zinc-400 ml-2">{label.weight}lb</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => window.open(label.previewUrl, '_blank')} 
                        className="p-1 hover:bg-blue-50 rounded text-blue-500"
                        title="Print this label"
                      >
                        <Printer size={14} />
                      </button>
                      <button onClick={() => removeFromQueue(label.id)} className="p-1 hover:bg-red-50 rounded text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelStation;
