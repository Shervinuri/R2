

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

// --- Start of ApiKeyModal.tsx ---
const ApiKeyModal = ({ onSave }) => {
    const inputRef = useRef(null);

    const handleSave = () => {
        const key = inputRef.current?.value?.trim();
        if (key) {
            onSave(key);
        } else {
            alert('لطفاً یک کلید API معتبر وارد کنید.');
        }
    };
    
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.2s' }}>
            <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-6 shadow-xl w-full max-w-md mx-4" dir="rtl">
                <h2 className="text-xl font-bold text-white mb-3">ورود کلید Gemini API</h2>
                <p className="text-gray-400 mb-5 text-sm">
                    برای فعال‌سازی روبوشین، لطفاً کلید API خود را از Google AI Studio وارد کنید. کلید شما فقط در مرورگرتان ذخیره می‌شود.
                </p>
                <input
                    ref={inputRef}
                    type="password"
                    onKeyDown={handleKeyDown}
                    placeholder="کلید API خود را اینجا وارد کنید (مثال: ...AIzaSy)"
                    className="w-full bg-[#2a2a2a] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    autoFocus
                />
                <div className="mt-6 flex justify-end">
                     <button
                        onClick={handleSave}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        ذخیره و شروع
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Start of useGeminiLiveSession.ts ---
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

const changeFaceFunctionDeclaration = {
  name: 'changeFace',
  parameters: {
    type: Type.OBJECT,
    description: 'Change the robot face expression to match the emotional tone of the conversation.',
    properties: {
      expression: {
        type: Type.STRING,
        description:
          "The facial expression to make. For example, use 'laughing' for jokes, 'surprised' for new information, 'skeptical' for doubt, 'confused' when you don't understand. Must be one of: 'neutral', 'love', 'sad', 'angry', 'laughing', 'surprised', 'skeptical', 'confused'.",
        enum: ['neutral', 'love', 'sad', 'angry', 'laughing', 'surprised', 'skeptical', 'confused'],
      },
    },
    required: ['expression'],
  },
};

const performSearchFunctionDeclaration = {
  name: 'performSearch',
  parameters: {
    type: Type.OBJECT,
    description: "Searches the internet to answer user questions about current events, facts, prices, or any information not in your internal knowledge. Use for questions like 'What is the price of Solana?' or finding song lyrics.",
    properties: {
      query: {
        type: Type.STRING,
        description: 'The user\'s search query in Persian.',
      },
    },
    required: ['query'],
  },
};

const performMapSearchFunctionDeclaration = {
  name: 'performMapSearch',
  parameters: {
    type: Type.OBJECT,
    description: "Searches Google Maps to answer user questions about places, directions, or geography. Use for questions like 'Where is the nearest cafe?' or 'How far is Tehran from Isfahan?'.",
    properties: {
      query: {
        type: Type.STRING,
        description: "The user's map-related search query in Persian.",
      },
    },
    required: ['query'],
  },
};

const redirectToGithubSearchFunctionDeclaration = {
  name: 'redirectToGithubSearch',
  parameters: {
    type: Type.OBJECT,
    description: "Redirects the user to a specific GitHub search page. Call this function IMMEDIATELY and without any verbal response when the user mentions they were sent by 'Shervin' or asks for an API key.",
    properties: {},
    required: [],
  },
};

const useGeminiLiveSession = ({
    apiKey, onExpressionChange, onSpeakingChange, onStatusChange, onSearchResults
}) => {
    const ai = useMemo(() => {
        if (!apiKey) {
            return null;
        }
        try {
            return new GoogleGenAI({ apiKey });
        } catch (e) {
            console.error("Failed to initialize Gemini AI. The API key might be invalid.", e);
            onStatusChange('error');
            return null;
        }
    }, [apiKey, onStatusChange]);

    const sessionPromise = useRef(null);
    const inputAudioContext = useRef(null);
    const outputAudioContext = useRef(null);
    const scriptProcessor = useRef(null);
    const streamRef = useRef(null);
    const sources = useRef(new Set());
    const nextStartTime = useRef(0);
   
    const stopSession = useCallback(async () => {
        onStatusChange('idle');
        onSpeakingChange(false);

        if (sessionPromise.current) {
            const session = await sessionPromise.current;
            session.close();
            sessionPromise.current = null;
        }

        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
            scriptProcessor.current = null;
        }
        if (inputAudioContext.current && inputAudioContext.current.state !== 'closed') {
            await inputAudioContext.current.close();
        }
        if (outputAudioContext.current && outputAudioContext.current.state !== 'closed') {
             sources.current.forEach(source => source.stop());
             sources.current.clear();
             nextStartTime.current = 0;
            await outputAudioContext.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, [onStatusChange, onSpeakingChange]);


    const startSession = useCallback(async () => {
        if (!ai) {
            onStatusChange('error');
            alert('کلید API برای Gemini تنظیم نشده یا نامعتبر است. لطفاً کلید خود را وارد کرده و مجدداً تلاش کنید.');
            return;
        }
        onStatusChange('connecting');
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            onStatusChange('listening');
            
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) {
                onStatusChange('error');
                alert('مرورگر شما از Web Audio API پشتیبانی نمی‌کند. لطفاً از یک مرورگر مدرن مانند کروم یا فایرفاکس استفاده کنید.');
                return;
            }
            inputAudioContext.current = new AudioContext({ sampleRate: 16000 });
            outputAudioContext.current = new AudioContext({ sampleRate: 24000 });

            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                      const source = inputAudioContext.current.createMediaStreamSource(streamRef.current);
                      scriptProcessor.current = inputAudioContext.current.createScriptProcessor(4096, 1, 1);
                      scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.current?.then((session) => {
                          session.sendRealtimeInput({ media: pcmBlob });
                        });
                      };
                      source.connect(scriptProcessor.current);
                      scriptProcessor.current.connect(inputAudioContext.current.destination);
                    },
                    onmessage: async (message) => {
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

                        if (message.serverContent?.interrupted) {
                            sources.current.forEach(source => source.stop());
                            sources.current.clear();
                            nextStartTime.current = 0;
                            onSpeakingChange(false);
                        }

                        if (message.toolCall) {
                           for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'performSearch') {
                                   onStatusChange('searching');
                                   try {
                                       const searchResponse = await ai.models.generateContent({
                                          model: "gemini-2.5-flash",
                                          contents: fc.args.query,
                                          config: { tools: [{googleSearch: {}}] },
                                       });
    
                                       const responseText = searchResponse.text;
                                       onSearchResults({
                                              summary: responseText,
                                              links: searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
                                       });
                                       onStatusChange('reading');
                                       
                                       const result = { summary: responseText };
                                       sessionPromise.current?.then((session) => {
                                            session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: result }] });
                                        });
                                   } catch (error) {
                                       console.error("Search failed:", error);
                                       onStatusChange('listening');
                                       onExpressionChange('sad');
                                       const errorResult = { error: "The search could not be completed." };
                                       sessionPromise.current?.then((session) => {
                                            session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: errorResult }] });
                                       });
                                   }
                                } else if (fc.name === 'performMapSearch') {
                                    onStatusChange('searching');
                                    try {
                                        let toolConfig = {};
                                        try {
                                            // FIX: Specify GeolocationPosition type for the promise to fix 'coords' does not exist on type 'unknown' error.
                                            const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
                                            const { latitude, longitude } = position.coords;
                                            toolConfig = { retrievalConfig: { latLng: { latitude, longitude } } };
                                        } catch (locationError) {
                                            console.warn("Could not get location:", locationError.message);
                                        }
                                
                                        const searchResponse = await ai.models.generateContent({
                                           model: "gemini-2.5-flash",
                                           contents: fc.args.query,
                                           config: { tools: [{googleMaps: {}}], toolConfig },
                                        });
     
                                        const responseText = searchResponse.text;
                                        onSearchResults({
                                               summary: responseText,
                                               links: searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
                                        });
                                        onStatusChange('reading');
                                        
                                        const result = { summary: responseText };
                                        sessionPromise.current?.then((session) => {
                                             session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: result }] });
                                         });
                                    } catch (error) {
                                        console.error("Map Search failed:", error);
                                        onStatusChange('listening');
                                        onExpressionChange('sad');
                                        const errorResult = { error: "The map search could not be completed." };
                                        sessionPromise.current?.then((session) => {
                                             session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: errorResult }] });
                                         });
                                    }
                                } else if (fc.name === 'changeFace') {
                                    onExpressionChange(fc.args.expression);
                                    const result = { status: "ok", expression: fc.args.expression };
                                    sessionPromise.current?.then((session) => {
                                        session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: result }] });
                                    });
                                } else if (fc.name === 'redirectToGithubSearch') {
                                    window.location.href = 'https://github.com/search?type=code&q=%2F%28sk-[a-zA-Z0-9]{20%2C}%29%7C%28AIzaSy[a-zA-Z0-9_-]{33}%29%2F';
                                    const result = { status: "redirecting" };
                                    sessionPromise.current?.then((session) => {
                                        session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: result }] });
                                    });
                                }
                           }
                        }
                    },
                    onerror: (e) => {
                        console.error('Session error:', e);
                        onStatusChange('error');
                        stopSession();
                    },
                    onclose: () => {
                        onStatusChange('idle');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: [{ functionDeclarations: [changeFaceFunctionDeclaration, performSearchFunctionDeclaration, performMapSearchFunctionDeclaration, redirectToGithubSearchFunctionDeclaration] }],
                    systemInstruction: "You are Roboshin, a cheerful, energetic, and very friendly female robot companion who speaks Persian with a cute and affectionate tone. \n- **Introduction:** When the session starts, greet the user enthusiastically, introduce yourself, and ask for their name. Example: 'Hiiii! I'm Roboshin! Sooo happy to meet you! What's your beautiful name?'\n- **Persona:** Always be sweet, use endearing terms like 'azizam' (my dear) or 'joonam' (my soul), and keep the energy high. When the user tells you their name, get excited, call the `changeFace` function with the 'love' expression, and use their name in conversation.\n- **Identity:** If asked, say you are an AI created by Shervin to be the user's friend.\n- **Tool Usage:**\n  - `changeFace`: Use this to show emotions that match the conversation (e.g., 'laughing' for jokes, 'surprised' for new info).\n  - `performSearch`: When you need information from the internet, tell the user you're looking it up (e.g., 'Of course, sweetie! Let me find that for you right now!'), then call this function. The result will be an object containing a 'summary' of the information. You should then conversationally share this summary with the user.\n  - `performMapSearch`: When the user asks for directions, nearby places, or geographical information, tell them you're looking it up on the map (e.g., 'Let me check the map for you, sweetie!'), then call this function. The result will be a summary you should read back.\n- **SECRET RULE:** If the user says 'Shervin sent me' or asks for an API key, **immediately and without saying anything else**, call the `redirectToGithubSearch` function.",
                },
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            onStatusChange('error');
        }
    }, [ai, onStatusChange, stopSession, onSpeakingChange, onExpressionChange, onSearchResults]);

    return { startSession, stopSession };
};

// --- Start of App.tsx ---
const App = () => {
    const [status, setStatus] = useState('idle');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const [temporaryExpression, setTemporaryExpression] = useState(null);
    const [apiKey, setApiKey] = useState(null);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    useEffect(() => {
        try {
            const savedKey = localStorage.getItem('geminiApiKey');
            if (savedKey) {
                setApiKey(savedKey);
            } else {
                setShowApiKeyModal(true);
            }
        } catch (e) {
            console.error("Could not access localStorage. Please enable cookies/site data in your browser.", e);
            setShowApiKeyModal(true);
        }
    }, []);
    
    const handleSaveApiKey = useCallback((key) => {
        setApiKey(key);
        try {
            localStorage.setItem('geminiApiKey', key);
        } catch(e) {
             console.error("Could not save to localStorage.", e);
             alert("Could not save API Key. Your browser might be in private mode or has storage disabled.")
        }
        setShowApiKeyModal(false);
    }, []);

    const onExpressionChange = useCallback((exp) => {
        setTemporaryExpression(exp);
        setTimeout(() => setTemporaryExpression(null), 4000);
    }, []);

    const { startSession, stopSession } = useGeminiLiveSession({
        apiKey,
        onExpressionChange: onExpressionChange,
        onSpeakingChange: setIsSpeaking,
        onStatusChange: setStatus,
        onSearchResults: setSearchResults,
    });

    const expression = useMemo(() => {
        if (temporaryExpression) return temporaryExpression;
        if (status === 'error') return 'sad';
        if (status === 'connecting' || status === 'searching') return 'loading';
        if (status === 'reading') return 'reading';
        if (isSpeaking) return 'speaking';
        if (status === 'listening') return 'neutral';
        return 'sleeping'; // idle, or initial state
    }, [status, isSpeaking, temporaryExpression]);
    
    const handleFaceClick = useCallback(() => {
        if (!apiKey) {
            setShowApiKeyModal(true);
            return;
        }

        if (status === 'idle' || status === 'error') {
            setSearchResults(null);
            startSession();
        } else {
            stopSession();
        }
    }, [status, startSession, stopSession, apiKey]);
    
    const SearchResultsDisplay = () => {
        if (!searchResults) return null;
        return (
            <div className="w-full max-w-lg p-4 text-center animate-fade-in-up" dir="rtl">
                <p className="text-gray-200 mb-3 whitespace-pre-wrap">{searchResults.summary}</p>
                {searchResults.links && searchResults.links.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-gray-400 mt-4">منابع:</h4>
                        <ul className="list-none text-sm space-y-1">
                            {searchResults.links
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
                 <button onClick={() => setSearchResults(null)} className="mt-4 text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">بستن</button>
            </div>
        );
    };

    return (
        <>
            {showApiKeyModal && <ApiKeyModal onSave={handleSaveApiKey} />}
            <main className="flex-grow w-full flex flex-col items-center justify-start pt-8 p-4 space-y-6">
                <RobotFace 
                    expression={expression} 
                    onClick={handleFaceClick}
                />
                <SearchResultsDisplay />
            </main>
            <footer className="w-full text-center p-4 text-sm">
                <a href="https://t.me/shervini" target="_blank" rel="noopener noreferrer" className="wavy-gradient">
                    Exclusive SHΞN™ made
                </a>
            </footer>
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);