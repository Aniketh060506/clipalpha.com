import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Code, Image as ImageIcon, CheckSquare, Type, Lock, Eye, Download, UploadCloud, Eraser, PenTool, Palette, X } from "lucide-react";

import { hideDataInImage, extractDataFromImage, getStegoCapacityBytes } from "../../utils/steganography";
import { encryptText, decryptText } from "../../utils/crypto";

// Types
export type TabType = 'text' | 'code' | 'drawing' | 'tasks' | 'stego' | 'files';

// 1. Code Editor
export function CodeEditor({ content, setContent }: { content: string, setContent: (val: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="flex-1 flex flex-col relative">
      <div className="absolute top-4 right-6 text-xs font-mono font-bold text-muted-foreground/50 pointer-events-none">
        {content.length > 0 && <span>{content.length.toLocaleString()} chars</span>}
      </div>
      <textarea
        ref={textareaRef}
        autoFocus
        wrap="off"
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            setContent(content.substring(0, start) + "  " + content.substring(end));
            setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0);
          }
        }}
        placeholder="function() {\n  return 'hello world';\n}"
        className="flex-1 w-full p-6 bg-[#0f172a] text-emerald-400 font-mono text-[14px] leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50 rounded-b-xl custom-scrollbar"
      />
    </div>
  );
}

// 2. Drawing Canvas
export function DrawingEditor({ 
  initialDataUrl,
  onDrawingChange 
}: { 
  initialDataUrl?: string,
  onDrawingChange: (dataUrl: string) => void 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  const [color, setColor] = useState<string>('default');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);

  const colors = [
    { value: 'default', bgClass: 'bg-foreground' },
    { value: '#ef4444', bgClass: 'bg-red-500' },
    { value: '#3b82f6', bgClass: 'bg-blue-500' },
    { value: '#10b981', bgClass: 'bg-emerald-500' },
    { value: '#f59e0b', bgClass: 'bg-amber-500' },
    { value: '#8b5cf6', bgClass: 'bg-purple-500' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Resize canvas to match container exactly without CSS stretching
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const context = canvas.getContext("2d");
    if (context) {
      context.lineCap = "round";
      context.lineJoin = "round";
      setCtx(context);

      if (initialDataUrl) {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0);
        };
        img.src = initialDataUrl;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    if (!ctx) return;
    const { x, y } = getPos(e);
    
    ctx.lineWidth = brushSize;
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color === 'default' 
        ? (document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a') 
        : color;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Draw a single dot if user just clicks without dragging
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
    e.preventDefault(); // Prevent scrolling on touch
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      ctx?.closePath();
      if (canvasRef.current) {
        onDrawingChange(canvasRef.current.toDataURL("image/png"));
      }
    }
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onDrawingChange("");
  };

  return (
    <div className={`flex-1 flex flex-col relative w-full h-full bg-muted/50 rounded-b-xl overflow-hidden ${isEraser ? 'cursor-cell' : 'cursor-crosshair'}`}>
      <button onClick={clearCanvas} className="absolute top-4 right-6 p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl transition-colors z-10" title="Clear Sketch">
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-6 z-10 flex items-start justify-start">
        <AnimatePresence mode="wait">
          {isToolbarOpen ? (
            <motion.div 
              key="toolbar"
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              className="flex items-center gap-2 sm:gap-4 p-2 sm:px-4 bg-background/90 backdrop-blur-xl border border-border/60 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.2)]"
            >
              {/* Pen/Eraser Toggle */}
              <div className="flex gap-1 bg-muted/60 p-1 rounded-xl">
                <button 
                  onClick={() => setIsEraser(false)} 
                  className={`p-2 rounded-lg transition-all ${!isEraser ? 'bg-background shadow-sm text-indigo-500' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                  title="Pen"
                >
                  <PenTool className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsEraser(true)} 
                  className={`p-2 rounded-lg transition-all ${isEraser ? 'bg-background shadow-sm text-indigo-500' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-border/60" />

              {/* Colors */}
              <div className="flex gap-1.5 items-center">
                {colors.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { setColor(c.value); setIsEraser(false); }}
                    className={`w-6 h-6 rounded-full transition-transform outline-none ${c.bgClass} ${color === c.value && !isEraser ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'opacity-80 hover:opacity-100 hover:scale-110'}`}
                    title={c.value === 'default' ? 'Theme Default' : c.value}
                  />
                ))}
              </div>

              <div className="w-px h-6 bg-border/60 hidden sm:block" />

              {/* Brush Size */}
              <div className="items-center gap-2 hidden sm:flex px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground opacity-30" />
                <input 
                  type="range" 
                  min="1" max="20" 
                  value={brushSize} 
                  onChange={e => setBrushSize(parseInt(e.target.value))}
                  className="w-24 accent-primary"
                />
                <div className="w-3 h-3 rounded-full bg-foreground opacity-60" />
              </div>

              <button onClick={() => setIsToolbarOpen(false)} className="ml-1 p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors" title="Close Toolbar">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button 
              key="palette-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsToolbarOpen(true)}
              className="p-3 bg-background/90 backdrop-blur-md border border-border/60 rounded-2xl shadow-lg text-foreground hover:text-indigo-500 hover:border-indigo-500/50 transition-all flex items-center justify-center group"
              title="Drawing Tools"
            >
              <Palette className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <canvas
        ref={canvasRef}
        className="block flex-1 w-full h-full touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}

// 3. Tasks/Checklist
export type TaskItem = { id: string, text: string, done: boolean };

export function TasksEditor({ tasks, setTasks }: { tasks: TaskItem[], setTasks: (tasks: TaskItem[]) => void }) {
  const [val, setVal] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    setTasks([...tasks, { id: Math.random().toString(36).substring(7), text: val.trim(), done: false }]);
    setVal("");
  };

  const toggle = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const remove = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      <form onSubmit={add} className="flex gap-2 shrink-0">
        <input 
          autoFocus
          value={val} 
          onChange={e => setVal(e.target.value)} 
          placeholder="Type a new task and press Enter..." 
          className="flex-1 bg-muted/40 border-2 border-border/60 hover:border-border rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-body text-foreground"
        />
        <button type="submit" disabled={!val.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
          <Plus className="w-5 h-5"/>
        </button>
      </form>

      <div className="flex-1 flex flex-col gap-2">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 bg-background border border-border/80 shadow-sm rounded-xl group hover:shadow-md transition-all">
            <button 
              onClick={() => toggle(t.id)} 
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${t.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-border/80 text-transparent hover:border-indigo-400'}`}
            >
              <CheckSquare className={`w-4 h-4 ${t.done ? 'opacity-100' : 'opacity-0'}`} />
            </button>
            <span className={`flex-1 text-sm font-body font-semibold truncate transition-all ${t.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {t.text}
            </span>
            <button onClick={() => remove(t.id)} className="p-2 opacity-0 group-hover:opacity-100 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg transition-all shrink-0">
              <Trash2 className="w-4 h-4"/>
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 gap-2 border-2 border-dashed border-border/60 rounded-xl">
            <CheckSquare className="w-8 h-8 opacity-50" />
            <p className="text-sm font-bold font-body">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. Steganography Editor (Fully isolated utility)
export function StegoEditor() {
  const [mode, setMode] = useState<'hide'|'extract'>('hide');
  const [secretType, setSecretType] = useState<'text'|'image'>('text');
  
  const resultRef = useRef<HTMLDivElement>(null);
  const extractRef = useRef<HTMLDivElement>(null);
  
  // Hide State
  const [coverImage, setCoverImage] = useState("");
  const [secretText, setSecretText] = useState("");
  const [password, setPassword] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract State
  const [stegoImage, setStegoImage] = useState("");
  const [extPassword, setExtPassword] = useState("");
  const [extractedSecret, setExtractedSecret] = useState("");

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const p = URL.createObjectURL(e.target.files[0]);
      setCoverImage(p);
      const img = new Image();
      img.onload = () => setCapacity(getStegoCapacityBytes(img.width, img.height));
      img.src = p;
    }
  };

  const handleGenerate = async () => {
    if (!coverImage || !secretText || !password) return;
    setIsProcessing(true);
    try {
      // Yield to event loop so React can render 'isProcessing' state
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log("Stego: Encrypting payload...");
      const encrypted = await encryptText(secretText, password);
      console.log("Stego: Payload encrypted, hiding in image...");
      const stego = await hideDataInImage(coverImage, encrypted);
      console.log("Stego: Successfully generated stego image.");
      setResultImage(stego);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (err: any) {
      console.error(err);
      alert("Error generating Image: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtract = async () => {
    if (!stegoImage || !extPassword) return;
    try {
      const encrypted = await extractDataFromImage(stegoImage);
      if (!encrypted) throw new Error("No hidden data found or image is corrupted.");
      const dec = await decryptText(encrypted, extPassword);
      setExtractedSecret(dec);
      setTimeout(() => extractRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (err: any) {
      alert("Decryption failed. Wrong password or no data.");
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar relative">
      <div className="flex gap-2 p-1 bg-muted rounded-xl self-start">
        <button onClick={() => setMode('hide')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === 'hide' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Hide Secret</button>
        <button onClick={() => setMode('extract')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === 'extract' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Extract Secret</button>
      </div>

      {mode === 'hide' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
               <label className="text-xs font-bold font-body uppercase text-muted-foreground tracking-wider">1. Cover Image</label>
               {coverImage ? (
                 <div className="relative rounded-2xl border-2 border-border overflow-hidden bg-black/5 aspect-video flex-shrink-0">
                   <img src={coverImage} className="w-full h-full object-cover" />
                   <button onClick={() => { setCoverImage(""); setResultImage(""); }} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg"><Trash2 className="w-4 h-4"/></button>
                 </div>
               ) : (
                 <label className="border-2 border-dashed border-border/80 rounded-2xl aspect-video flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 hover:border-indigo-400 transition-colors">
                   <UploadCloud className="w-8 h-8 mb-2" />
                   <span className="text-sm font-bold">Upload Cover</span>
                   <span className="text-xs opacity-60">Should be a large photo</span>
                   <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                 </label>
               )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
               <div className="flex items-center justify-between mb-1">
                 <label className="text-xs font-bold font-body uppercase text-muted-foreground tracking-wider">
                   2. Secret {secretType}
                 </label>
                 <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/50">
                   <button 
                     onClick={() => { setSecretType('text'); if(secretText.startsWith('data:image/')) setSecretText(''); }} 
                     className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${secretType === 'text' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                   >Text</button>
                   <button 
                     onClick={() => { setSecretType('image'); setSecretText(''); }} 
                     className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${secretType === 'image' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                   >Image</button>
                 </div>
               </div>
               
               <div className="text-right -mt-2 mb-1">
                 {capacity > 0 && <span className={`text-[10px] font-bold uppercase tracking-wider ${secretText.length > capacity/2 ? 'text-amber-500' : 'text-muted-foreground/60'}`}>{secretText.length > 500 ? (secretText.length/1024).toFixed(0) + " KB" : secretText.length} / {Math.floor(capacity/2/1024)} KB limit</span>}
               </div>
               
               {secretType === 'image' ? (
                 secretText.startsWith('data:image/') ? (
                   <div className="flex-1 rounded-2xl border-2 border-indigo-500 overflow-hidden relative group min-h-[150px] bg-black/5">
                     <img src={secretText} className="w-full h-full object-contain backdrop-blur-sm p-2" />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/60 transition-colors">
                       <button onClick={() => setSecretText('')} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center gap-2">
                         <Trash2 className="w-4 h-4"/> Clear Secret Image
                       </button>
                     </div>
                   </div>
                 ) : (
                   <label className="flex-1 border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 hover:border-indigo-400 transition-colors bg-muted/10 min-h-[150px]">
                     <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                     <span className="text-sm font-bold text-foreground">Upload Image to Hide</span>
                     <span className="text-xs opacity-60">Auto-compressed to fit capacity</span>
                     <input type="file" accept="image/*" className="hidden" onChange={e => {
                       if (e.target.files && e.target.files[0]) {
                         const r = new FileReader();
                         r.onload = () => {
                           const img = new Image();
                           img.onload = () => {
                              let width = img.width; let height = img.height;
                              const MAX_DIMENSION = 800;
                              if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                                  if (width > height) { height = Math.round(height * (MAX_DIMENSION / width)); width = MAX_DIMENSION; }
                                  else { width = Math.round(width * (MAX_DIMENSION / height)); height = MAX_DIMENSION; }
                              }
                              const canvas = document.createElement('canvas');
                              canvas.width = width; canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                ctx.drawImage(img, 0, 0, width, height);
                                setSecretText(canvas.toDataURL("image/jpeg", 0.6));
                              }
                           };
                           img.src = r.result as string;
                         };
                         r.readAsDataURL(e.target.files[0]);
                       }
                     }} />
                   </label>
                 )
               ) : (
                 <textarea 
                   value={secretText} 
                   onChange={e => setSecretText(e.target.value)} 
                   placeholder="Type secret message..." 
                   className="flex-1 bg-muted/30 border-2 border-border/60 hover:border-border rounded-2xl p-4 text-sm font-code focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                 />
               )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center bg-muted/40 border-2 border-border/60 rounded-xl px-4 py-1.5 focus-within:border-indigo-500 transition-colors">
               <Lock className="w-4 h-4 text-muted-foreground mr-2" />
               <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Encryption Password" className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold py-2" />
            </div>
            <button onClick={handleGenerate} disabled={!coverImage || !secretText || !password || isProcessing} className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2">
              {isProcessing ? "Adding Secret..." : "Generate & Hide"}
            </button>
          </div>

          {resultImage && (
            <div ref={resultRef} className="mt-4 p-4 border-2 border-emerald-500/30 bg-emerald-500/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                 <h4 className="font-bold text-emerald-600 text-sm flex items-center gap-1"><CheckSquare className="w-4 h-4"/> Success! Hidden securely.</h4>
                 <p className="text-xs text-muted-foreground mt-1">Download this PNG and send it as a document (do not let WhatsApp compress it!).</p>
               </div>
               <a href={resultImage} download="stego-secret.png" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 whitespace-nowrap">
                 <Download className="w-4 h-4"/> Download Image
               </a>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {stegoImage ? (
             <div className="relative rounded-2xl border-2 border-indigo-500 overflow-hidden bg-black/5 aspect-video w-full max-w-lg mx-auto flex-shrink-0 group">
               <img src={stegoImage} className="w-full h-full object-contain" />
               <button onClick={() => { setStegoImage(""); setExtractedSecret(""); }} className="absolute top-2 right-2 p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-sm font-bold">
                 <Trash2 className="w-4 h-4"/> Remove Image
               </button>
             </div>
          ) : (
             <label className="border-2 border-dashed border-border/80 rounded-2xl p-10 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 hover:border-indigo-400 transition-colors w-full max-w-lg mx-auto">
                <ImageIcon className="w-10 h-10 mb-3 text-indigo-400/50" />
                <span className="text-base font-bold text-foreground">Upload Stego Image</span>
                <span className="text-xs opacity-60">Requires original uncompressed PNG file</span>
                <input type="file" accept="image/png" className="hidden" onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setStegoImage(URL.createObjectURL(e.target.files[0]));
                    setExtractedSecret("");
                  }
                }} />
             </label>
          )}
          
          {stegoImage && (
            <div className="flex flex-col items-center gap-4 max-w-lg mx-auto w-full mt-2">
               <div className="flex w-full items-center bg-muted/40 border-2 border-border/60 rounded-xl px-4 py-1.5 focus-within:border-indigo-500 transition-colors">
                 <Lock className="w-4 h-4 text-muted-foreground mr-2" />
                 <input type="password" value={extPassword} onChange={e => setExtPassword(e.target.value)} placeholder="Decryption Password" className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold py-2" />
               </div>
               <button onClick={handleExtract} disabled={!stegoImage || !extPassword} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors">
                 Decrypt & Extract
               </button>
            </div>
          )}

          {extractedSecret && (
            <div ref={extractRef} className="mt-4 p-5 border border-border/50 bg-background shadow-lg rounded-3xl animate-in fade-in slide-in-from-bottom-4">
              <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-2">Decrypted Secret Found:</h4>
              {extractedSecret.startsWith('data:image/') ? (
                 <img src={extractedSecret} className="max-w-full rounded-xl" />
              ) : (
                 <pre className="font-mono text-sm whitespace-pre-wrap break-all bg-[#0a0a0a] text-emerald-400 p-4 rounded-xl custom-scrollbar max-h-[40vh] overflow-y-auto">
                   {extractedSecret}
                 </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
