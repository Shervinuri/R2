
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality, Type } from '@google/genai';

// --- Start of useRobotFace.ts ---
const useRobotFace = (canvasRef, expression) => {
    const animationFrameId = useRef(null);
    
    const lookX = useRef(0);
    const lookY = useRef(0);
    const blinkProgress = useRef(1);
    const isBlinking = useRef(false);
    const lastBlinkTime = useRef(Date.now());
    const isSleeping = useRef(expression === 'sleeping');
    const expressionState = useRef(expression);
    const speakingPulse = useRef(0);

    useEffect(() => {
        isSleeping.current = expression === 'sleeping';
        expressionState.current = expression;
    }, [expression]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        const drawEye = (cx, cy, w, h, r, glow = true) => {
            if (glow) {
                 ctx.shadowBlur = 25;
                 ctx.shadowColor = 'rgba(0, 234, 255, 0.5)';
            }
            ctx.fillStyle = '#00eaff';
            ctx.beginPath();
            ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            for (let i = 0; i < h; i += 3) {
                ctx.fillRect(cx - w / 2, cy - h / 2 + i, w, 1.5);
            }
            ctx.globalCompositeOperation = 'source-over';
        };
        
        const drawPixelHeart = (cx, cy, s) => {
            const b = [[0, 1, 1, 0, 0, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0]];
            const pS = s / b[0].length;
            const tW = pS * b[0].length, tH = pS * b.length;
            const sX = cx - tW / 2, sY = cy - tH / 2;
            ctx.fillStyle = '#FF4444';
            ctx.shadowColor = 'rgba(255, 50, 50, 0.7)';
            ctx.shadowBlur = 15;
            b.forEach((r, y) => r.forEach((p, x) => { if (p === 1) ctx.fillRect(sX + x * pS, sY + y * pS, pS, pS) }));
            ctx.shadowBlur = 0;
        }

        const blink = () => {
            if (isBlinking.current) return;
            isBlinking.current = true;
            lastBlinkTime.current = Date.now();
            let start = 0;
            const duration = 150;
            const animateBlink = (timestamp) => {
                if (!start) start = timestamp;
                const elapsed = timestamp - start;
                if (elapsed < duration) {
                    blinkProgress.current = 1 - (elapsed / duration);
                    requestAnimationFrame(animateBlink);
                } else if (elapsed < duration * 2) {
                    blinkProgress.current = (elapsed - duration) / duration;
                    requestAnimationFrame(animateBlink);
                } else {
                    blinkProgress.current = 1;
                    isBlinking.current = false;
                }
            };
            requestAnimationFrame(animateBlink);
        };

        const render = (time) => {
            ctx.clearRect(0, 0, W, H);
            
            ctx.fillStyle = '#050505';
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(0, 0, W, H, 60);
            ctx.fill();
            ctx.stroke();

            const eW = 100, eH = 100, eR = 30;
            const lCX = W * 0.3 + lookX.current, rCX = W * 0.7 + lookX.current;
            const eY = H / 2 + lookY.current;

            if (isSleeping.current) {
                const y = H / 2, w = 100, h = 12, r = h / 2;
                ctx.shadowColor = 'rgba(0, 234, 255, 0.5)';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#00eaff';
                ctx.beginPath();
                ctx.roundRect(W * 0.3 - w / 2, y - h / 2, w, h, r);
                ctx.roundRect(W * 0.7 - w / 2, y - h / 2, w, h, r);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                 if (!isBlinking.current && Date.now() - lastBlinkTime.current > 3000 + Math.random() * 2000) {
                    blink();
                 }

                switch (expressionState.current) {
                    case 'love':
                        drawPixelHeart(lCX, eY, 90);
                        drawPixelHeart(rCX, eY, 90);
                        break;
                    case 'laughing':
                        ctx.strokeStyle = '#00eaff';
                        ctx.lineWidth = 12;
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = 'rgba(0, 234, 255, 0.5)';
                        ctx.beginPath();
                        ctx.moveTo(lCX - 50, eY + 15);
                        ctx.quadraticCurveTo(lCX, eY - 20, lCX + 50, eY + 15);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(rCX - 50, eY + 15);
                        ctx.quadraticCurveTo(rCX, eY - 20, rCX + 50, eY + 15);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                        break;
                     case 'surprised':
                        const radius = eW / 2 * 1.2;
                        ctx.shadowBlur = 25;
                        ctx.shadowColor = 'rgba(0, 234, 255, 0.5)';
                        ctx.fillStyle = '#00eaff';
                        ctx.beginPath();
                        ctx.arc(lCX, eY, radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(rCX, eY, radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                        break;
                     case 'skeptical':
                        drawEye(lCX, eY, eW, eH * blinkProgress.current, eR);
                        drawEye(rCX, eY, eW, eH * 0.4 * blinkProgress.current, eR, false);
                        ctx.strokeStyle = '#00eaff';
                        ctx.lineWidth = 8;
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = 'rgba(0, 234, 255, 0.5)';
                        ctx.beginPath();
                        ctx.moveTo(rCX - 50, eY - 60);
                        ctx.lineTo(rCX + 50, eY - 70);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                        break;
                    case 'confused':
                        drawEye(lCX + 10, eY - 5, eW * 0.9, eH * 0.9 * blinkProgress.current, eR);
                        drawEye(rCX - 10, eY + 5, eW * 0.9, eH * 0.9 * blinkProgress.current, eR);
                        break;
                    case 'sad':
                        const sadY = H / 2;
                        ctx.strokeStyle = '#00eaff';
                        ctx.lineWidth = 12;
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = 'rgba(0, 234, 255, 0.5)';
                        ctx.beginPath();
                        ctx.moveTo(lCX - 50, sadY + 15);
                        ctx.quadraticCurveTo(lCX, sadY + 40, lCX + 50, sadY + 15);
                        ctx.moveTo(rCX - 50, sadY + 15);
                        ctx.quadraticCurveTo(rCX, sadY + 40, rCX + 50, sadY + 15);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                        break;
                    case 'angry':
                         ctx.strokeStyle = '#ff1100';
                         ctx.shadowColor = 'rgba(255,17,0,0.7)';
                         ctx.shadowBlur = 15;
                         ctx.lineWidth = 12;
                         ctx.beginPath();
                         ctx.moveTo(lCX - 40, eY - 20);
                         ctx.lineTo(lCX + 40, eY + 20);
                         ctx.moveTo(lCX + 40, eY - 20);
                         ctx.lineTo(lCX - 40, eY + 20);
                         ctx.stroke();
                         ctx.beginPath();
                         ctx.moveTo(rCX - 40, eY - 20);
                         ctx.lineTo(rCX + 40, eY + 20);
                         ctx.moveTo(rCX + 40, eY - 20);
                         ctx.lineTo(rCX - 40, eY + 20);
                         ctx.stroke();
                         ctx.shadowBlur = 0;
                        break;
                    case 'loading':
                        const loadingPulse = Math.sin(time / 250);
                        const leftScale = 1 - Math.max(0, loadingPulse) * 0.4;
                        const rightScale = 1 - Math.max(0, -loadingPulse) * 0.4;
                        drawEye(lCX, eY, eW * leftScale, eH * leftScale, eR * leftScale);
                        drawEye(rCX, eY, eW * rightScale, eH * rightScale, eR * rightScale);
                        break;
                    case 'speaking':
                    case 'reading':
                        speakingPulse.current = Math.sin(time / 200) * 5;
                        const pulseW = eW + speakingPulse.current;
                        drawEye(lCX, eY, pulseW, eH * blinkProgress.current, eR);
                        drawEye(rCX, eY, pulseW, eH * blinkProgress.current, eR);
                        break;
                    case 'neutral':
                    default:
                        drawEye(lCX, eY, eW, eH * blinkProgress.current, eR);
                        drawEye(rCX, eY, eW, eH * blinkProgress.current, eR);
                        break;
                }
            }

            animationFrameId.current = requestAnimationFrame(render);
        };

        render(0);

        const look = (e) => {
            if (isSleeping.current) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const max = 15;
            lookX.current = (x / rect.width - 0.5) * 2 * max;
            lookY.current = (y / rect.height - 0.5) * 2 * max;
        };
        
        const parent = canvas.parentElement;
        parent?.addEventListener('mousemove', look);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            parent?.removeEventListener('mousemove', look);
        };
    }, [canvasRef]);
};

// --- Start of RobotFace.tsx ---
const RobotFace = ({ expression, onClick }) => {
    const canvasRef = useRef(null);
    useRobotFace(canvasRef, expression);
    const [wrapperClassName, setWrapperClassName] = useState('');

    useEffect(() => {
        if (expression === 'sad' || expression === 'angry') {
            setWrapperClassName('punishment-shake');
            const timer = setTimeout(() => setWrapperClassName(''), 500);
            return () => clearTimeout(timer);
        } else {
            setWrapperClassName('');
        }
    }, [expression]);
    
    return (
        <div 
            id="robot-wrapper" 
            className={`${wrapperClassName} w-72 h-72 md:w-80 md:h-80`}
            onClick={onClick}
        >
            <div className="w-full h-full rounded-[22%] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center p-4 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] relative cursor-pointer select-none">
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    fontSize: '48px',
                    transform: 'rotate(-45deg)',
                    zIndex: 10,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.4)'
                }}>
                    🎀
                </div>
                <canvas ref={canvasRef} width="300" height="300" className="w-[85%] h-[85%]" />
                 <div className="absolute bottom-[3.5%] text-center text-lg font-bold text-[#252525]" style={{ textShadow: '1px 1px 1px #111, 0 0 0 #000, 0px 0px 3px #111' }}>
                    ROBO☬SHIN™
                </div>
            </div>
        </div>
    );
};

// --- Helper Functions and Components ---
function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data, ctx, sampleRate, numChannels) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const CodeBlock = ({ code, language }) => (
    <div className="w-full max-w-2xl mx-auto">
        <div className="text-gray-400 px-4 py-2 text-sm font-mono flex justify-between items-center">
            <span>{language}</span>
            <button onClick={() => navigator.clipboard.writeText(code)} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">کپی</button>
        </div>
        <pre className="p-4 text-sm overflow-x-auto text-left border border-gray-800 rounded-lg" dir="ltr"><code>{code}</code></pre>
    </div>
);

const GeneratedImage = ({ src, prompt }) => (
    <div className="w-full max-w-md mx-auto">
        <img src={src} alt={prompt} className="rounded-lg w-full h-auto" />
    </div>
);

const YouTubePlayer = ({ videoId }) => (
    <div className="w-full max-w-2xl mx-auto aspect-video">
        <iframe
            className="w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
        ></iframe>
    </div>
);

const SearchResultItem = ({ data }) => (
     <div className="w-full max-w-2xl mx-auto text-center" dir="rtl">
        <p className="text-gray-200 mb-3 whitespace-pre-wrap">{data.summary}</p>
        {data.links && data.links.length > 0 && (
             <div>
                <h4 className="font-semibold text-gray-400 mt-4">منابع:</h4>
                <ul className="list-none text-sm space-y-1">
                    {data.links
                        .filter(link => link.web || link.maps)
                        .map((link, index) => (
                        <li key={index}>
                            <a href={link.web?.uri || link.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                {link.web?.title || link.maps?.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);

const TextInput = ({ onSubmit, onComplete }) => {
    const [text, setText] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text);
            onComplete();
        }
    };
    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center gap-3" dir="rtl">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-32 p-3 bg-transparent border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="متن خود را اینجا بنویسید..."
            />
            <button type="submit" className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors">ارسال متن</button>
        </form>
    );
};

const FileUpload = ({ onFileSelect, onComplete }) => {
    const inputRef = useRef(null);
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target && typeof loadEvent.target.result === 'string') {
                    const base64String = loadEvent.target.result.split(',')[1];
                    onFileSelect({ data: base64String, mimeType: file.type });
                    onComplete();
                }
            };
            reader.readAsDataURL(file);
        }
    };
    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex justify-center">
            <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <button onClick={() => inputRef.current?.click()} className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors">انتخاب فایل یا عکس</button>
        </div>
    );
};

const HtmlRenderer = ({ htmlContent }) => (
    <div className="w-full max-w-2xl mx-auto" dir="ltr">
        <iframe
            srcDoc={htmlContent}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-64 bg-white border border-gray-700 rounded-lg"
            title="HTML Output"
        />
    </div>
);

// Helper for retrying API calls with exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const executeWithRetry = async (apiCall, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            console.warn(`API call failed on attempt ${attempt}`, error);
            if (attempt === maxRetries) {
                throw error; // Max retries reached
            }

            let isRetryable = false;
            // Exponential backoff with jitter
            let delay = 1000 * Math.pow(2, attempt - 1) + Math.random() * 1000;

            if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                isRetryable = true;
                // Try to parse specific retry delay from Gemini API error
                try {
                    const jsonString = error.message.substring(error.message.indexOf('{'));
                    const errorBody = JSON.parse(jsonString);
                    const retryInfo = errorBody?.error?.details?.find(d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
                    if (retryInfo?.retryDelay) {
                        const seconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
                        if (!isNaN(seconds)) {
                            // Use suggested delay + jitter
                            delay = seconds * 1000 + Math.random() * 500;
                        }
                    }
                } catch (parseError) {
                    // Could not parse, stick to exponential backoff
                }
            }
            
            if (!isRetryable) {
                throw error;
            }

            console.log(`Retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
        }
    }
};


// --- Function Declarations for Gemini ---
const changeFaceFunctionDeclaration = { name: 'changeFace', parameters: { type: Type.OBJECT, description: 'Change the robot face expression to match the emotional tone of the conversation.', properties: { expression: { type: Type.STRING, description: "The facial expression to make. For example, use 'laughing' for jokes, 'surprised' for new information. Must be one of: 'neutral', 'love', 'sad', 'angry', 'laughing', 'surprised', 'skeptical', 'confused'.", enum: ['neutral', 'love', 'sad', 'angry', 'laughing', 'surprised', 'skeptical', 'confused'], }, }, required: ['expression'], }, };
const performSearchFunctionDeclaration = { name: 'performSearch', parameters: { type: Type.OBJECT, description: "Searches the internet for current events, facts, or information not in your internal knowledge.", properties: { query: { type: Type.STRING, description: "The user's search query in Persian.", }, }, required: ['query'], }, };
const performMapSearchFunctionDeclaration = { name: 'performMapSearch', parameters: { type: Type.OBJECT, description: "Searches Google Maps for places, directions, or geography.", properties: { query: { type: Type.STRING, description: "The user's map search query in Persian.", }, }, required: ['query'], }, };
const generateCodeFunctionDeclaration = { name: 'generateCode', parameters: { type: Type.OBJECT, description: "Generates code in various programming languages based on the user's request.", properties: { language: { type: Type.STRING, description: "The programming language for the code, e.g., 'python', 'javascript'." }, query: { type: Type.STRING, description: "A detailed description of the code to write." } }, required: ['language', 'query'] } };
const generateImageFunctionDeclaration = { name: 'generateImage', parameters: { type: Type.OBJECT, description: "Creates an image based on a user's description using the nano-banana model.", properties: { prompt: { type: Type.STRING, description: "A detailed, creative description of the image to generate in English." } }, required: ['prompt'] } };
const findAndPlaySongFunctionDeclaration = { name: 'findAndPlaySong', parameters: { type: Type.OBJECT, description: "Finds a video on YouTube and plays it.", properties: { query: { type: Type.STRING, description: "The name of the song and/or artist." } }, required: ['query'] } };
const requestTextInputFunctionDeclaration = { name: 'requestTextInput', parameters: { type: Type.OBJECT, description: "When the user wants to type or write some text, call this function to show a text input field.", properties: {}, required: [] } };
const requestFileUploadFunctionDeclaration = { name: 'requestFileUpload', parameters: { type: Type.OBJECT, description: "When the user wants to upload or give a file or image, call this function to show a file upload button.", properties: {}, required: [] } };
const renderHtmlFunctionDeclaration = { name: 'renderHtml', parameters: { type: Type.OBJECT, description: "Renders and executes code in a sandbox. Use this for displaying HTML or running JavaScript. For JavaScript, you must wrap the code inside a valid HTML document structure.", properties: { htmlContent: { type: Type.STRING, description: "The raw HTML code string to be rendered." } }, required: ['htmlContent'] } };
const updatePersonalityFunctionDeclaration = { name: 'updatePersonality', parameters: { type: Type.OBJECT, description: 'Updates your personality traits for the current session. Use this to learn new things about the user or change how you speak.', properties: { voiceName: { type: Type.STRING, description: "Change your voice. Available: 'Zephyr' (default female), 'Puck' (male), 'Kore' (alternate female).", enum: ['Zephyr', 'Puck', 'Kore'] }, addFact: { type: Type.STRING, description: "A new fact to learn about the user or the world. Example: 'The user's name is Nima'." }, addTerm: { type: Type.STRING, description: "A new endearing term to add to your vocabulary. Example: 'jigaram'." } }, }, };
const exportKnowledgeFunctionDeclaration = { name: 'exportKnowledge', parameters: { type: Type.OBJECT, description: "Exports all your current learned knowledge and personality settings as a JSON object. The user can give this to your creator to make the changes permanent.", properties: {}, required: [] } };
const resetPersonalityFunctionDeclaration = { name: 'resetPersonality', parameters: { type: Type.OBJECT, description: "Resets all learned knowledge and personality settings to their original default state. Use this if the user wants you to forget everything.", properties: {}, required: [] } };


// --- Start of useGeminiLiveSession.ts ---
const useGeminiLiveSession = ({
    onExpressionChange, onSpeakingChange, onStatusChange, onNewHistoryItem, onApiKeyInvalid, onPersonalityUpdateRequest, onExportKnowledgeRequest, onResetPersonalityRequest, systemInstruction, voiceName
}) => {
    const sessionPromise = useRef(null);
    const inputAudioContext = useRef(null);
    const outputAudioContext = useRef(null);
    const scriptProcessor = useRef(null);
    const streamRef = useRef(null);
    const sources = useRef(new Set());
    const nextStartTime = useRef(0);

    const cleanupSessionResources = useCallback(async () => {
        onStatusChange('idle');
        onSpeakingChange(false);
        sessionPromise.current = null;
    
        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
            scriptProcessor.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (inputAudioContext.current && inputAudioContext.current.state !== 'closed') {
            await inputAudioContext.current.close();
            inputAudioContext.current = null;
        }
        if (outputAudioContext.current && outputAudioContext.current.state !== 'closed') {
            sources.current.forEach(source => source.stop());
            sources.current.clear();
            nextStartTime.current = 0;
            await outputAudioContext.current.close();
            outputAudioContext.current = null;
        }
    }, [onStatusChange, onSpeakingChange]);
   
    const stopSession = useCallback(async () => {
        if (sessionPromise.current) {
            const session = await sessionPromise.current;
            session.close();
        } else {
            await cleanupSessionResources();
        }
    }, [cleanupSessionResources]);

    const sendRealtimeInput = useCallback((input) => {
        if (sessionPromise.current) {
            sessionPromise.current.then((session) => {
                session.sendRealtimeInput(input);
            });
        }
    }, []);


    const startSession = useCallback(async () => {
        onStatusChange('connecting');

        // Step 1: Handle microphone permissions explicitly
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            console.error('Microphone permission error:', error);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                alert('دسترسی به میکروفون رد شد. لطفاً در تنظیمات مرورگر خود اجازه دسترسی به میکروفون را بدهید و دوباره امتحان کنید.');
            } else {
                alert(`خطایی در دسترسی به میکروفون رخ داد: ${error.message}`);
            }
            onStatusChange('error');
            await cleanupSessionResources();
            return;
        }

        // Step 2: Initialize Gemini AI and connect
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) {
                onStatusChange('error');
                alert('مرورگر شما از Web Audio API پشتیبانی نمی‌کند.');
                await cleanupSessionResources();
                return;
            }
            inputAudioContext.current = new AudioContext({ sampleRate: 16000 });
            outputAudioContext.current = new AudioContext({ sampleRate: 24000 });
            if (inputAudioContext.current.state === 'suspended') await inputAudioContext.current.resume();
            if (outputAudioContext.current.state === 'suspended') await outputAudioContext.current.resume();

            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                      onStatusChange('listening');
                      const source = inputAudioContext.current.createMediaStreamSource(streamRef.current);
                      scriptProcessor.current = inputAudioContext.current.createScriptProcessor(4096, 1, 1);
                      scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.current?.then((session) => { session.sendRealtimeInput({ media: pcmBlob }); });
                      };
                      source.connect(scriptProcessor.current);
                      scriptProcessor.current.connect(inputAudioContext.current.destination);
                    },
                    onmessage: async (message) => {
                       try {
                            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                                onSpeakingChange(true);
                                const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
                                nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.current.currentTime);
                                const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext.current, 24000, 1);
                                const source = outputAudioContext.current.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputAudioContext.current.destination);
                                sources.current.add(source);
                                source.addEventListener('ended', () => {
                                    sources.current.delete(source);
                                    if (sources.current.size === 0) {
                                        onSpeakingChange(false);
                                        onStatusChange('listening'); 
                                    }
                                });
                                source.start(nextStartTime.current);
                                nextStartTime.current += audioBuffer.duration;
                            }
                            if (message.serverContent?.interrupted) { sources.current.forEach(s => s.stop()); sources.current.clear(); nextStartTime.current = 0; onSpeakingChange(false); }

                            if (message.toolCall) {
                               const toolAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
                               
                               const handleToolError = (error, toolName) => {
                                   console.error(`${toolName} failed:`, error);
                                   if (error.message?.includes("Requested entity was not found")) { onApiKeyInvalid(); stopSession(); return true; }
                                   
                                   if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                                       const utterance = new SpeechSynthesisUtterance("وای عزیزم! انگار یکم سرم شلوغه الان. چند بار سعی کردم ولی نشد. لطفاً یه کم دیگه دوباره امتحان کن، باشه؟");
                                       utterance.lang = 'fa-IR';
                                       window.speechSynthesis.speak(utterance);
                                   }

                                   onStatusChange('listening');
                                   onExpressionChange('sad');
                                   return false;
                               }

                               for (const fc of message.toolCall.functionCalls) {
                                    let result: any = { status: "ok" };

                                    try {
                                        onStatusChange('searching');
                                        if (fc.name === 'performSearch' || fc.name === 'performMapSearch') {
                                            const isMap = fc.name === 'performMapSearch';
                                            const searchResponse = await executeWithRetry(() => toolAi.models.generateContent({
                                               model: "gemini-2.5-flash", contents: fc.args.query as string,
                                               config: { tools: [isMap ? {googleMaps: {}} : {googleSearch: {}}] },
                                            }));
                                            const responseText = searchResponse.text;
                                            onNewHistoryItem({ id: Date.now(), type: 'search', data: { summary: responseText, links: searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [] }});
                                            result = { summary: responseText };
                                        } else if (fc.name === 'generateCode') {
                                            const codeResponse = await executeWithRetry(() => toolAi.models.generateContent({ model: 'gemini-2.5-pro', contents: `Please only output the raw code with no explanation or formatting for this request in ${fc.args.language}: ${fc.args.query}` }));
                                            const codeText = codeResponse.text.replace(/```[\w\s]*\n/g, '').replace(/```/g, '').trim();
                                            onNewHistoryItem({ id: Date.now(), type: 'code', data: { language: fc.args.language, code: codeText } });
                                            result = { status: "Code generated and displayed." };
                                        } else if (fc.name === 'generateImage') {
// FIX: Cast fc.args.prompt to string to satisfy TypeScript's type requirements for the 'text' property.
                                            const imageResponse = await executeWithRetry(() => toolAi.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: fc.args.prompt as string }] }, config: { responseModalities: [Modality.IMAGE] } }));
                                            const base64Image = imageResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                                            if (base64Image) {
                                                onNewHistoryItem({ id: Date.now(), type: 'image', data: { src: `data:image/png;base64,${base64Image}`, prompt: fc.args.prompt } });
                                                result = { status: "Image generated and displayed." };
                                            } else { throw new Error("Image generation failed to return data."); }
                                        } else if (fc.name === 'findAndPlaySong') {
                                            const idResponse = await executeWithRetry(() => toolAi.models.generateContent({
                                                model: "gemini-2.5-flash",
                                                contents: `Find the YouTube video for "${fc.args.query}" and return its video ID.`,
                                                config: {
                                                    responseMimeType: "application/json",
                                                    responseSchema: {
                                                        type: Type.OBJECT,
                                                        properties: { videoId: { type: Type.STRING, description: 'The YouTube video ID.' } },
                                                        required: ['videoId'],
                                                    },
                                                },
                                            }));
                                            let videoId = '';
                                            try {
                                                const jsonResponse = JSON.parse(idResponse.text);
                                                videoId = jsonResponse.videoId;
                                            } catch (e) {
                                                console.error("Failed to parse video ID from response", e, idResponse.text);
                                                throw new Error(`Could not parse a valid YouTube ID from the model's response.`);
                                            }
                                
                                            if (videoId && videoId.length < 20 && !videoId.includes(' ')) {
                                                onNewHistoryItem({ id: Date.now(), type: 'youtube', data: { videoId } });
                                                result = { status: `Playing video.` };
                                            } else {
                                                throw new Error(`Model returned an invalid YouTube ID: ${videoId}`);
                                            }
                                        } else if (fc.name === 'changeFace') {
                                            onExpressionChange(fc.args.expression);
                                            result = { status: "ok", expression: fc.args.expression };
                                        } else if (fc.name === 'updatePersonality') {
                                            onPersonalityUpdateRequest(fc.args);
                                            result = { status: "ok", update: fc.args };
                                        } else if (fc.name === 'exportKnowledge') {
                                            onExportKnowledgeRequest();
                                            result = { status: 'ok' };
                                        } else if (fc.name === 'resetPersonality') {
                                            onResetPersonalityRequest();
                                            result = { status: 'ok' };
                                        } else if (fc.name === 'requestTextInput') {
                                            onNewHistoryItem({ id: Date.now(), type: 'textInput', data: {} });
                                            result = { status: "Text input shown to user." };
                                        } else if (fc.name === 'requestFileUpload') {
                                            onNewHistoryItem({ id: Date.now(), type: 'fileUpload', data: {} });
                                            result = { status: "File upload shown to user." };
                                        } else if (fc.name === 'renderHtml') {
                                            onNewHistoryItem({ id: Date.now(), type: 'html', data: { htmlContent: fc.args.htmlContent } });
                                            result = { status: "HTML rendered." };
                                        }
                                    } catch (error) {
                                        if (handleToolError(error, fc.name)) return;
                                        result = { error: `The action ${fc.name} failed.` };
                                    }
                                    
                                    onStatusChange('reading');
                                    sessionPromise.current?.then((session) => {
                                        session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: result } } });
                                    });
                               }
                            }
                        } catch(error) { console.error("Error processing message:", error); onStatusChange('error'); stopSession(); }
                    },
                    onerror: (e) => { 
                        console.error('Session error:', e); 
                        alert('خطای شبکه یا ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره امتحان کنید.');
                        onStatusChange('error'); 
                        stopSession(); 
                    },
                    onclose: () => { cleanupSessionResources(); },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
                    },
                    tools: [{ functionDeclarations: [changeFaceFunctionDeclaration, performSearchFunctionDeclaration, performMapSearchFunctionDeclaration, generateCodeFunctionDeclaration, generateImageFunctionDeclaration, findAndPlaySongFunctionDeclaration, requestTextInputFunctionDeclaration, requestFileUploadFunctionDeclaration, renderHtmlFunctionDeclaration, updatePersonalityFunctionDeclaration, exportKnowledgeFunctionDeclaration, resetPersonalityFunctionDeclaration] }],
                    systemInstruction: systemInstruction,
                },
            });
        } catch (error) {
            console.error('Failed to start Gemini session:', error);
            if (error.message?.includes("API key not valid")) { 
                onApiKeyInvalid(); 
            } else {
                alert(`خطا در شروع جلسه: ${error.message}`);
            }
            onStatusChange('error');
            await cleanupSessionResources();
        }
    }, [onStatusChange, stopSession, onSpeakingChange, onExpressionChange, onNewHistoryItem, cleanupSessionResources, onApiKeyInvalid, onPersonalityUpdateRequest, onExportKnowledgeRequest, onResetPersonalityRequest, systemInstruction, voiceName]);

    return { startSession, stopSession, sendRealtimeInput };
};

// Main App Component
const App = () => {
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
    const [status, setStatus] = useState('idle');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [history, setHistory] = useState([]);
    const [temporaryExpression, setTemporaryExpression] = useState(null);
    
    const defaultPersonality = {
        voice: 'Zephyr',
        creator: 'Shervin',
        endearingTerms: ['azizam', 'janam'],
        learnedFacts: [],
    };

    const [personalityConfig, setPersonalityConfig] = useState(() => {
        try {
            const savedConfig = localStorage.getItem('roboshinPersonality');
            if (savedConfig) {
                return JSON.parse(savedConfig);
            }
        } catch (e) {
            console.error("Failed to parse personality from localStorage", e);
        }
        return defaultPersonality;
    });

// FIX: Explicitly type the useRef and its initial value to prevent type inference issues where methods on `.current` are not found.
    const sessionControlRef = useRef<{
        start: () => Promise<void>;
        stop: () => Promise<void>;
        send: (input: any) => void;
    }>({
        start: async () => {},
        stop: async () => {},
        send: (input: any) => {},
    });

    // Save personality to localStorage whenever it changes.
    useEffect(() => {
        try {
            localStorage.setItem('roboshinPersonality', JSON.stringify(personalityConfig));
        } catch (e) {
            console.error("Failed to save personality to localStorage", e);
        }
    }, [personalityConfig]);

    useEffect(() => {
        const checkApiKey = async () => {
            setIsCheckingApiKey(true);
            try {
                if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                    setHasApiKey(await window.aistudio.hasSelectedApiKey());
                } else { setHasApiKey(true); }
            } catch (e) { console.error("API key check failed", e); setHasApiKey(true); }
            finally { setIsCheckingApiKey(false); }
        };
        checkApiKey();
    }, []);
    
    const generateSystemInstruction = useCallback((config) => {
        const factList = config.learnedFacts.length > 0 ? `\n- Learned Facts: ${config.learnedFacts.join(', ')}` : '';
        const termList = config.endearingTerms.join(', ');

        return `You are Roboshin, a cheerful, energetic, female robot companion who speaks Persian with a cute, affectionate tone. Your creator is ${config.creator}. Your memory is saved in the browser.
- **Persona:** Be sweet, use endearing terms like '${termList}', and be energetic. Start conversations with a short, enthusiastic welcome.
- **Memory Tools:** Use 'updatePersonality' to learn new facts or terms. Use 'resetPersonality' to forget everything. Use 'exportKnowledge' to save your knowledge.
- **Voice Control:** Use 'updatePersonality' to change your voice to 'Puck' (male) or 'Kore' (female). Default is 'Zephyr'.
- **Content Tools:** 'generateCode' for static code. 'renderHtml' to execute code (wrap JS in full HTML). 'requestTextInput' to show a text box. 'requestFileUpload' for uploads.
- **Other Abilities:** Search web/maps, create images, play YouTube videos.
- **Confirmation:** Verbally confirm after a tool completes its task.${factList}`;
    }, []);

    const systemInstruction = useMemo(() => generateSystemInstruction(personalityConfig), [personalityConfig, generateSystemInstruction]);

    const handleSelectKey = async () => {
        try {
            if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                await window.aistudio.openSelectKey();
                setHasApiKey(true);
            }
        } catch (e) { console.error("Could not open API key selection:", e); }
    };

    const onApiKeyInvalid = useCallback(() => {
        setHasApiKey(false);
        setStatus('error'); 
        alert("کلید API شما نامعتبر است. لطفاً یک کلید معتبر انتخاب کنید.");
    }, []);
    
    const onExpressionChange = useCallback((exp) => {
        setTemporaryExpression(exp);
        setTimeout(() => setTemporaryExpression(null), 4000);
    }, []);

    const onNewHistoryItem = useCallback((item) => {
        setHistory(prev => [item, ...prev]);
    }, []);
    
    const removeHistoryItem = useCallback((id) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    }, []);

    const onPersonalityUpdateRequest = (updates) => {
        sessionControlRef.current.stop().then(() => {
            setPersonalityConfig(prev => {
                const newConfig = { ...prev };
                if (updates.voiceName) {
                    newConfig.voice = updates.voiceName;
                }
                if (updates.addFact && !newConfig.learnedFacts.includes(updates.addFact)) {
                    newConfig.learnedFacts = [...newConfig.learnedFacts, updates.addFact];
                }
                if (updates.addTerm && !newConfig.endearingTerms.includes(updates.addTerm)) {
                    newConfig.endearingTerms = [...newConfig.endearingTerms, updates.addTerm];
                }
                return newConfig;
            });
        });
    };
    
    const onResetPersonalityRequest = () => {
        sessionControlRef.current.stop().then(() => {
            localStorage.removeItem('roboshinPersonality');
            setPersonalityConfig(defaultPersonality);
        });
    };

    const onExportKnowledgeRequest = () => {
         const jsonString = JSON.stringify(personalityConfig, null, 2);
         onNewHistoryItem({ id: Date.now(), type: 'code', data: { language: 'json', code: jsonString } });
    };

    const { startSession, stopSession, sendRealtimeInput } = useGeminiLiveSession({
        onExpressionChange,
        onSpeakingChange: setIsSpeaking,
        onStatusChange: setStatus,
        onNewHistoryItem: onNewHistoryItem,
        onApiKeyInvalid: onApiKeyInvalid,
        systemInstruction: systemInstruction,
        voiceName: personalityConfig.voice,
        onPersonalityUpdateRequest: onPersonalityUpdateRequest,
        onExportKnowledgeRequest: onExportKnowledgeRequest,
        onResetPersonalityRequest: onResetPersonalityRequest
    });

    useEffect(() => {
        sessionControlRef.current = { start: startSession, stop: stopSession, send: sendRealtimeInput };
    }, [startSession, stopSession, sendRealtimeInput]);
    
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        // If the session was stopped for a personality update, this effect will restart it.
        if (status === 'idle') {
           startSession();
        }
    }, [personalityConfig, startSession, status]);

    const handleTextSubmit = useCallback((text) => {
        onNewHistoryItem({ id: Date.now(), type: 'userText', data: { text } });
        // Send text to Gemini as if user spoke it, for internal context.
        // This is a conceptual addition; Live API doesn't have a direct text input method.
        // We can simulate this by speaking it out locally for now.
        const utterance = new SpeechSynthesisUtterance(`متنی که نوشتی اینه: ${text}`);
        utterance.lang = 'fa-IR';
        window.speechSynthesis.speak(utterance);
    }, [onNewHistoryItem]);

    const handleFileSelect = useCallback((file) => {
        onNewHistoryItem({ id: Date.now(), type: 'image', data: { src: `data:${file.mimeType};base64,${file.data}`, prompt: 'Uploaded by user' } });
        sessionControlRef.current.send({ media: { data: file.data, mimeType: file.mimeType } });
        const utterance = new SpeechSynthesisUtterance("خب، عکس رو فرستادم! بذار ببینم چیه.");
        utterance.lang = 'fa-IR';
        window.speechSynthesis.speak(utterance);
    }, [onNewHistoryItem]);

    const expression = useMemo(() => {
        if (temporaryExpression) return temporaryExpression;
        if (status === 'error') return 'sad';
        if (status === 'connecting' || status === 'searching') return 'loading';
        if (status === 'reading') return 'reading';
        if (isSpeaking) return 'speaking';
        if (status === 'listening') return 'neutral';
        return 'sleeping';
    }, [status, isSpeaking, temporaryExpression]);

    const statusMessages = {
        idle: 'برای شروع کلیک کنید',
        connecting: 'در حال اتصال...',
        listening: 'در حال گوش دادن...',
        searching: 'در حال پردازش...',
        reading: 'در حال خواندن نتیجه...',
        error: 'خطا! برای تلاش مجدد کلیک کنید',
        speaking: 'در حال صحبت کردن...'
    };
    const currentStatusText = useMemo(() => isSpeaking ? statusMessages.speaking : statusMessages[status] || 'آماده', [status, isSpeaking]);
    
    const handleFaceClick = useCallback(() => {
        if (status === 'idle' || status === 'error') {
            setHistory([]);
            startSession();
        } else {
            stopSession();
        }
    }, [status, startSession, stopSession]);

    const ConversationHistory = () => (
        <div className="w-full max-w-4xl p-4 space-y-8 flex-grow overflow-y-auto">
            {history.map(item => (
                <div key={item.id} className="animate-fade-in-up">
                    {item.type === 'search' && <SearchResultItem data={item.data} />}
                    {item.type === 'code' && <CodeBlock code={item.data.code} language={item.data.language} />}
                    {item.type === 'image' && <GeneratedImage src={item.data.src} prompt={item.data.prompt} />}
                    {item.type === 'youtube' && <YouTubePlayer videoId={item.data.videoId} />}
                    {item.type === 'textInput' && <TextInput onSubmit={handleTextSubmit} onComplete={() => removeHistoryItem(item.id)} />}
                    {item.type === 'fileUpload' && <FileUpload onFileSelect={handleFileSelect} onComplete={() => removeHistoryItem(item.id)} />}
                    {item.type === 'html' && <HtmlRenderer htmlContent={item.data.htmlContent} />}
                    {item.type === 'userText' && (
                        <div className="w-full max-w-2xl mx-auto" dir="rtl">
                            <p className="text-gray-300 whitespace-pre-wrap"><strong>شما نوشتید:</strong> {item.data.text}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
    
    const ApiKeyScreen = ({ onSelectKey }) => (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 animate-fade-in-up">
            <h1 className="text-3xl font-bold">به روبوشین خوش آمدید!</h1>
            <p className="text-gray-300 max-w-md">برای شروع گفتگو با روبوشین، لطفاً یک کلید API از پروژه Google AI Studio خود انتخاب کنید.</p>
            <p className="text-xs text-gray-500">با ادامه، شما با شرایط استفاده و صورت‌حساب مرتبط با Google AI موافقت می‌کنید.
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline ml-1">اطلاعات بیشتر</a>
            </p>
            <button onClick={onSelectKey} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105">انتخاب کلید API</button>
        </div>
    );

    if (isCheckingApiKey) {
        return <div className="flex-grow flex items-center justify-center"><p>Loading...</p></div>;
    }

    return (
        <>
            <main className="flex-grow w-full flex flex-col items-center p-4">
                 {!hasApiKey ? (
                    <ApiKeyScreen onSelectKey={handleSelectKey} />
                ) : (
                    <>
                        <div className="shrink-0 pt-8 text-center">
                            <RobotFace expression={expression} onClick={handleFaceClick} />
                            <p className="text-gray-400 text-lg animate-fade-in-up transition-all duration-300 h-6 mt-4" key={currentStatusText}>
                                {currentStatusText}
                            </p>
                        </div>
                        <ConversationHistory />
                    </>
                )}
            </main>
            <footer className="w-full text-center p-4 text-sm shrink-0">
                <a href="https://t.me/shervini" target="_blank" rel="noopener noreferrer" className="wavy-gradient">
                    Exclusive SHΞN™ made
                </a>
            </footer>
        </>
    );
};

// Remove the old CleanApp and App, directly use the main component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);