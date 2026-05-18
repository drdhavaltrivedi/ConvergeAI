import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { config } from './config/env';
import { GHLWebhookController } from './controllers/ghl.controller';
import { VapiWebhookController } from './controllers/vapi.controller';

const app = express();
const port = config.PORT;

// Express controller initializations
const ghlController = new GHLWebhookController();
const vapiController = new VapiWebhookController();

// Enable Cross-Origin Resource Sharing (CORS) to allow the capture landing page to communicate with the backend
app.use(cors({
  origin: '*', // In production, replace with specific domain e.g., 'https://convergeai.com'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Setup request size limits & parser engines for JSON and URL-encoded webhooks
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Expose a beautiful root visual dashboard confirming that the backend middleware is active
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en" class="scroll-smooth">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ConvergeAI Core Dashboard & Demo Console</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Outfit', sans-serif; }
            .glow-card {
                box-shadow: 0 0 50px -15px rgba(99, 102, 241, 0.12);
                border: 1px solid rgba(255, 255, 255, 0.04);
            }
            .pulse-dot {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: .4; transform: scale(1.15); }
            }
            .terminal-glow {
                box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.05);
            }
        </style>
    </head>
    <body class="bg-[#080c14] text-slate-300 min-h-screen p-4 sm:p-8 relative overflow-x-hidden">
        <!-- Visual Backdrop Gradients -->
        <div class="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Inner Wrapper -->
        <div class="max-w-7xl mx-auto space-y-8 relative z-10">
            <!-- Header Section -->
            <header class="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0f1624]/60 backdrop-blur-md px-8 py-5 rounded-2xl border border-white/5 shadow-xl">
                <div class="flex items-center gap-4">
                    <div class="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-indigo-600/30">C</div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-wide">ConvergeAI Core</h1>
                            <span class="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase">V1.0 Demo Console</span>
                        </div>
                        <p class="text-xs text-slate-400">Interactive Webhook & CRM Opportunity Simulation Center</p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-4">
                    <!-- Config Badges -->
                    <div class="flex items-center gap-2 bg-[#121927] px-3.5 py-1.5 rounded-full border border-white/5 text-[10px] text-yellow-500 font-bold">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                        OFFLINE-MOCK DEMO
                    </div>
                    <div class="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-emerald-400 font-bold text-xs">
                        <span class="h-2 w-2 rounded-full bg-emerald-400 pulse-dot"></span>
                        MIDDLEWARE ONLINE
                    </div>
                </div>
            </header>

            <!-- Main Interactive Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Column 1: Webhook Controls & Simulated Inputs (5/12 cols) -->
                <div class="lg:col-span-5 space-y-6">
                    <!-- Webhook Simulator Panel -->
                    <div class="glow-card bg-[#0f1624]/80 backdrop-blur-md rounded-2xl p-6 space-y-6">
                        <h2 class="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                            <span class="h-2 w-2 rounded bg-indigo-500"></span>
                            Simulate Inbound Webhooks
                        </h2>

                        <!-- Tabs for Webhooks -->
                        <div class="flex bg-black/30 p-1 rounded-lg gap-1">
                            <button onclick="switchFormTab('form')" id="btn-tab-form" class="flex-1 py-2 text-xs font-bold rounded-md transition-all text-white bg-indigo-600 shadow-sm">
                                📝 Web Form Submit
                            </button>
                            <button onclick="switchFormTab('call')" id="btn-tab-call" class="flex-1 py-2 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-white">
                                📞 Missed Call event
                            </button>
                        </div>

                        <!-- Web Form Simulator Form -->
                        <div id="sim-form-panel" class="space-y-4">
                            <p class="text-xs text-slate-400">Triggers a <code>POST /api/webhooks/ghl/form</code> to register a brand new lead card in GHL CRM.</p>
                            <div class="grid grid-cols-2 gap-3 text-xs">
                                <div class="space-y-1">
                                    <label class="text-slate-400">First Name</label>
                                    <input id="form-fname" type="text" value="Jane" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-400">Last Name</label>
                                    <input id="form-lname" type="text" value="Smith" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-400">Phone Number</label>
                                    <input id="form-phone" type="text" value="+1 (555) 304-5820" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-400">Email Address</label>
                                    <input id="form-email" type="email" value="jane.smith@gmail.com" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                                </div>
                            </div>
                            <div class="space-y-1 text-xs">
                                <label class="text-slate-400">Target Business Name</label>
                                <input id="form-biz" type="text" value="Orion Aesthetics Clinic" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                            </div>
                            <button onclick="triggerFormWebhook()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                                ⚡ Trigger Form Webhook
                            </button>
                        </div>

                        <!-- Missed Call Simulator Form -->
                        <div id="sim-call-panel" class="hidden space-y-4">
                            <p class="text-xs text-slate-400">Triggers a <code>POST /api/webhooks/ghl/missed-call</code> simulation when a caller hits voicemail.</p>
                            <div class="grid grid-cols-2 gap-3 text-xs">
                                <div class="space-y-1">
                                    <label class="text-slate-400">Caller First Name</label>
                                    <input id="call-fname" type="text" value="Alex" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-400">Caller Phone</label>
                                    <input id="call-phone" type="text" value="+1 (555) 789-2041" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3 text-xs">
                                <div class="space-y-1">
                                    <label class="text-slate-400">Business Niche</label>
                                    <select id="call-niche" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                                        <option value="cosmetic">Aesthetic Clinic</option>
                                        <option value="dental">Dental Practice</option>
                                        <option value="hvac">HVAC & Plumbing</option>
                                        <option value="realestate">Real Estate</option>
                                    </select>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-400">Active Pricing Tier</label>
                                    <select id="call-tier" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                                        <option value="tier2">Tier 2: Conversational SMS</option>
                                        <option value="tier3">Tier 3: DFY Voice agent</option>
                                    </select>
                                </div>
                            </div>
                            <div class="space-y-1 text-xs">
                                <label class="text-slate-400">Target Business Name</label>
                                <input id="call-biz" type="text" value="Apex Emergency HVAC" class="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-all">
                            </div>
                            <button onclick="triggerMissedCallWebhook()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                                ⚡ Trigger Missed Call Webhook
                            </button>
                        </div>
                    </div>

                    <!-- Simulated Conversational Device Screen (SMS or Outbound Call overlay) -->
                    <div class="glow-card bg-[#0f1624]/80 backdrop-blur-md rounded-2xl p-6 relative min-h-[350px] flex flex-col">
                        <div class="border-b border-white/5 pb-3 mb-4 flex items-center justify-between">
                            <h2 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <span class="h-2 w-2 rounded bg-emerald-500"></span>
                                Live Simulated Phone Screen
                            </h2>
                            <span id="device-type-label" class="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase font-bold">Idle State</span>
                        </div>

                        <!-- 1. Idle Device Placeholder -->
                        <div id="device-idle" class="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                            <svg class="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <p class="text-xs font-bold text-slate-400">Waiting for trigger...</p>
                                <p class="text-[10px] text-slate-600 max-w-[200px] mx-auto mt-1">Fire a missed call webhook above to simulate conversational SMS or Voice callback streams!</p>
                            </div>
                        </div>

                        <!-- 2. Interactive SMS Texting Screen -->
                        <div id="device-sms" class="hidden flex-1 flex flex-col h-[320px]">
                            <!-- Chat Bubbles Thread -->
                            <div id="sms-chat-thread" class="flex-1 overflow-y-auto space-y-3 p-2 bg-black/20 rounded-xl max-h-[220px] text-xs">
                                <!-- Dynamic message bubbles append here -->
                            </div>
                            <!-- Chat Input Box -->
                            <div class="mt-3 flex gap-2">
                                <input id="sms-chat-input" type="text" placeholder="Type a response to the AI..." onkeydown="handleSmsKeypress(event)" class="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all">
                                <button onclick="sendSimulatedSms()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all active:scale-95">Send</button>
                            </div>
                        </div>

                        <!-- 3. Dynamic Voice Callback Simulation overlay -->
                        <div id="device-voice" class="hidden flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
                            <!-- Ringing / Call Interface -->
                            <div class="space-y-2">
                                <div class="h-16 w-16 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 pulse-dot">
                                    <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 id="voice-caller-title" class="text-sm font-bold text-white"> Sarah (AI Receptionist)</h4>
                                    <p id="voice-call-status" class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Ringing Caller...</p>
                                </div>
                            </div>
                            
                            <!-- Transcript subtitles panel -->
                            <div class="bg-black/35 rounded-xl p-4 border border-white/5 w-full text-xs font-mono min-h-[90px] flex items-center justify-center">
                                <p id="voice-transcript-subtitle" class="text-indigo-300 italic">"Connecting voice channel..."</p>
                            </div>

                            <p class="text-[10px] text-slate-500">Wait for the voice assistant to complete qualification and schedule on calendar.</p>
                        </div>
                    </div>
                </div>

                <!-- Column 2: Simulated CRM Pipeline & Webhook Logger (7/12 cols) -->
                <div class="lg:col-span-7 space-y-6">
                    <!-- Visual GoHighLevel CRM Pipeline Board -->
                    <div class="glow-card bg-[#0f1624]/80 backdrop-blur-md rounded-2xl p-6 space-y-6">
                        <div class="border-b border-white/5 pb-3 flex items-center justify-between">
                            <h2 class="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <span class="h-2 w-2 rounded bg-indigo-500"></span>
                                Simulated GoHighLevel Opportunity Pipeline
                            </h2>
                            <span class="text-[10px] text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded font-bold uppercase">Live Board Views</span>
                        </div>

                        <!-- Kanban Columns Board -->
                        <div class="grid grid-cols-4 gap-3">
                            <!-- Column 1: New Lead -->
                            <div class="bg-black/30 rounded-xl p-3 flex flex-col min-h-[220px]">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-3 block">New Lead</span>
                                <div id="pipeline-new-lead" class="space-y-3 flex-1">
                                    <!-- Dynamic cards inserted here -->
                                </div>
                            </div>

                            <!-- Column 2: SMS Conversation Active -->
                            <div class="bg-black/30 rounded-xl p-3 flex flex-col min-h-[220px]">
                                <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-3 block">SMS Active</span>
                                <div id="pipeline-sms-active" class="space-y-3 flex-1">
                                    <!-- Dynamic cards inserted here -->
                                </div>
                            </div>

                            <!-- Column 3: Booking Requested -->
                            <div class="bg-black/30 rounded-xl p-3 flex flex-col min-h-[220px]">
                                <span class="text-[10px] font-bold text-yellow-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-3 block font-semibold">Booking Req</span>
                                <div id="pipeline-booking-req" class="space-y-3 flex-1">
                                    <!-- Dynamic cards inserted here -->
                                </div>
                            </div>

                            <!-- Column 4: Appointment Booked -->
                            <div class="bg-black/30 rounded-xl p-3 flex flex-col min-h-[220px] border border-emerald-500/10">
                                <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-3 block">Booked 🚀</span>
                                <div id="pipeline-booked" class="space-y-3 flex-1">
                                    <!-- Dynamic cards inserted here -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Retro Neon Middleware Log Terminal -->
                    <div class="glow-card bg-black rounded-2xl overflow-hidden flex flex-col border border-indigo-500/15">
                        <!-- Terminal Bar -->
                        <div class="bg-[#0c101a] border-b border-white/5 px-4 py-3 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="h-3 w-3 rounded-full bg-red-500"></span>
                                <span class="h-3 w-3 rounded-full bg-yellow-500"></span>
                                <span class="h-3 w-3 rounded-full bg-emerald-500"></span>
                                <span class="text-[10px] font-bold text-slate-400 font-mono ml-2">convergeai-logger-terminal</span>
                            </div>
                            <button onclick="clearTerminalLogs()" class="text-[10px] text-slate-500 hover:text-slate-300 font-mono transition-colors">Clear Console</button>
                        </div>
                        <!-- Log Shell Area -->
                        <div id="terminal-body" class="p-5 font-mono text-[10px] text-slate-400 space-y-3 overflow-y-auto max-h-[240px] min-h-[200px] bg-black/90 terminal-glow">
                            <!-- Dynamic log output blocks here -->
                            <p class="text-slate-600 font-mono italic">[LOGGER SYSTEM INITIALIZED] Waiting for inbound HTTP POST triggers...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Global Client Sandbox JS Logic -->
        <script>
            // Local state management for demo dashboard
            let currentLead = null;
            let smsStep = 0;
            let smsTimer = null;
            let currentBiz = "";
            let currentRep = "Sarah";
            let currentNiche = "cosmetic";

            // On Page Load: Capture lead query details redirected from the main landing page!
            window.addEventListener('DOMContentLoaded', () => {
                const params = new URLSearchParams(window.location.search);
                if (params.has('fname') && params.has('phone')) {
                    // Pre-fill Form Webhook simulation fields
                    document.getElementById('form-fname').value = params.get('fname');
                    document.getElementById('form-lname').value = params.get('lname') || 'Smith';
                    document.getElementById('form-phone').value = params.get('phone');
                    document.getElementById('form-email').value = params.get('email') || 'jane.smith@gmail.com';
                    document.getElementById('form-biz').value = params.get('biz') || 'Orion Aesthetics Clinic';
                    
                    // Pre-fill Missed Call simulation fields
                    document.getElementById('call-fname').value = params.get('fname');
                    document.getElementById('call-phone').value = params.get('phone');
                    document.getElementById('call-biz').value = params.get('biz') || 'Orion Aesthetics Clinic';
                    
                    if (params.get('niche')) {
                        document.getElementById('call-niche').value = params.get('niche');
                    }
                    if (params.get('tier')) {
                        document.getElementById('call-tier').value = params.get('tier');
                    }

                    // Automatically execute the form submit webhook trigger!
                    setTimeout(() => {
                        triggerFormWebhook();
                    }, 800);
                }
            });

            // Tab toggler
            function switchFormTab(tab) {
                const btnForm = document.getElementById('btn-tab-form');
                const btnCall = document.getElementById('btn-tab-call');
                const panelForm = document.getElementById('sim-form-panel');
                const panelCall = document.getElementById('sim-call-panel');

                if (tab === 'form') {
                    btnForm.className = "flex-1 py-2 text-xs font-bold rounded-md transition-all text-white bg-indigo-600 shadow-sm";
                    btnCall.className = "flex-1 py-2 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-white";
                    panelForm.classList.remove('hidden');
                    panelCall.classList.add('hidden');
                } else {
                    btnCall.className = "flex-1 py-2 text-xs font-bold rounded-md transition-all text-white bg-indigo-600 shadow-sm";
                    btnForm.className = "flex-1 py-2 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-white";
                    panelCall.classList.remove('hidden');
                    panelForm.classList.add('hidden');
                }
            }

            // Terminal log utilities
            function appendTerminalLog(direction, method, path, payload, response) {
                const terminal = document.getElementById('terminal-body');
                
                // Clear the default initial placeholder
                if (terminal.innerHTML.includes('[LOGGER SYSTEM INITIALIZED]')) {
                    terminal.innerHTML = '';
                }

                const timestamp = new Date().toLocaleTimeString();
                
                const logBlock = document.createElement('div');
                logBlock.className = "border-b border-white/5 pb-3 mb-3 space-y-1.5 animate-fadeIn";
                logBlock.innerHTML = \`
                    <div class="flex items-center justify-between text-slate-400 text-[9px] border-b border-white/5 pb-1">
                        <span class="font-bold flex items-center gap-1">
                            \${direction === 'IN' ? '📥 INBOUND PAYLOAD' : '📤 OUTBOUND DISPATCH'} &bull; 
                            <strong class="text-indigo-400">\${method} \${path}</strong>
                        </span>
                        <span>\${timestamp}</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5 font-mono text-[9px]">
                        <div>
                            <span class="text-slate-500 font-bold block mb-0.5">REQUEST PARAMS</span>
                            <pre class="bg-black/50 border border-white/5 p-2 rounded max-h-[100px] overflow-y-auto text-emerald-400/90 whitespace-pre-wrap">\${JSON.stringify(payload, null, 2)}</pre>
                        </div>
                        <div>
                            <span class="text-slate-500 font-bold block mb-0.5">MIDDLEWARE RESPONSE JSON</span>
                            <pre class="bg-black/50 border border-white/5 p-2 rounded max-h-[100px] overflow-y-auto text-indigo-300 whitespace-pre-wrap">\${JSON.stringify(response, null, 2)}</pre>
                        </div>
                    </div>
                \`;
                
                terminal.appendChild(logBlock);
                terminal.scrollTop = terminal.scrollHeight;
            }

            function clearTerminalLogs() {
                const terminal = document.getElementById('terminal-body');
                terminal.innerHTML = '<p class="text-slate-600 font-mono italic">[LOGGER SYSTEM INITIALIZED] Ready.</p>';
            }

            // GHL pipeline visual updates
            function updateKanbanPipeline(leadData, stage) {
                // Clear existing cards representing this lead
                const allColumns = ['pipeline-new-lead', 'pipeline-sms-active', 'pipeline-booking-req', 'pipeline-booked'];
                allColumns.forEach(colId => {
                    const col = document.getElementById(colId);
                    const card = document.getElementById(\`card-\${leadData.phone.replace(/\\D/g, '')}\`);
                    if (card) card.remove();
                });

                // Generate new card content
                const colTarget = document.getElementById(stage);
                if (!colTarget) return;

                const cardId = \`card-\${leadData.phone.replace(/\\D/g, '')}\`;
                const card = document.createElement('div');
                card.id = cardId;
                card.className = "bg-[#141b2a] border border-white/5 p-3.5 rounded-xl space-y-2 hover:border-indigo-500/30 transition-all cursor-grab active:cursor-grabbing animate-fadeIn";
                
                const initials = leadData.name.split(' ').map(n => n[0]).join('');

                card.innerHTML = \`
                    <div class="flex items-center justify-between">
                        <span class="text-[9px] text-slate-500 tracking-wider">Contact ID: \${leadData.id}</span>
                        <span class="h-2 w-2 rounded-full \${stage === 'pipeline-booked' ? 'bg-emerald-400' : 'bg-indigo-400 pulse-dot'}"></span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                            \${initials}
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-white leading-tight">\${leadData.name}</h4>
                            <p class="text-[9px] text-slate-400">\${leadData.phone}</p>
                        </div>
                    </div>
                    <div class="flex justify-between items-center border-t border-white/5 pt-2 text-[9px] text-slate-500">
                        <span>Value: <strong class="text-slate-400 font-bold">\${stage === 'pipeline-booked' ? '$2,000' : '$1,500'}</strong></span>
                        <span class="font-mono text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-indigo-300 font-semibold">\${leadData.biz}</span>
                    </div>
                \`;

                colTarget.appendChild(card);
            }

            // Webhook trigger submissions
            async function triggerFormWebhook() {
                const fname = document.getElementById('form-fname').value;
                const lname = document.getElementById('form-lname').value;
                const phone = document.getElementById('form-phone').value;
                const email = document.getElementById('form-email').value;
                const biz = document.getElementById('form-biz').value;

                const payload = { firstName: fname, lastName: lname, phone, email, businessName: biz };

                try {
                    const response = await fetch('/api/webhooks/ghl/form', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const resJson = await response.json();
                    
                    // Create simulated lead tracker
                    currentLead = {
                        id: resJson.contactId || 'ghl_con_123908',
                        name: \`\${fname} \${lname}\`,
                        phone: phone,
                        email: email,
                        biz: biz
                    };

                    appendTerminalLog('IN', 'POST', '/api/webhooks/ghl/form', payload, resJson);
                    updateKanbanPipeline(currentLead, 'pipeline-new-lead');
                    
                    // Reset UI devices to idle
                    resetSimulatedDevices();
                } catch (err) {
                    console.error(err);
                }
            }

            function resetSimulatedDevices() {
                document.getElementById('device-idle').classList.remove('hidden');
                document.getElementById('device-sms').classList.add('hidden');
                document.getElementById('device-voice').classList.add('hidden');
                document.getElementById('device-type-label').innerText = 'Idle State';
            }

            async function triggerMissedCallWebhook() {
                const fname = document.getElementById('call-fname').value;
                const phone = document.getElementById('call-phone').value;
                const niche = document.getElementById('call-niche').value;
                const tier = document.getElementById('call-tier').value;
                const biz = document.getElementById('call-biz').value;

                currentBiz = biz;
                currentNiche = niche;
                currentRep = niche === 'hvac' ? 'Emergency Dispatcher' : 'Sarah';

                const payload = { firstName: fname, phone, niche, tier, businessName: biz };

                try {
                    const response = await fetch('/api/webhooks/ghl/missed-call', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const resJson = await response.json();

                    currentLead = {
                        id: 'ghl_con_' + Math.floor(Math.random() * 900000),
                        name: fname,
                        phone: phone,
                        biz: biz
                    };

                    appendTerminalLog('IN', 'POST', '/api/webhooks/ghl/missed-call', payload, resJson);
                    
                    if (tier === 'tier2') {
                        // TIER 2: Conversational SMS
                        updateKanbanPipeline(currentLead, 'pipeline-sms-active');
                        setupSmsChatSimulator(resJson.sms || "Hey, sorry we missed your call. How can we help you book your slot today?");
                    } else {
                        // TIER 3: Autonomous Voice
                        updateKanbanPipeline(currentLead, 'pipeline-sms-active');
                        setupVoiceCallSimulator(fname);
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            // SMS Conversation Simulation Core
            function setupSmsChatSimulator(initialText) {
                resetSimulatedDevices();
                document.getElementById('device-idle').classList.add('hidden');
                document.getElementById('device-sms').classList.remove('hidden');
                document.getElementById('device-type-label').innerText = 'SMS Conversation Thread';

                const thread = document.getElementById('sms-chat-thread');
                thread.innerHTML = '';
                
                // Add initial assistant text bubble
                appendSmsBubble('assistant', initialText);
                smsStep = 0;
            }

            function appendSmsBubble(role, text) {
                const thread = document.getElementById('sms-chat-thread');
                const bubble = document.createElement('div');
                bubble.className = \`p-3.5 rounded-xl max-w-[85%] leading-relaxed animate-fadeIn \${
                    role === 'user' 
                        ? 'bg-indigo-600 text-white self-end ml-auto rounded-tr-none' 
                        : 'bg-white/5 border border-white/5 text-slate-300 mr-auto rounded-tl-none'
                }\`;
                bubble.innerText = text;
                thread.appendChild(bubble);
                thread.scrollTop = thread.scrollHeight;
            }

            function handleSmsKeypress(event) {
                if (event.key === 'Enter') {
                    sendSimulatedSms();
                }
            }

            async function sendSimulatedSms() {
                const input = document.getElementById('sms-chat-input');
                const message = input.value.trim();
                if (!message) return;

                appendSmsBubble('user', message);
                input.value = '';

                // Show typing indicator
                const thread = document.getElementById('sms-chat-thread');
                const typing = document.createElement('p');
                typing.id = 'sms-typing';
                typing.className = 'text-[10px] text-indigo-400/70 italic ml-1 animate-pulse';
                typing.innerText = \`\${currentRep} typing...\`;
                thread.appendChild(typing);
                thread.scrollTop = thread.scrollHeight;

                const payload = {
                    phone: currentLead.phone,
                    message: message,
                    firstName: currentLead.name,
                    businessName: currentBiz,
                    representativeName: currentRep,
                    niche: currentNiche
                };

                try {
                    const response = await fetch('/api/webhooks/ghl/sms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const resJson = await response.json();

                    // Remove typing indicator
                    const typingEl = document.getElementById('sms-typing');
                    if (typingEl) typingEl.remove();

                    // Append server reply
                    appendSmsBubble('assistant', resJson.reply);
                    appendTerminalLog('IN', 'POST', '/api/webhooks/ghl/sms', payload, resJson);

                    // Update pipeline visual stages depending on server-detected intent
                    if (resJson.bookingIntent) {
                        updateKanbanPipeline(currentLead, 'pipeline-booking-req');
                    }
                    
                    // Simple heuristic trigger: if response mentions calendar link, move to confirm
                    if (resJson.reply.toLowerCase().includes('calendar') || resJson.reply.toLowerCase().includes('book-slot')) {
                        setTimeout(() => {
                            updateKanbanPipeline(currentLead, 'pipeline-booked');
                            appendSmsBubble('assistant', '📅 System Confirmed: Slot selected! An appointment confirmation card has been generated in your CRM.');
                        }, 2500);
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            // Voice Call Callback Simulation Core
            function setupVoiceCallSimulator(clientName) {
                resetSimulatedDevices();
                document.getElementById('device-idle').classList.add('hidden');
                document.getElementById('device-voice').classList.remove('hidden');
                document.getElementById('device-type-label').innerText = 'Outbound Voice Callback';

                const subtitle = document.getElementById('voice-transcript-subtitle');
                const status = document.getElementById('voice-call-status');
                
                status.innerText = 'Dialing Prospect...';
                subtitle.innerText = 'Dials: +1 (555) 789-2041';

                // Real-time dialogue flow simulator
                const dialogue = [
                  { time: 2500, status: 'CONNECTED & speaking', sub: \`"Hey \${clientName}! This is \${currentRep} with \${currentBiz}. I noticed we missed your call. Are you looking to book a slot today?"\` },
                  { time: 5500, status: 'LISTENING for answer', sub: \`[Customer]: "Yes, I\\'m looking to schedule a slot to check emergency diagnostic leaks..."\` },
                  { time: 8500, status: 'processing qualification', sub: \`"\${currentRep}: Got it! I have slot openings this Thursday at 2:00 PM or Friday at 10:00 AM. Which one should we book?"\` },
                  { time: 11500, status: 'LISTENING', sub: \`[Customer]: "Friday morning at 10:00 AM works perfectly."\` },
                  { time: 14500, status: 'booking appointment slot', sub: \`"\${currentRep}: Awesome! Securing Friday morning at 10:00 AM. I have sent the confirmation SMS. See you then!"\` },
                  { time: 18000, status: 'CALL ENDED', sub: '[Call Terminated. Outbound Call Summary synced to GHL CRM Notes]' }
                ];

                dialogue.forEach(step => {
                    setTimeout(async () => {
                        status.innerText = step.status;
                        subtitle.innerText = step.sub;

                        // Trigger Pipeline Shifts at designated dialog steps
                        if (step.status.includes('CONNECTED')) {
                            updateKanbanPipeline(currentLead, 'pipeline-sms-active');
                        }
                        if (step.status.includes('processing')) {
                            updateKanbanPipeline(currentLead, 'pipeline-booking-req');
                        }
                        if (step.status.includes('booking appointment')) {
                            updateKanbanPipeline(currentLead, 'pipeline-booked');
                            
                            // Send simulated Vapi callback event webhook report to the backend!
                            const mockVapiReport = {
                                message: {
                                    type: 'end-of-call-report',
                                    call: {
                                        customer: { number: currentLead.phone },
                                        transcript: \`Sarah: Hey \${clientName}, missed your call... Prospect wanted diagnostic check. Booked Friday 10AM.\`,
                                        analysis: {
                                            summary: 'Customer answered outbound callback immediately, requested system check, booked Friday at 10:00 AM.',
                                            structuredData: { appointmentBooked: true }
                                        },
                                        cost: 0.28,
                                        duration: 65
                                    }
                                }
                            };

                            const vapiResponse = await fetch('/api/webhooks/vapi', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(mockVapiReport)
                            });
                            const vapiResJson = await vapiResponse.json();
                            
                            appendTerminalLog('IN', 'POST', '/api/webhooks/vapi', mockVapiReport, vapiResJson);
                        }
                    }, step.time);
                });
            }
        </script>
    </body>
    </html>
  `);
});

// Expose public system status check route JSON endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    mode: config.NODE_ENV,
    integrations: {
      ghlEnabled: !config.GHL_API_KEY.startsWith('MOCK_'),
      openaiEnabled: !config.OPENAI_API_KEY.startsWith('MOCK_'),
      vapiEnabled: !config.VAPI_API_KEY.startsWith('MOCK_')
    }
  });
});

/**
 * GoHighLevel Agency & Sub-Account Webhook Routes
 */
app.post('/api/webhooks/ghl/missed-call', (req, res) => ghlController.handleMissedCall(req, res));
app.post('/api/webhooks/ghl/sms', (req, res) => ghlController.handleIncomingSMS(req, res));
app.post('/api/webhooks/ghl/form', (req, res) => ghlController.handleWebFormSubmit(req, res));

/**
 * Vapi.ai Voice Webhook Route
 */
app.post('/api/webhooks/vapi', (req, res) => vapiController.handleVapiWebhook(req, res));

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[SERVER GLOBAL UNCAUGHT ERROR]:', err);
  res.status(500).json({
    error: 'An unexpected internal server error occurred',
    message: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Launch server instance
app.listen(port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 CONVERGEAI CORE MIDDLEWARE ONLINE AND RUNNING`);
  console.log(`🔌 Port Address: http://localhost:${port}`);
  console.log(`⚙️  Active Environment: ${config.NODE_ENV}`);
  console.log(`🎯 Active Integrations:`);
  console.log(`   - OpenAI API:   [${config.OPENAI_API_KEY.startsWith('MOCK_') ? '⚠️ MOCK MODE' : '✅ LIVE ACTIVE'}]`);
  console.log(`   - GoHighLevel:  [${config.GHL_API_KEY.startsWith('MOCK_') ? '⚠️ MOCK MODE' : '✅ LIVE ACTIVE'}]`);
  console.log(`   - Vapi.ai:      [${config.VAPI_API_KEY.startsWith('MOCK_') ? '⚠️ MOCK MODE' : '✅ LIVE ACTIVE'}]`);
  console.log(`======================================================\n`);
});

export default app;
