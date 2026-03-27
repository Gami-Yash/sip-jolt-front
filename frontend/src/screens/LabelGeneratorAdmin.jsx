import React, { useState, useEffect } from 'react';
import { Download, Printer, Eye, FileText, Image, Settings, Check, RefreshCw } from 'lucide-react';

const PRESETS = [
  {
    name: 'The Waverly (Default)',
    data: {
      siteId: 'SITE-003',
      siteName: 'THE WAVERLY',
      addressLine: '123 MAIN STREET ASS DE 10129',
      attnName: 'CIARA RODRIGUEZ',
      zoneCode: 'C/D',
      boxIndex: '2/3',
      category: 'KITS',
      netWeightLb: '40.0',
      batch: 'B-2026-001',
      date: '1/20/2026',
      phone: '800-555-0199',
      spineText: 'SIPJOLT V98'
    }
  },
  {
    name: 'Grand Hotel - Liquids',
    data: {
      siteId: 'SITE-007',
      siteName: 'GRAND HOTEL NYC',
      addressLine: '455 MADISON AVE NEW YORK NY 10022',
      attnName: 'MARCUS JOHNSON',
      zoneCode: 'A',
      boxIndex: '1/2',
      category: 'LIQUIDS',
      netWeightLb: '38.5',
      batch: 'B-2026-002',
      date: '1/21/2026',
      phone: '800-555-0199',
      spineText: 'SIPJOLT V98'
    }
  },
  {
    name: 'Tech Campus - Dry Goods',
    data: {
      siteId: 'SITE-012',
      siteName: 'SILICON VALLEY CAMPUS',
      addressLine: '1 INFINITE LOOP CUPERTINO CA 95014',
      attnName: 'SARAH CHEN',
      zoneCode: 'B',
      boxIndex: '3/5',
      category: 'DRY GOODS',
      netWeightLb: '42.0',
      batch: 'B-2026-003',
      date: '1/22/2026',
      phone: '800-555-0199',
      spineText: 'SIPJOLT V98'
    }
  }
];

const LabelGeneratorAdmin = ({ onBack }) => {
  const [formData, setFormData] = useState(PRESETS[0].data);
  const [qaMode, setQaMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadPreset = (preset) => {
    setFormData(preset.data);
    setPreviewKey(k => k + 1);
  };

  const refreshPreview = () => {
    setPreviewKey(k => k + 1);
  };

  const downloadLabel = async (format) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/label-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, format, qaMode })
      });
      
      if (!response.ok) throw new Error('Failed to generate label');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.siteId}_box-${formData.boxIndex.replace('/', 'of')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate label: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewUrl = `/api/label-generator/preview?${new URLSearchParams({
    ...formData,
    qaMode: qaMode.toString()
  }).toString()}&_t=${previewKey}`;

  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-white rounded-lg">
                ←
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">SIPJOLT Label Generator</h1>
              <p className="text-sm text-zinc-500">4×6 Print-Ready Labels (300 DPI)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
              <input
                type="checkbox"
                checked={qaMode}
                onChange={(e) => { setQaMode(e.target.checked); refreshPreview(); }}
                className="w-4 h-4"
              />
              <span className="text-sm font-bold">Print QA Mode</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Label Data</h2>
              <button onClick={refreshPreview} className="p-2 hover:bg-zinc-100 rounded-lg">
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase mb-2 text-zinc-500">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-medium"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Site ID</label>
                <input
                  value={formData.siteId}
                  onChange={(e) => handleInputChange('siteId', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Box Index</label>
                <input
                  value={formData.boxIndex}
                  onChange={(e) => handleInputChange('boxIndex', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2"
                  placeholder="2/3"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase mb-1">Site Name</label>
                <input
                  value={formData.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2 uppercase font-bold"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase mb-1">Address</label>
                <input
                  value={formData.addressLine}
                  onChange={(e) => handleInputChange('addressLine', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2 uppercase"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase mb-1">Attention (Recipient)</label>
                <input
                  value={formData.attnName}
                  onChange={(e) => handleInputChange('attnName', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Zone Code</label>
                <input
                  value={formData.zoneCode}
                  onChange={(e) => handleInputChange('zoneCode', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2 text-center font-black text-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2 font-bold"
                >
                  <option value="">None</option>
                  <option value="KITS">KITS</option>
                  <option value="LIQUIDS">LIQUIDS</option>
                  <option value="DRY GOODS">DRY GOODS</option>
                  <option value="CUPS">CUPS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Net Weight (lb)</label>
                <input
                  value={formData.netWeightLb}
                  onChange={(e) => handleInputChange('netWeightLb', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Batch</label>
                <input
                  value={formData.batch}
                  onChange={(e) => handleInputChange('batch', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Date</label>
                <input
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase mb-1">QR Text (leave empty for auto)</label>
                <textarea
                  value={formData.qrText || ''}
                  onChange={(e) => handleInputChange('qrText', e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2 font-mono text-xs"
                  rows={2}
                  placeholder="Leave empty to auto-generate from label data"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => downloadLabel('png')}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 bg-black text-white py-4 rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50"
              >
                <Image size={20} />
                {isGenerating ? 'Generating...' : 'Download PNG (300 DPI)'}
              </button>
              <button
                onClick={() => downloadLabel('pdf')}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                <FileText size={20} />
                {isGenerating ? 'Generating...' : 'Download PDF (4×6)'}
              </button>
            </div>

            <div className="mt-4 text-xs text-zinc-500 text-center">
              PNG: 1200×1800 px @ 300 DPI • PDF: Exactly 4×6 inches
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Live Preview</h2>
              {qaMode && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">
                  QA MODE ON
                </span>
              )}
            </div>
            
            <div className="bg-zinc-100 rounded-xl p-4 flex items-center justify-center">
              <div className="shadow-2xl" style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                <iframe
                  key={previewKey}
                  src={previewUrl}
                  style={{ width: '4in', height: '6in', border: 'none', background: 'white' }}
                  title="Label Preview"
                />
              </div>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              <p className="font-bold mb-1">Print Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Set printer to "Actual Size" (no scaling)</li>
                <li>Use 4×6 thermal label stock</li>
                <li>QR should scan from 1-2 feet away</li>
                <li>Enable QA Mode to verify boundaries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelGeneratorAdmin;
