<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>DocuScan Pro</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- jsPDF for PDF generation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    <!-- Phosphor Icons -->
    <script src="https://unpkg.com/@phosphor-icons/web"></script>

    <!-- OpenCV.js for Computer Vision (Edge Detection & Perspective Warp) -->
    <script>
        // Setup the Module before the script loads to catch the initialization event
        var Module = {
            onRuntimeInitialized: function() {
                window.cvReady = true;
                const cvStatus = document.getElementById('cvStatus');
                if(cvStatus) {
                    cvStatus.textContent = "AI Engine Ready (Auto-detect active)";
                    cvStatus.classList.remove('text-yellow-400');
                    cvStatus.classList.add('text-green-400');
                }
            }
        };
    </script>
    <script async src="https://docs.opencv.org/4.8.0/opencv.js"></script>

    <style>
        html, body { 
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            width: 100%; height: 100%; margin: 0; padding: 0;
            overflow: hidden; touch-action: none;
            -webkit-tap-highlight-color: transparent; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #111827;
        }
        .hide { display: none !important; }
        .thumb-scroll::-webkit-scrollbar { width: 6px; }
        .thumb-scroll::-webkit-scrollbar-thumb { background: #4B5563; border-radius: 10px; }
    </style>
</head>
<body class="text-white">

    <div id="app" class="relative w-full h-full">
        
        <!-- ========================================== -->
        <!-- 0. LOGIN OVERLAY                           -->
        <!-- ========================================== -->
        <div id="loginOverlay" class="absolute inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center p-6 hide">
            <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="ph ph-lock-key text-3xl text-white"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-white">Secure Login</h1>
                    <p class="text-sm text-gray-400 mt-2">Enter a username and password to access your secure Drive folder.</p>
                </div>
                <input type="text" id="usernameInput" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none mb-3 text-center" placeholder="Username">
                <input type="password" id="passwordInput" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none mb-4 text-center" placeholder="Password">
                <button id="loginBtn" class="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors flex justify-center items-center gap-2">
                    <span id="loginBtnText">Access My Scanner</span>
                    <i id="loginSpinner" class="ph ph-spinner animate-spin text-xl hide"></i>
                </button>
                <div class="text-center text-xs text-gray-500 mt-6 tracking-wide font-medium">Developed by PVNJ</div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- 1. CAMERA VIEW                             -->
        <!-- ========================================== -->
        <div id="cameraView" class="absolute inset-0 z-10 flex flex-col bg-black">
            <!-- Header -->
            <header class="absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center pointer-events-none">
                <div class="flex items-center gap-2 pointer-events-auto">
                    <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">U</div>
                    <span class="font-medium text-sm drop-shadow-md">User</span>
                </div>
                <div class="flex gap-2 items-center pointer-events-auto">
                    <button id="logoutBtn" class="text-red-400 hover:text-red-300 p-2 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-md transition-colors shadow" title="Logout">
                        <i class="ph ph-sign-out text-xl"></i>
                    </button>
                    <button id="viewDriveBtn" class="text-blue-400 hover:text-blue-300 p-2 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-md transition-colors shadow" title="My Files">
                        <i class="ph ph-folder-open text-xl"></i>
                    </button>
                    <button id="switchCameraBtn" class="text-gray-300 hover:text-white p-2 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-md transition-colors shadow">
                        <i class="ph ph-camera-rotate text-xl"></i>
                    </button>
                </div>
            </header>

            <!-- Video Feed -->
            <video id="videoElement" class="w-full h-full object-cover" autoplay playsinline></video>
            
            <!-- Bottom Controls -->
            <div class="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black to-transparent flex justify-center items-center z-20">
                <div class="flex items-center gap-8">
                    <div class="w-14 h-14"></div> <!-- Spacer -->
                    
                    <button id="captureBtn" class="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/60 transition-colors shadow-lg shadow-black/50">
                        <div class="w-16 h-16 rounded-full bg-white"></div>
                    </button>
                    
                    <button id="goToViewerBtn" class="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-400 bg-gray-800 flex items-center justify-center hide shadow-lg">
                        <img id="lastThumb" src="" class="w-full h-full object-cover hide">
                        <span id="pageBadge" class="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow hide">0</span>
                    </button>
                </div>
            </div>
            
            <!-- Hidden Canvas for capturing -->
            <canvas id="canvasElement" class="hide"></canvas>
        </div>

        <!-- ========================================== -->
        <!-- 2. CROP & ADJUST VIEW                      -->
        <!-- ========================================== -->
        <div id="cropView" class="absolute inset-0 z-40 bg-gray-900 flex flex-col hide">
            <!-- Header -->
            <header class="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700 shadow-sm z-10">
                <button id="cancelCropBtn" class="p-2 text-red-400 hover:bg-gray-700 rounded-lg flex items-center gap-1 transition-colors">
                    <i class="ph ph-x text-xl"></i> <span class="text-sm font-medium">Retake</span>
                </button>
                <div class="text-white font-medium">Adjust Edges</div>
                <button id="confirmCropBtn" class="p-2 text-blue-400 hover:bg-gray-700 rounded-lg flex items-center gap-1 transition-colors">
                    <span class="text-sm font-medium">Done</span> <i class="ph ph-check text-xl"></i>
                </button>
            </header>

            <!-- Crop Interactive Area -->
            <div id="cropContainer" class="relative w-full flex-1 bg-black overflow-hidden touch-none">
                <!-- Image goes here -->
                <img id="cropImage" class="absolute pointer-events-none origin-top-left object-cover">
                
                <!-- Polygon Overlay -->
                <svg id="cropSvg" class="absolute inset-0 pointer-events-none w-full h-full z-10">
                    <polygon id="cropPolygon" points="" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2"/>
                </svg>
                
                <!-- Draggable Corners -->
                <div id="pt0" class="crop-pt absolute w-12 h-12 -ml-6 -mt-6 bg-blue-500/40 border-2 border-white rounded-full flex items-center justify-center cursor-pointer touch-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"><div class="w-3 h-3 bg-white rounded-full"></div></div>
                <div id="pt1" class="crop-pt absolute w-12 h-12 -ml-6 -mt-6 bg-blue-500/40 border-2 border-white rounded-full flex items-center justify-center cursor-pointer touch-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"><div class="w-3 h-3 bg-white rounded-full"></div></div>
                <div id="pt2" class="crop-pt absolute w-12 h-12 -ml-6 -mt-6 bg-blue-500/40 border-2 border-white rounded-full flex items-center justify-center cursor-pointer touch-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"><div class="w-3 h-3 bg-white rounded-full"></div></div>
                <div id="pt3" class="crop-pt absolute w-12 h-12 -ml-6 -mt-6 bg-blue-500/40 border-2 border-white rounded-full flex items-center justify-center cursor-pointer touch-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"><div class="w-3 h-3 bg-white rounded-full"></div></div>
            </div>
            
            <!-- Status Footer -->
            <div class="bg-gray-800 p-4 border-t border-gray-700 text-center text-xs text-gray-400 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-10">
                Drag the corners to accurately match the document edges.
                <div id="cvStatus" class="mt-1 font-semibold text-yellow-400 transition-colors">AI Engine Loading...</div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- 3. VIEWER VIEW                             -->
        <!-- ========================================== -->
        <div id="viewerView" class="absolute inset-0 z-30 flex flex-col bg-gray-900 hide">
            <header class="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700 shadow-sm">
                <button id="backToCameraBtn" class="p-2 text-white hover:bg-gray-700 rounded-lg flex items-center gap-1 transition-colors">
                    <i class="ph ph-caret-left text-xl"></i> <span class="text-sm font-medium">Add More</span>
                </button>
                <button id="newScanBtn" class="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700/50 rounded-lg flex items-center gap-1 transition-colors">
                    <i class="ph ph-file-dashed text-xl"></i> <span class="text-sm font-medium">New Scan</span>
                </button>
            </header>
            
            <div class="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
                <img id="viewerImage" src="" class="max-w-full max-h-full object-contain shadow-2xl transition-transform bg-white">
                
                <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-6 items-center">
                    <button id="prevPageBtn" class="p-3 bg-black/70 rounded-full backdrop-blur text-white hover:bg-black transition-colors shadow-lg"><i class="ph ph-caret-left text-xl"></i></button>
                    <div class="bg-black/70 backdrop-blur text-white px-5 py-2 rounded-full font-medium shadow-lg tracking-wide" id="pageIndicator">1 / 1</div>
                    <button id="nextPageBtn" class="p-3 bg-black/70 rounded-full backdrop-blur text-white hover:bg-black transition-colors shadow-lg"><i class="ph ph-caret-right text-xl"></i></button>
                </div>
            </div>

            <div class="bg-gray-800 p-4 pb-6 border-t border-gray-700 grid grid-cols-3 gap-2 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                <button id="exportPdfBtn" class="flex flex-col items-center gap-1.5 p-3 text-gray-300 hover:text-white rounded-xl hover:bg-gray-700 transition-colors">
                    <i class="ph ph-download-simple text-2xl"></i>
                    <span class="text-xs font-semibold">Save PDF</span>
                </button>
                <button id="exportJpgBtn" class="flex flex-col items-center gap-1.5 p-3 text-gray-300 hover:text-white rounded-xl hover:bg-gray-700 transition-colors">
                    <i class="ph ph-image text-2xl"></i>
                    <span class="text-xs font-semibold">Save JPG</span>
                </button>
                <button id="triggerDriveBtn" class="flex flex-col items-center gap-1.5 p-3 text-blue-400 hover:text-blue-300 rounded-xl hover:bg-gray-700 transition-colors">
                    <i class="ph ph-cloud-arrow-up text-2xl"></i>
                    <span class="text-xs font-semibold">Drive Upload</span>
                </button>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- 4. MODALS & TOASTS                         -->
        <!-- ========================================== -->
        <div id="saveModal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 hide backdrop-blur-sm">
            <div class="bg-gray-800 rounded-2xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl">
                <h2 class="text-xl font-bold mb-4 text-white">Upload to Drive</h2>
                <div class="mb-4">
                    <label class="block text-sm text-gray-400 mb-1">Document Title</label>
                    <input type="text" id="docTitleInput" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none" placeholder="E.g., Tax Returns 2024">
                </div>
                <div class="mb-6">
                    <label class="block text-sm text-gray-400 mb-1">Save Format</label>
                    <select id="formatSelect" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none appearance-none">
                        <option value="pdf">Combine into Single PDF</option>
                        <option value="images">Separate Image Files</option>
                    </select>
                </div>
                <div class="flex gap-3">
                    <button id="cancelSaveBtn" class="flex-1 py-3 rounded-xl bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors">Cancel</button>
                    <button id="confirmSaveBtn" class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                        <i class="ph ph-upload-simple text-lg"></i> Upload
                    </button>
                </div>
            </div>
        </div>

        <div id="filesModal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 hide backdrop-blur-sm">
            <div class="bg-gray-800 rounded-2xl w-full max-w-sm p-6 border border-gray-700 max-h-[80vh] flex flex-col shadow-2xl">
                <h2 class="text-xl font-bold mb-4 text-white flex justify-between items-center">
                    My Drive Files
                    <button id="closeFilesBtn" class="text-gray-400 hover:text-white transition-colors"><i class="ph ph-x text-xl"></i></button>
                </h2>
                <div id="filesListContainer" class="flex-1 overflow-y-auto thumb-scroll flex flex-col pr-1"></div>
            </div>
        </div>

        <div id="toast" class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full text-white font-medium text-sm transition-all duration-300 opacity-0 pointer-events-none transform -translate-y-4 shadow-lg shadow-black/40"></div>
    </div>

    <script>
        // ==========================================
        // CONFIGURATION & STATE
        // ==========================================
        const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbySF1GPjOnzpKZNLy0bu0pxE5Xl9wOyxInSdBXbzW-d2CS67fDeOfw8wSxciq4uJni7Zg/exec"; 
        
        let currentUser = localStorage.getItem('docuscan_user') || ""; 
        let currentPassword = localStorage.getItem('docuscan_pass') || "";
        
        let scannedPages = [];
        let viewerIndex = 0;
        let currentFacingMode = 'environment';
        let stream = null;
        window.cvReady = window.cvReady || false;

        const el = id => document.getElementById(id);
        
        function showToast(msg, type = 'info') {
            const t = el('toast');
            t.textContent = msg;
            t.className = `fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full text-white font-medium text-sm transition-all duration-300 transform shadow-lg shadow-black/40 ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`;
            t.classList.remove('opacity-0', '-translate-y-4');
            setTimeout(() => t.classList.add('opacity-0', '-translate-y-4'), 3000);
        }

        function updateUI() {
            if (scannedPages.length > 0) {
                el('goToViewerBtn').classList.remove('hide');
                el('lastThumb').src = scannedPages[scannedPages.length - 1];
                el('lastThumb').classList.remove('hide');
                el('pageBadge').classList.remove('hide');
                el('pageBadge').textContent = scannedPages.length;
            } else {
                el('goToViewerBtn').classList.add('hide');
                el('lastThumb').classList.add('hide');
                el('pageBadge').classList.add('hide');
            }
        }

        // ==========================================
        // LOGIN/LOGOUT LOGIC
        // ==========================================
        function checkLogin() {
            if (currentUser && currentPassword) {
                el('loginOverlay').classList.add('hide');
                const userInitial = currentUser.charAt(0).toUpperCase();
                const headerInitialEl = document.querySelector('#cameraView header .w-8');
                const headerNameEl = document.querySelector('#cameraView header span');
                if (headerInitialEl) headerInitialEl.textContent = userInitial;
                if (headerNameEl) headerNameEl.textContent = currentUser;
                initCamera();
            }
        }

        el('loginBtn').addEventListener('click', async () => {
            const userVal = el('usernameInput').value.trim();
            const passVal = el('passwordInput').value.trim();
            if (userVal.length < 3 || passVal.length < 4) return showToast("Username min 3 chars, Password min 4 chars", "error");
            if (!GOOGLE_APPS_SCRIPT_URL.includes("script.google.com")) return alert("Please add your Apps Script URL to the code before logging in.");

            el('loginBtnText').textContent = "Authenticating...";
            el('loginSpinner').classList.remove('hide');
            el('loginBtn').disabled = true;

            try {
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'auth', username: userVal, password: passVal }) });
                const result = await response.json();
                if (result.success) {
                    currentUser = userVal; currentPassword = passVal;
                    localStorage.setItem('docuscan_user', currentUser); localStorage.setItem('docuscan_pass', currentPassword);
                    showToast(result.message, "success"); checkLogin();
                } else showToast(result.error || "Authentication failed", "error");
            } catch (err) { showToast("Network error. Try again.", "error"); } 
            finally { el('loginBtnText').textContent = "Access My Scanner"; el('loginSpinner').classList.add('hide'); el('loginBtn').disabled = false; }
        });

        el('logoutBtn').addEventListener('click', () => {
            currentUser = ""; currentPassword = "";
            localStorage.removeItem('docuscan_user'); localStorage.removeItem('docuscan_pass');
            el('usernameInput').value = ''; el('passwordInput').value = '';
            scannedPages = []; viewerIndex = 0; updateUI();
            el('viewerView').classList.add('hide'); el('cropView').classList.add('hide'); el('cameraView').classList.remove('hide');
            if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
            el('loginOverlay').classList.remove('hide'); showToast("Logged out successfully", "success");
        });

        if (!currentUser) el('loginOverlay').classList.remove('hide'); else checkLogin();

        // ==========================================
        // CAMERA LOGIC
        // ==========================================
        async function initCamera() {
            if (!currentUser) return;
            if (stream) stream.getTracks().forEach(track => track.stop());
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } });
                el('videoElement').srcObject = stream;
            } catch (err) { showToast("Cannot access camera", "error"); }
        }

        el('switchCameraBtn').addEventListener('click', () => { currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment'; initCamera(); });

        el('captureBtn').addEventListener('click', () => {
            const video = el('videoElement');
            const canvas = el('canvasElement');
            const flash = document.createElement('div');
            flash.className = 'absolute inset-0 bg-white z-50 transition-opacity duration-300 pointer-events-none opacity-100';
            el('cameraView').appendChild(flash);
            setTimeout(() => flash.classList.add('opacity-0'), 50);
            setTimeout(() => flash.remove(), 350);

            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            initCrop(canvas); // Go to Crop UI instead of direct save
        });

        // ==========================================
        // CROP & COMPUTER VISION LOGIC
        // ==========================================
        let currentCropCanvas = null;
        let cropImgBaseW = 0; let cropImgBaseH = 0;
        let cropScale = 1; let cropOffsetX = 0; let cropOffsetY = 0;
        let activePtIndex = -1;
        let cropPts = []; // array of {x, y} in IMAGE coordinates [TL, TR, BR, BL]

        function initCrop(canvas) {
            el('cameraView').classList.add('hide');
            el('cropView').classList.remove('hide');
            
            currentCropCanvas = canvas;
            cropImgBaseW = canvas.width;
            cropImgBaseH = canvas.height;
            el('cropImage').src = canvas.toDataURL('image/jpeg', 0.8);

            // Attempt AI Auto-detect
            let detectedPts = null;
            if (window.cvReady) {
                showToast("Scanning for document edges...", "info");
                setTimeout(() => {
                    detectedPts = findDocumentCorners(canvas);
                    setupCropUI(detectedPts);
                }, 50);
            } else {
                setupCropUI(null);
            }
        }

        function setupCropUI(detectedPts) {
            if (detectedPts && detectedPts.length === 4) {
                cropPts = detectedPts;
                showToast("Document detected!", "success");
            } else {
                // Default 10% margins fallback
                let mw = cropImgBaseW * 0.1; let mh = cropImgBaseH * 0.1;
                cropPts = [ {x: mw, y: mh}, {x: cropImgBaseW - mw, y: mh}, {x: cropImgBaseW - mw, y: cropImgBaseH - mh}, {x: mw, y: cropImgBaseH - mh} ];
                if(window.cvReady) showToast("Could not auto-detect edges. Adjust manually.", "info");
            }
            
            el('cropImage').onload = () => { calcCropBounds(); renderCropUI(); };
            window.removeEventListener('resize', resizeCrop);
            window.addEventListener('resize', resizeCrop);
        }

        function resizeCrop() { if(!el('cropView').classList.contains('hide')) { calcCropBounds(); renderCropUI(); } }

        function calcCropBounds() {
            let container = el('cropContainer');
            let cw = container.clientWidth; let ch = container.clientHeight;
            
            cropScale = Math.min(cw / cropImgBaseW, ch / cropImgBaseH);
            let scaledW = cropImgBaseW * cropScale; let scaledH = cropImgBaseH * cropScale;
            
            cropOffsetX = (cw - scaledW) / 2; cropOffsetY = (ch - scaledH) / 2;
            
            el('cropImage').style.width = `${scaledW}px`; el('cropImage').style.height = `${scaledH}px`;
            el('cropImage').style.left = `${cropOffsetX}px`; el('cropImage').style.top = `${cropOffsetY}px`;
        }

        function renderCropUI() {
            let svgPts = cropPts.map(p => `${p.x * cropScale + cropOffsetX},${p.y * cropScale + cropOffsetY}`).join(" ");
            el('cropPolygon').setAttribute('points', svgPts);
            
            for(let i=0; i<4; i++) {
                let sx = cropPts[i].x * cropScale + cropOffsetX;
                let sy = cropPts[i].y * cropScale + cropOffsetY;
                el('pt'+i).style.transform = `translate(${sx}px, ${sy}px)`;
            }
        }

        // --- Touch/Drag handlers for corners ---
        const getEvtCoords = (e) => (e.touches && e.touches.length > 0) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

        for(let i=0; i<4; i++) {
            const startDrag = (e) => { e.preventDefault(); activePtIndex = i; };
            el('pt'+i).addEventListener('mousedown', startDrag);
            el('pt'+i).addEventListener('touchstart', startDrag, {passive: false});
        }

        const moveDrag = (e) => {
            if (activePtIndex === -1) return;
            e.preventDefault();
            let coords = getEvtCoords(e);
            let rect = el('cropContainer').getBoundingClientRect();
            
            let sx = coords.x - rect.left; let sy = coords.y - rect.top;
            let imgX = (sx - cropOffsetX) / cropScale; let imgY = (sy - cropOffsetY) / cropScale;
            
            imgX = Math.max(0, Math.min(imgX, cropImgBaseW)); imgY = Math.max(0, Math.min(imgY, cropImgBaseH));
            cropPts[activePtIndex] = {x: imgX, y: imgY};
            renderCropUI();
        };

        const endDrag = (e) => { activePtIndex = -1; };

        el('cropContainer').addEventListener('mousemove', moveDrag);
        el('cropContainer').addEventListener('touchmove', moveDrag, {passive: false});
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);

        // --- Crop Actions ---
        el('cancelCropBtn').addEventListener('click', () => {
            el('cropView').classList.add('hide'); el('cameraView').classList.remove('hide');
        });

        el('confirmCropBtn').addEventListener('click', () => {
            showToast("Enhancing document...", "info");
            setTimeout(() => {
                let finalDataUrl = flattenDocument(currentCropCanvas, cropPts);
                scannedPages.push(finalDataUrl);
                
                el('cropView').classList.add('hide'); el('cameraView').classList.remove('hide');
                updateUI();
                showToast("Page Scanned!", "success");
            }, 50);
        });

        // --- OpenCV Core Functions ---
        function findDocumentCorners(srcCanvas) {
            if (!window.cvReady) return null;
            try {
                let src = cv.imread(srcCanvas);
                let dst = new cv.Mat();
                
                // Downscale for faster processing
                let maxSize = 500;
                let scale = Math.min(maxSize / src.cols, maxSize / src.rows);
                let dsize = new cv.Size(src.cols * scale, src.rows * scale);
                cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);

                // Grayscale -> Blur -> Canny Edges
                cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
                cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
                cv.Canny(dst, dst, 75, 200);

                let contours = new cv.MatVector(); let hierarchy = new cv.Mat();
                cv.findContours(dst, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

                let maxArea = 0; let bestApprox = null;
                for (let i = 0; i < contours.size(); ++i) {
                    let cnt = contours.get(i);
                    let area = cv.contourArea(cnt);
                    if (area > 1000) { 
                        let peri = cv.arcLength(cnt, true);
                        let approx = new cv.Mat();
                        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
                        if (approx.rows === 4 && cv.isContourConvex(approx)) {
                            if (area > maxArea) {
                                maxArea = area;
                                if (bestApprox) bestApprox.delete();
                                bestApprox = approx;
                            } else approx.delete();
                        } else approx.delete();
                    }
                    cnt.delete();
                }

                let result = null;
                if (bestApprox) {
                    result = [];
                    for (let i = 0; i < 4; i++) {
                        result.push({ x: bestApprox.data32S[i * 2] / scale, y: bestApprox.data32S[i * 2 + 1] / scale });
                    }
                    bestApprox.delete();
                }

                src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
                
                return result ? orderPoints(result) : null;
            } catch (err) { console.error("CV Error:", err); return null; }
        }

        // Ensures points are [TL, TR, BR, BL] for correct perspective warp
        function orderPoints(pts) {
            let rect = new Array(4);
            let s = pts.map(p => p.x + p.y);
            let tlIndex = s.indexOf(Math.min(...s)); let brIndex = s.indexOf(Math.max(...s));
            rect[0] = pts[tlIndex]; rect[2] = pts[brIndex];
            
            let diff = pts.map(p => p.y - p.x);
            let remaining = [0, 1, 2, 3].filter(i => i !== tlIndex && i !== brIndex);
            
            if (diff[remaining[0]] < diff[remaining[1]]) {
                rect[1] = pts[remaining[0]]; rect[3] = pts[remaining[1]];
            } else {
                rect[1] = pts[remaining[1]]; rect[3] = pts[remaining[0]];
            }
            return rect;
        }

        function flattenDocument(srcCanvas, pts) {
            if (!window.cvReady) return srcCanvas.toDataURL('image/jpeg', 0.85); // Fallback if CV fails
            try {
                let src = cv.imread(srcCanvas);
                let tl = pts[0], tr = pts[1], br = pts[2], bl = pts[3];
                
                // Calculate max width & height to maintain aspect ratio
                let widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
                let widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
                let maxWidth = Math.max(widthA, widthB);
                
                let heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
                let heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
                let maxHeight = Math.max(heightA, heightB);

                let dst = new cv.Mat();
                let dsize = new cv.Size(maxWidth, maxHeight);

                let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [ tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y ]);
                let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [ 0, 0, maxWidth, 0, maxWidth, maxHeight, 0, maxHeight ]);

                let M = cv.getPerspectiveTransform(srcTri, dstTri);
                cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

                let tmpCanvas = document.createElement('canvas');
                cv.imshow(tmpCanvas, dst);
                let dataUrl = tmpCanvas.toDataURL('image/jpeg', 0.85);

                src.delete(); dst.delete(); M.delete(); srcTri.delete(); dstTri.delete();
                return dataUrl;
            } catch (err) { console.error("Warp Error:", err); return srcCanvas.toDataURL('image/jpeg', 0.85); }
        }

        // ==========================================
        // VIEWER & EXPORT LOGIC
        // ==========================================
        function showViewer() {
            el('cameraView').classList.add('hide'); el('viewerView').classList.remove('hide');
            viewerIndex = scannedPages.length - 1; updateView();
        }

        function updateView() {
            if (scannedPages.length === 0) return;
            el('viewerImage').src = scannedPages[viewerIndex];
            el('pageIndicator').textContent = `${viewerIndex + 1} / ${scannedPages.length}`;
            el('prevPageBtn').style.opacity = viewerIndex === 0 ? '0.3' : '1';
            el('nextPageBtn').style.opacity = viewerIndex === scannedPages.length - 1 ? '0.3' : '1';
        }

        el('goToViewerBtn').addEventListener('click', showViewer);
        el('backToCameraBtn').addEventListener('click', () => { el('viewerView').classList.add('hide'); el('cameraView').classList.remove('hide'); });
        el('prevPageBtn').addEventListener('click', () => { if (viewerIndex > 0) { viewerIndex--; updateView(); } });
        el('nextPageBtn').addEventListener('click', () => { if (viewerIndex < scannedPages.length - 1) { viewerIndex++; updateView(); } });

        el('newScanBtn').addEventListener('click', () => {
            if(scannedPages.length > 0 && !confirm("Discard these pages and start a new scan?")) return;
            scannedPages = []; viewerIndex = 0; updateUI();
            el('viewerView').classList.add('hide'); el('cameraView').classList.remove('hide');
            el('docTitleInput').value = ''; showToast("Ready for a new document", "success");
        });

        async function buildPDF() {
            if (scannedPages.length === 0) throw new Error("No pages");
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'in', format: 'letter' });
            
            for (let i = 0; i < scannedPages.length; i++) {
                if (i > 0) doc.addPage();
                const imgProps = doc.getImageProperties(scannedPages[i]);
                const pdfWidth = doc.internal.pageSize.getWidth(); const pdfHeight = doc.internal.pageSize.getHeight();
                let imgWidth = pdfWidth; let imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                if (imgHeight > pdfHeight) { imgHeight = pdfHeight; imgWidth = (imgProps.width * pdfHeight) / imgProps.height; }
                const x = (pdfWidth - imgWidth) / 2; const y = (pdfHeight - imgHeight) / 2;
                doc.addImage(scannedPages[i], 'JPEG', x, y, imgWidth, imgHeight);
            }
            return doc;
        }

        el('exportPdfBtn').addEventListener('click', async () => {
            if(scannedPages.length === 0) return;
            showToast("Generating PDF...", "info");
            try { const doc = await buildPDF(); doc.save(`DocuScan_${new Date().getTime()}.pdf`); showToast("PDF Downloaded!", "success"); } 
            catch(e) { showToast("PDF Error", "error"); console.error(e); }
        });

        el('exportJpgBtn').addEventListener('click', () => {
            if(scannedPages.length === 0) return;
            const link = document.createElement('a'); link.download = `Page_${viewerIndex + 1}.jpg`; link.href = scannedPages[viewerIndex];
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            showToast("Image Downloaded!", "success");
        });

        // ==========================================
        // DRIVE UPLOAD LOGIC
        // ==========================================
        el('triggerDriveBtn').addEventListener('click', () => { if(scannedPages.length === 0) return; el('saveModal').classList.remove('hide'); });
        el('cancelSaveBtn').addEventListener('click', () => el('saveModal').classList.add('hide'));

        el('confirmSaveBtn').addEventListener('click', async () => {
            if (!GOOGLE_APPS_SCRIPT_URL.includes("script.google.com")) return alert("Please add your Apps Script URL to test Drive features.");
            const title = el('docTitleInput').value.trim() || 'Untitled Scan'; const format = el('formatSelect').value;
            el('saveModal').classList.add('hide'); showToast("Preparing file...", "info");
            
            let payload = { action: 'save', username: currentUser, password: currentPassword, title: title, format: format };
            try {
                if (format === 'pdf') { const doc = await buildPDF(); payload.file = doc.output('datauristring'); } 
                else { payload.pages = scannedPages; }
                
                showToast("Uploading to Drive...", "info");
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
                const result = await response.json();
                
                if (result.success) showToast("Uploaded successfully!", "success");
                else throw new Error(result.error);
            } catch (err) { console.error(err); showToast("Upload failed.", "error"); }
        });

        // ==========================================
        // MY FILES VIEWER LOGIC
        // ==========================================
        el('viewDriveBtn').addEventListener('click', async () => {
            if (!GOOGLE_APPS_SCRIPT_URL.includes("script.google.com")) return alert("Please add your Apps Script URL.");
            const container = el('filesListContainer'); el('filesModal').classList.remove('hide');
            container.innerHTML = '<div class="text-center text-gray-400 py-12"><i class="ph ph-spinner animate-spin text-3xl mb-3 text-blue-500"></i><br>Fetching your files...</div>';

            try {
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'list_files', username: currentUser, password: currentPassword }) });
                const result = await response.json();
                
                if (result.success) {
                    if (result.files.length === 0) container.innerHTML = '<div class="text-center text-gray-400 py-10">No files found.</div>';
                    else {
                        container.innerHTML = result.files.map(f => `
                            <a href="${f.url}" target="_blank" class="flex items-center gap-4 p-3 bg-gray-900 rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 mb-2 no-underline text-white">
                                <div class="${f.type === 'folder' ? 'text-yellow-400' : 'text-red-400'} text-3xl"><i class="ph ${f.type === 'folder' ? 'ph-folder' : 'ph-file-pdf'}"></i></div>
                                <div class="flex-1 overflow-hidden">
                                    <div class="text-sm font-semibold truncate">${f.name}</div>
                                    <div class="text-xs text-gray-400 mt-1">${new Date(f.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <i class="ph ph-arrow-square-out text-gray-400 text-lg"></i>
                            </a>
                        `).join('');
                    }
                } else throw new Error(result.error);
            } catch (err) { container.innerHTML = '<div class="text-center text-red-400 py-10">Failed to load files.</div>'; }
        });

        el('closeFilesBtn').addEventListener('click', () => el('filesModal').classList.add('hide'));

    </script>
</body>
</html>

