import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Type, PenTool, Undo2, Check, Download, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Signature fonts for typed signatures
const SIGNATURE_FONTS = [
  { name: 'Script', font: "'Brush Script MT', cursive" },
  { name: 'Elegant', font: "'Snell Roundhand', cursive" },
  { name: 'Classic', font: "'Lucida Handwriting', cursive" },
  { name: 'Modern', font: "'Segoe Script', cursive" },
];

const SignaturePad = ({ 
  onSignatureChange, 
  initialSignature = null,
  width = 500,
  height = 200,
  penColor = '#000000',
  backgroundColor = '#ffffff',
  showTypeOption = true,
  showClear = true,
  disabled = false
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState('draw'); // draw, type
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [history, setHistory] = useState([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw signature line
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();
    
    // Add "Sign here" text
    ctx.fillStyle = '#999999';
    ctx.font = '12px Arial';
    ctx.fillText('Sign above this line', 20, height - 20);

    // Reset stroke style for drawing
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;

    // Save initial state
    saveToHistory();
  }, [width, height, penColor, backgroundColor]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL('image/png');
    setHistory(prev => [...prev.slice(-10), imageData]); // Keep last 10 states
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (disabled || signatureMode !== 'draw') return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setLastPoint(coords);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing || disabled || signatureMode !== 'draw') return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e?.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);
    saveToHistory();
    
    // Notify parent of signature change
    if (onSignatureChange) {
      const canvas = canvasRef.current;
      onSignatureChange({
        image: canvas.toDataURL('image/png'),
        type: 'draw',
        typedName: null,
        hasSignature: true
      });
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear and redraw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Redraw signature line
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();
    
    ctx.fillStyle = '#999999';
    ctx.font = '12px Arial';
    ctx.fillText('Sign above this line', 20, height - 20);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;

    setHasSignature(false);
    setTypedName('');
    
    if (onSignatureChange) {
      onSignatureChange({
        image: null,
        type: signatureMode,
        typedName: null,
        hasSignature: false
      });
    }
  };

  const undo = () => {
    if (history.length < 2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const previousState = history[history.length - 2];
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = previousState;
    
    setHistory(prev => prev.slice(0, -1));
  };

  const renderTypedSignature = useCallback(() => {
    if (!typedName.trim()) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw signature line
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();
    
    ctx.fillStyle = '#999999';
    ctx.font = '12px Arial';
    ctx.fillText('Sign above this line', 20, height - 20);
    
    // Draw typed signature
    ctx.fillStyle = penColor;
    ctx.font = `48px ${selectedFont.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, width / 2, height / 2 - 20);
    
    setHasSignature(true);
    
    if (onSignatureChange) {
      onSignatureChange({
        image: canvas.toDataURL('image/png'),
        type: 'type',
        typedName: typedName,
        hasSignature: true
      });
    }
  }, [typedName, selectedFont, penColor, backgroundColor, width, height, onSignatureChange]);

  useEffect(() => {
    if (signatureMode === 'type') {
      renderTypedSignature();
    }
  }, [typedName, selectedFont, signatureMode, renderTypedSignature]);

  return (
    <div className="signature-pad-container">
      {showTypeOption && (
        <Tabs value={signatureMode} onValueChange={(v) => {
          setSignatureMode(v);
          clearSignature();
        }} className="mb-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <PenTool className="w-4 h-4" /> Draw Signature
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center gap-2">
              <Type className="w-4 h-4" /> Type Signature
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {signatureMode === 'type' && (
        <div className="mb-3 space-y-3">
          <div>
            <Label>Type your full name</Label>
            <Input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Enter your name exactly as it should appear"
              className="text-lg"
              disabled={disabled}
              data-testid="signature-typed-name"
            />
          </div>
          <div>
            <Label>Select signature style</Label>
            <div className="flex gap-2 flex-wrap">
              {SIGNATURE_FONTS.map((font) => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(font)}
                  disabled={disabled}
                  className={`px-3 py-2 border rounded-lg text-lg transition-colors ${
                    selectedFont.name === font.name
                      ? 'border-[#c41e3a] bg-red-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ fontFamily: font.font }}
                >
                  {typedName || 'Your Name'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`touch-none ${signatureMode === 'draw' && !disabled ? 'cursor-crosshair' : ''}`}
          style={{ width: '100%', height: 'auto' }}
          data-testid="signature-canvas"
        />
        
        {signatureMode === 'draw' && !hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-lg">Draw your signature here</p>
          </div>
        )}
      </div>

      {showClear && (
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
            data-testid="signature-clear-btn"
          >
            <Eraser className="w-4 h-4 mr-1" /> Clear
          </Button>
          {signatureMode === 'draw' && (
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={disabled || history.length < 2}
            >
              <Undo2 className="w-4 h-4 mr-1" /> Undo
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
