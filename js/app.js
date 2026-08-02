/**
 * ==============================================================================
 * WebE-Book Application - Client Core JavaScript (app.js)
 * ==============================================================================
 * 
 * ระบบแสดงผล ค้นหา หมวดหมู่ และ 3D Interactive PDF Flipbook Reader
 * พร้อมระบบ High-Performance Dynamic Batch Rendering รองรับ PDF 300+ หน้าไม่กิน RAM
 */

// Initial State & Configuration
const CONFIG = {
  DEFAULT_API_URL: 'https://script.google.com/macros/s/AKfycbwB2cmP9p1J_r6gshIkhfGucZeTnXPrRdKGgGrfqQbEWT5a_OA2TytI-T0sRJBeqasbpw/exec', // วาง Google Apps Script Web App URL ของคุณที่นี่เพื่อเป็นค่าเริ่มต้นให้ทุกอุปกรณ์
  API_URL_KEY: 'webebook_api_url',
  THEME_KEY: 'webebook_theme',
  ADMIN_PIN_KEY: 'webebook_admin_pin',
  DEFAULT_PIN: '1234',
  INITIAL_RENDER_PAGES: 20 // จำนวนหน้าแรกที่ประมวลผลทันทีสำหรับหนังสือเล่มใหญ่
};

// Setup PDF.js Worker
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Data Store (Live DB Mode)
let state = {
  books: [],
  filteredBooks: [],
  categories: ['ทั้งหมด'],
  activeCategory: 'ทั้งหมด',
  searchQuery: '',
  sortBy: 'latest',
  apiUrl: localStorage.getItem(CONFIG.API_URL_KEY) || CONFIG.DEFAULT_API_URL || '',
  currentBook: null,
  isLoading: false,
  pageFlipInstance: null,
  isFlipbookMode: true,
  totalPages: 1,
  currentPage: 1,
  pdfDocInstance: null,
  renderedPageSet: new Set()
};

// DOM Element Selectors
const elements = {
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  categoryChips: document.getElementById('categoryChips'),
  booksGrid: document.getElementById('booksGrid'),
  totalBooksCount: document.getElementById('totalBooksCount'),
  totalViewsCount: document.getElementById('totalViewsCount'),
  totalCategoriesCount: document.getElementById('totalCategoriesCount'),

  // PDF Reader Flipbook Modal
  pdfModal: document.getElementById('pdfModal'),
  pdfModalContent: document.getElementById('pdfModalContent'),
  pdfModalTitle: document.getElementById('pdfModalTitle'),
  pdfIframe: document.getElementById('pdfIframe'),
  flipbookStage: document.getElementById('flipbookStage'),
  flipbookBook: document.getElementById('flipbookBook'),
  pdfLoadingProgress: document.getElementById('pdfLoadingProgress'),
  pdfLoadingStatusText: document.getElementById('pdfLoadingStatusText'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageJumpInput: document.getElementById('pageJumpInput'),
  totalPagesText: document.getElementById('totalPagesText'),
  fullscreenFlipbookBtn: document.getElementById('fullscreenFlipbookBtn'),
  toggleViewerModeBtn: document.getElementById('toggleViewerModeBtn'),
  viewerModeText: document.getElementById('viewerModeText'),
  pdfOpenExternalBtn: document.getElementById('pdfOpenExternalBtn'),
  pdfDownloadBtn: document.getElementById('pdfDownloadBtn'),
  closePdfModalBtn: document.getElementById('closePdfModalBtn'),

  // Detail Modal
  detailModal: document.getElementById('detailModal'),
  closeDetailModalBtn: document.getElementById('closeDetailModalBtn'),
  detailCover: document.getElementById('detailCover'),
  detailTitle: document.getElementById('detailTitle'),
  detailAuthor: document.getElementById('detailAuthor'),
  detailCategory: document.getElementById('detailCategory'),
  detailDate: document.getElementById('detailDate'),
  detailViews: document.getElementById('detailViews'),
  detailDesc: document.getElementById('detailDesc'),
  detailReadBtn: document.getElementById('detailReadBtn'),

  // Status Badge
  apiStatusBadge: document.getElementById('apiStatusBadge')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initEventListeners();
  loadBooksData();
});

/**
 * จัดการ Theme (Light/Dark)
 */
function initTheme() {
  const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(CONFIG.THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  if (!elements.themeToggleBtn) return;
  const icon = elements.themeToggleBtn.querySelector('i');
  if (icon) {
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }
}

/**
 * Event Listeners Registration
 */
function initEventListeners() {
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  if (elements.sortSelect) {
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFilters();
    });
  }

  // Modals Close
  if (elements.closePdfModalBtn) {
    elements.closePdfModalBtn.addEventListener('click', closePdfModal);
  }
  if (elements.closeDetailModalBtn) {
    elements.closeDetailModalBtn.addEventListener('click', closeDetailModal);
  }

  // Flipbook Page Controls
  if (elements.prevPageBtn) {
    elements.prevPageBtn.addEventListener('click', () => {
      const targetPage = Math.max(1, state.currentPage - 1);
      jumpToPage(targetPage);
    });
  }
  if (elements.nextPageBtn) {
    elements.nextPageBtn.addEventListener('click', () => {
      const targetPage = Math.min(state.totalPages, state.currentPage + 1);
      jumpToPage(targetPage);
    });
  }

  // Page Jump Input
  if (elements.pageJumpInput) {
    elements.pageJumpInput.addEventListener('change', handlePageJumpInput);
    elements.pageJumpInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') handlePageJumpInput();
    });
  }

  // Fullscreen Toggle Button
  if (elements.fullscreenFlipbookBtn) {
    elements.fullscreenFlipbookBtn.addEventListener('click', toggleFullscreen);
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // Mode Switcher
  if (elements.toggleViewerModeBtn) {
    elements.toggleViewerModeBtn.addEventListener('click', toggleViewerMode);
  }

  // Window Backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === elements.pdfModal) closePdfModal();
    if (e.target === elements.detailModal) closeDetailModal();
  });
}

/**
 * โหลดข้อมูล E-Book จาก Google Apps Script API
 */
async function loadBooksData() {
  state.isLoading = true;
  renderSkeletonLoader();

  if (state.apiUrl) {
    try {
      updateApiStatus('connecting', 'กำลังดึงข้อมูลจาก Google Sheets...');
      const response = await fetch(state.apiUrl + '?action=list');
      const text = await response.text();

      // ตรวจสอบว่าคำตอบที่ได้เป็น HTML (เช่น Google Login Page เนื่องจากยังไม่ได้ตั้งสิทธิ์เป็น Anyone)
      if (text.trim().startsWith('<')) {
        throw new Error('Google Apps Script ส่งกลับเป็นหน้า HTML (โปรดตั้งสิทธิ์ Web App เป็น "Anyone / ทุกคน")');
      }

      const result = JSON.parse(text);

      if (result.success && Array.isArray(result.data)) {
        state.books = result.data;
        updateApiStatus('connected', `Google Sheets API (${state.books.length} เล่ม)`);
      } else {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลได้');
      }
    } catch (error) {
      console.error('API Connection error:', error);
      state.books = [];
      updateApiStatus('demo', error.message || 'ไม่สามารถเชื่อมต่อ Google Sheets API ได้');
    }
  } else {
    state.books = [];
    updateApiStatus('demo', 'ยังไม่ได้ตั้งค่า Google Apps Script Web App URL');
  }

  state.isLoading = false;
  extractCategories();
  applyFilters();
  updateStats();
}

/**
 * สถานะการเชื่อมต่อ API บน Header
 */
function updateApiStatus(status, text) {
  if (!elements.apiStatusBadge) return;

  let icon = 'fas fa-times-circle';
  let badgeClass = 'badge-disconnected';
  let titleText = text || 'ไม่สามารถเชื่อมต่อ Google Sheets API ได้';

  if (status === 'connected') {
    badgeClass = 'badge-connected';
    icon = 'fas fa-check-circle';
    titleText = text || 'เชื่อมต่อ Google Sheets API เรียบร้อยแล้ว';
  } else if (status === 'connecting') {
    badgeClass = 'badge-connecting';
    icon = 'fas fa-spinner fa-spin';
    titleText = text || 'กำลังตรวจสอบการเชื่อมต่อ API...';
  }

  elements.apiStatusBadge.className = `api-status-badge ${badgeClass}`;
  elements.apiStatusBadge.title = titleText;
  elements.apiStatusBadge.innerHTML = `<i class="${icon}"></i>`;
}

/**
 * ดึงหมวดหมู่ทั้งหมด
 */
function extractCategories() {
  const cats = new Set();
  cats.add('ทั้งหมด');

  state.books.forEach(book => {
    if (book.category) cats.add(book.category.trim());
  });

  state.categories = Array.from(cats);
  renderCategoryChips();
}

function renderCategoryChips() {
  if (!elements.categoryChips) return;
  elements.categoryChips.innerHTML = '';

  state.categories.forEach(cat => {
    const count = cat === 'ทั้งหมด'
      ? state.books.length
      : state.books.filter(b => b.category === cat).length;

    const chip = document.createElement('button');
    chip.className = `chip ${state.activeCategory === cat ? 'active' : ''}`;
    chip.innerHTML = `${cat} <span class="chip-count">${count}</span>`;

    chip.addEventListener('click', () => {
      state.activeCategory = cat;
      renderCategoryChips();
      applyFilters();
    });

    elements.categoryChips.appendChild(chip);
  });
}

function applyFilters() {
  let filtered = [...state.books];

  if (state.activeCategory !== 'ทั้งหมด') {
    filtered = filtered.filter(b => b.category === state.activeCategory);
  }

  if (state.searchQuery) {
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(state.searchQuery) ||
      b.author.toLowerCase().includes(state.searchQuery) ||
      b.description.toLowerCase().includes(state.searchQuery)
    );
  }

  if (state.sortBy === 'latest') {
    filtered.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
  } else if (state.sortBy === 'popular') {
    filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  } else if (state.sortBy === 'title') {
    filtered.sort((a, b) => a.title.localeCompare(b.title, 'th'));
  }

  state.filteredBooks = filtered;
  renderBooksGrid();
}

/**
 * Render รายการ E-Book Cards
 */
function renderBooksGrid() {
  if (!elements.booksGrid) return;
  elements.booksGrid.innerHTML = '';

  if (state.filteredBooks.length === 0) {
    const noApiHint = !state.apiUrl ? '<br><small style="color: var(--brand-primary); font-weight: 500;">กดที่ปุ่ม "แผงแอดมิน" -> "ตั้งค่า API" เพื่อใส่ Google Apps Script Web App URL</small>' : '';
    elements.booksGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-book-open"></i></div>
        <div class="empty-title">ยังไม่มีรายการ E-Book ในคลังหนังสือ</div>
        <p style="color: var(--text-muted);">เริ่มต้นอัพโหลดไฟล์ PDF ผ่านแผงแอดมิน หรือเชื่อมต่อ Google Sheet Backend${noApiHint}</p>
      </div>
    `;
    return;
  }

  state.filteredBooks.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';

    const coverUrl = book.coverUrl || getFallbackCoverSvg(book.title, book.category);

    card.innerHTML = `
      <div class="book-cover-wrap" style="cursor: pointer;" title="คลิกที่รูปปกเพื่อเปิดอ่าน 3D Flipbook ทันที">
        <img src="${coverUrl}" alt="${book.title}" class="book-cover-img" loading="lazy" onerror="this.src='${getFallbackCoverSvg(book.title, book.category)}'">
        <span class="book-badge-category">${book.category || 'ทั่วไป'}</span>
        <span class="book-badge-views"><i class="fas fa-eye"></i> ${book.viewCount || 0}</span>
      </div>
      <div class="book-details">
        <h3 class="book-title" title="${book.title}">${book.title}</h3>
        <div class="book-author"><i class="fas fa-building"></i> ${book.author || 'สำนักปลัด'}</div>
        <p class="book-desc-short">${book.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
        <div class="book-actions">
          <button class="btn btn-secondary btn-detail-trigger" data-id="${book.id}">
            <i class="fas fa-info-circle"></i> รายละเอียด
          </button>
          <button class="btn btn-primary btn-read-trigger" data-id="${book.id}">
            <i class="fas fa-book-open"></i> อ่าน Flipbook
          </button>
        </div>
      </div>
    `;

    card.querySelector('.book-cover-wrap').addEventListener('click', () => openPdfReader(book));
    card.querySelector('.btn-detail-trigger').addEventListener('click', () => openDetailModal(book));
    card.querySelector('.btn-read-trigger').addEventListener('click', () => openPdfReader(book));

    elements.booksGrid.appendChild(card);
  });
}

function renderSkeletonLoader() {
  if (!elements.booksGrid) return;
  elements.booksGrid.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const skel = document.createElement('div');
    skel.className = 'book-card';
    skel.innerHTML = `
      <div class="book-cover-wrap" style="background: var(--border-color); animation: pulse 1.5s infinite;"></div>
      <div class="book-details" style="gap: 10px;">
        <div style="height: 20px; background: var(--border-color); border-radius: 4px;"></div>
        <div style="height: 14px; width: 60%; background: var(--border-color); border-radius: 4px;"></div>
      </div>
    `;
    elements.booksGrid.appendChild(skel);
  }
}

function updateStats() {
  if (elements.totalBooksCount) elements.totalBooksCount.textContent = state.books.length;
  if (elements.totalViewsCount) {
    const totalViews = state.books.reduce((acc, b) => acc + (Number(b.viewCount) || 0), 0);
    elements.totalViewsCount.textContent = totalViews.toLocaleString();
  }
  if (elements.totalCategoriesCount) {
    elements.totalCategoriesCount.textContent = state.categories.length > 0 ? state.categories.length - 1 : 0;
  }
}

/**
 * แปลง Base64 เป็น Uint8Array
 */
function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * ==============================================================================
 * DYNAMIC BATCH 3D FLIPBOOK ENGINE (MEM-SAFE FOR 300+ PAGE PDFS)
 * ==============================================================================
 */
async function openPdfReader(book) {
  state.currentBook = book;
  state.currentPage = 1;
  state.totalPages = 1;
  state.pdfDocInstance = null;
  state.renderedPageSet.clear();

  elements.pdfModalTitle.textContent = book.title;

  elements.pdfOpenExternalBtn.href = book.pdfDriveUrl || '#';
  elements.pdfDownloadBtn.href = book.pdfDriveUrl || '#';

  elements.pdfIframe.src = 'about:blank';
  elements.pdfModal.classList.add('active');
  incrementViewCount(book.id);

  state.isFlipbookMode = true;
  updateViewerLayoutMode();
  await loadPdfFlipbookDynamicBatch(book);
}

function getDriveEmbedUrl(url) {
  if (!url) return '';
  let embedUrl = url;
  if (embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
    embedUrl = embedUrl.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
  }
  return embedUrl;
}

/**
 * ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
 */
function isMobileDevice() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * โหลดและสร้าง 3D Flipbook ด้วยระบบ Dynamic Batch Rendering รองรับ PDF ใหญ่ 300+ หน้า
 */
async function loadPdfFlipbookDynamicBatch(book) {
  showPdfLoading('กำลังเตรียมเปิด 3D Flipbook...');
  destroyPageFlip();

  const fileId = extractGoogleDriveFileId(book.pdfDriveUrl || book.pdfEmbedUrl);
  console.log(`[Batch Engine] Loading book: "${book.title}", File ID: ${fileId}`);

  let pdfDoc = null;

  // 1. ดึงไฟล์ PDF ผ่าน Google Apps Script API (ช่องทางหลักที่เสถียรที่สุด 100%)
  if (state.apiUrl && fileId) {
    showPdfLoading('กำลังดาวน์โหลดไฟล์ PDF จาก Google Drive...');
    try {
      const res = await fetch(`${state.apiUrl}?action=getPdf&fileId=${fileId}`);
      const text = await res.text();

      if (!text.trim().startsWith('<')) {
        const json = JSON.parse(text);
        if (json.success && json.base64) {
          showPdfLoading('กำลังประมวลผล 3D Flipbook...');
          const uint8Bytes = base64ToUint8Array(json.base64);

          const loadingTask = pdfjsLib.getDocument({
            data: uint8Bytes,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
            verbosity: 0,
            stopAtErrors: false
          });

          pdfDoc = await loadingTask.promise;
          state.pdfDocInstance = pdfDoc;
          console.log(`[Batch Engine] PDF parsed successfully via Apps Script API (${pdfDoc.numPages} pages)`);
        }
      }
    } catch (apiErr) {
      console.warn('[Batch Engine] Apps Script API fetch error:', apiErr);
    }
  }

  // 2. สำรอง: หาก Apps Script ดึงไม่ได้ (เช่น ไฟล์ใหญ่เกินโควต้า GAS) -> ลองดึง ArrayBuffer ตรงจาก Google Drive Stream
  if (!pdfDoc && fileId) {
    showPdfLoading('กำลังสตรีมไฟล์ตรงจาก Google Drive...');
    const directUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
    try {
      const res = await fetch(directUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        // ตรวจสอบว่าหัวไฟล์คือ PDF (%PDF-) ก่อนส่งให้ PDF.js ป้องกัน InvalidPDFException เหลืองใน Console
        if (bytes.length > 1000 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
          const loadingTask = pdfjsLib.getDocument({
            data: bytes,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
            verbosity: 0,
            stopAtErrors: false
          });
          pdfDoc = await loadingTask.promise;
          state.pdfDocInstance = pdfDoc;
          console.log(`[Batch Engine] PDF parsed via Direct Stream (${pdfDoc.numPages} pages)`);
        }
      }
    } catch (streamErr) {
      console.warn('[Batch Engine] Direct stream fetch error:', streamErr);
    }
  }

  // 3. สำรอง 2: ให้ PDF.js สตรีมผ่าน URL ตรง
  if (!pdfDoc && fileId) {
    try {
      showPdfLoading('กำลังสตรีมผ่าน PDF Engine...');
      const loadingTask = pdfjsLib.getDocument({
        url: `https://lh3.googleusercontent.com/d/${fileId}`,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
        verbosity: 0,
        stopAtErrors: false
      });
      pdfDoc = await loadingTask.promise;
      state.pdfDocInstance = pdfDoc;
      console.log(`[Batch Engine] PDF parsed via PDF.js URL stream (${pdfDoc.numPages} pages)`);
    } catch (urlErr) {
      console.warn('[Batch Engine] PDF.js URL stream error:', urlErr);
    }
  }

  // Fallback เข้าสู่ Drive Viewer เฉพาะกรณีไม่สามารถดึงโครงสร้าง PDF ได้จากทุกช่องทาง
  if (!pdfDoc) {
    console.warn('[Batch Engine] Cannot read PDF structure, switching to Drive Viewer mode');
    switchToIframeMode('ไม่สามารถสร้าง 3D Flipbook ได้ สลับเข้าสู่โหมด Google Drive Viewer');
    return;
  }

  // RENDER INITIAL BATCH OF 20 PAGES IMMEDIATELY FOR ULTRA-FAST START
  try {
    showPdfLoading('กำลังเปิด 3D Flipbook...');
    const totalPages = pdfDoc.numPages;
    const isMobile = isMobileDevice();

    state.totalPages = totalPages;
    elements.totalPagesText.textContent = totalPages;
    elements.pageJumpInput.max = totalPages;
    elements.pageJumpInput.value = 1;

    elements.flipbookBook.innerHTML = '';

    // โครงร่าง DOM Page Element ขาวล้วน (ตั้งค่าหน้า 1 เป็น Front Cover หน้าเดี่ยวตรงกลาง)
    const totalElementsCount = (totalPages % 2 !== 0) ? totalPages + 1 : totalPages;
    for (let p = 1; p <= totalElementsCount; p++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'my-page';
      pageDiv.id = `myPage_${p}`;
      
      // ตั้งค่าหน้าปก (หน้า 1) และปกหลังให้เป็น Hard Cover เพื่อแสดงผลเป็นหน้าเดี่ยวตรงกลางเมื่อเริ่มเปิดหนังสือ
      if (p === 1 || p === totalElementsCount) {
        pageDiv.setAttribute('data-density', 'hard');
      }

      pageDiv.innerHTML = '<div style="width:100%; height:100%; background:#ffffff;"></div>';
      elements.flipbookBook.appendChild(pageDiv);
    }

    // เรนเดอร์เฉพาะ 20 หน้าแรกทันที เพื่อให้เปิดได้อย่างรวดเร็วที่สุด
    const initialLimit = Math.min(totalPages, CONFIG.INITIAL_RENDER_PAGES);
    for (let pageNum = 1; pageNum <= initialLimit; pageNum++) {
      showPdfLoading(`กำลังประมวลผลหน้า 3D Flipbook ${pageNum} / ${initialLimit}...`);
      await renderPdfPageToElement(pdfDoc, pageNum);
    }

    // ซ่อนหน้าจอโหลดทันทีหลัง 20 หน้าแรกเสร็จ
    await new Promise(resolve => setTimeout(resolve, 100));
    hidePdfLoading();

    // เริ่มสร้าง 3D PageFlip Engine พร้อมปรับขนาดและเงาสร้างมิติ 3 มิติสมจริง
    if (window.St && window.St.PageFlip) {
      const pageFlip = new St.PageFlip(elements.flipbookBook, {
        width: isMobile ? 320 : 440,
        height: isMobile ? 460 : 600,
        size: 'stretch',
        minWidth: 260,
        maxWidth: 1000,
        minHeight: 380,
        maxHeight: 800,
        drawShadow: true, // เปิดระบบเงา 3 มิติขณะพลิกหน้า
        maxShadowOpacity: 0.45, // ปรับความเข้มของเงาการพับหน้ากระดาษให้มีมิติสวยงามสมจริง
        showCover: true, // แสดงหน้าปกแบบหน้าเดี่ยวตรงกลางเมื่อเริ่มเปิด
        usePortrait: isMobile, // บนมือถือแสดงหน้าเดียว (Portrait) / บนคอมพิวเตอร์แสดง 2 หน้าคู่ (Spread)
        mobileScrollSupport: false,
        flippingTime: 700 // ระยะเวลาในการพลิกหน้ากระดาษให้นุ่มนวล
      });

      pageFlip.loadFromHTML(elements.flipbookBook.querySelectorAll('.my-page'));
      state.pageFlipInstance = pageFlip;

      // กำหนดสถานะตั้งต้นให้เป็นหน้า 1 (หน้าปกตรงกลางสำหรับ Desktop)
      elements.flipbookBook.setAttribute('data-current-page', '1');

      // Event ติดตามการเปิดพลิกหน้า
      pageFlip.on('flip', (e) => {
        const current = e.data + 1;
        state.currentPage = current;
        elements.pageJumpInput.value = current;
        elements.flipbookBook.setAttribute('data-current-page', String(current));

        // 1. ทยอยประมวลผลหน้าที่อยู่รอบข้างเข้าใกล้
        ensurePagesRenderedAround(current);

        // 2. คืนหน่วยความจำ Canvas หน้าที่อยู่ไกลออกไปบนมือถือ (Memory Recycling)
        cleanupFarPages(current);
      });
    }

    // ทยอยประมวลผลหน้าที่เหลือในฉากหลังอย่างนุ่มนวล ไม่ดึง CPU มือถือให้หน่วง
    backgroundRenderRemainingPages(pdfDoc, initialLimit + 1, totalPages);

  } catch (renderErr) {
    console.error('Batch render exception:', renderErr);
    switchToIframeMode('เกิดข้อผิดพลาดในการเปิดหนังสือ สลับเข้าสู่โหมด Drive Viewer');
  }
}

/**
 * วาดหน้า PDF แบบระบุตำแหน่งลงใน DOM Element
 */
async function renderPdfPageToElement(pdfDoc, pageNum) {
  if (state.renderedPageSet.has(pageNum)) return;

  const pageDiv = document.getElementById(`myPage_${pageNum}`);
  if (!pageDiv) return;

  try {
    const page = await pdfDoc.getPage(pageNum);
    // บนมือถือใช้ scale 1.0 เพื่อลดขนาด Canvas RAM ลง 50% / คอมพิวเตอร์ใช้ 1.35
    const scale = isMobileDevice() ? 1.0 : 1.35;
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement('canvas');
    canvas.className = 'page-canvas';
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;

    pageDiv.innerHTML = '';
    pageDiv.appendChild(canvas);
    state.renderedPageSet.add(pageNum);

  } catch (pageErr) {
    console.warn(`[Batch Engine] Render page ${pageNum} warning:`, pageErr);
    pageDiv.innerHTML = '<div style="width:100%; height:100%; background:#ffffff;"></div>';
    state.renderedPageSet.add(pageNum);
  }
}

/**
 * คืนหน่วยความจำ Canvas ของหน้าที่อยู่ไกลเกินไปบนมือถือ (Mobile Memory Recycling)
 * ช่วยป้องกันปัญหามือถือหน่วง RAM เต็ม หรือการหลุดจากโหมด 3D Flipbook
 */
function cleanupFarPages(currentPage) {
  if (!isMobileDevice() || state.renderedPageSet.size < 16) return;

  const maxDistance = 8; // ระยะห่างสูงสุดที่อนุญาตให้เก็บ Canvas ไว้ใน RAM มือถือ
  for (const pageNum of Array.from(state.renderedPageSet)) {
    if (Math.abs(pageNum - currentPage) > maxDistance) {
      const pageDiv = document.getElementById(`myPage_${pageNum}`);
      if (pageDiv) {
        pageDiv.innerHTML = '<div style="width:100%; height:100%; background:#ffffff;"></div>';
      }
      state.renderedPageSet.delete(pageNum);
    }
  }
}

/**
 * วาดหน้าที่อยู่รอบๆ หน้าปัจจุบันหากผู้ใช้พลิกไปถึง
 */
async function ensurePagesRenderedAround(currentPage) {
  if (!state.pdfDocInstance) return;
  const isMobile = isMobileDevice();
  const start = Math.max(1, currentPage - (isMobile ? 2 : 4));
  const end = Math.min(state.totalPages, currentPage + (isMobile ? 5 : 10));

  for (let p = start; p <= end; p++) {
    if (!state.renderedPageSet.has(p)) {
      await renderPdfPageToElement(state.pdfDocInstance, p);
    }
  }
}

/**
 * วาดหน้าที่เหลือทั้งหมดทีละหน้าอย่างเงียบๆ ในฉากหลัง
 * บนมือถือใช้การเว้นระยะเวลานุ่มนวล (Idle Throttle) ไม่ดึง CPU หรือทำให้เครื่องหน่วง
 */
async function backgroundRenderRemainingPages(pdfDoc, startPage, totalPages) {
  const isMobile = isMobileDevice();
  const delayMs = isMobile ? 250 : 50; // บนมือถือเว้นระยะ 250ms เพื่อไม่ให้ CPU ร้อนและไม่กิน RAM

  for (let p = startPage; p <= totalPages; p++) {
    if (!elements.pdfModal || !elements.pdfModal.classList.contains('active')) break;
    if (!state.renderedPageSet.has(p)) {
      await renderPdfPageToElement(pdfDoc, p);
      if (isMobile) cleanupFarPages(state.currentPage);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

/**
 * ค้นหาและเปลี่ยนไปยังหน้าที่ต้องการ (รองรับทั้งโหมด 3D Flipbook และ Drive Viewer 100%)
 */
async function handlePageJumpInput() {
  let targetPage = parseInt(elements.pageJumpInput.value, 10);
  if (isNaN(targetPage) || targetPage < 1) targetPage = 1;
  if (state.totalPages && targetPage > state.totalPages) targetPage = state.totalPages;

  elements.pageJumpInput.value = targetPage;
  await jumpToPage(targetPage);
}

async function jumpToPage(pageNum) {
  state.currentPage = pageNum;
  elements.pageJumpInput.value = pageNum;

  if (state.isFlipbookMode) {
    if (state.pdfDocInstance) {
      await ensurePagesRenderedAround(pageNum);
    }

    if (state.pageFlipInstance) {
      try {
        state.pageFlipInstance.flip(pageNum - 1);
      } catch (e) {
        console.warn('Page flip jump error:', e);
      }
    }
  } else {
    if (state.currentBook) {
      const baseEmbedUrl = getDriveEmbedUrl(state.currentBook.pdfEmbedUrl || state.currentBook.pdfDriveUrl || '');
      if (baseEmbedUrl) {
        const pageUrl = `${baseEmbedUrl}?page=${pageNum}#page=${pageNum}`;
        elements.pdfIframe.src = pageUrl;
        showToast(`เปลี่ยนไปยังหน้า ${pageNum}`, 'info');
      }
    }
  }
}

/**
 * ระบบอ่านแบบเต็มหน้าจอ (Fullscreen Mode Toggle)
 */
function toggleFullscreen() {
  const container = elements.pdfModalContent;

  if (!document.fullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function handleFullscreenChange() {
  const isFS = !!document.fullscreenElement;
  const icon = elements.fullscreenFlipbookBtn.querySelector('i');

  if (isFS) {
    elements.pdfModalContent.classList.add('is-fullscreen');
    if (icon) icon.className = 'fas fa-compress';
  } else {
    elements.pdfModalContent.classList.remove('is-fullscreen');
    if (icon) icon.className = 'fas fa-expand';
  }
}

function destroyPageFlip() {
  if (state.pageFlipInstance) {
    try {
      state.pageFlipInstance.destroy();
    } catch (e) { }
    state.pageFlipInstance = null;
  }
  state.pdfDocInstance = null;
  state.renderedPageSet.clear();

  // สร้างอ็อบเจกต์ #flipbookBook ใหม่บริสุทธิ์ใน DOM เพื่อล้างค่าสถานะและ Event Handlers ค้างของ StPageFlip ทั้งหมด
  if (elements.flipbookStage) {
    elements.flipbookStage.innerHTML = '<div id="flipbookBook" class="flipbook-book"></div>';
    elements.flipbookBook = document.getElementById('flipbookBook');
  }
}

function showPdfLoading(text) {
  elements.pdfLoadingProgress.style.display = 'flex';
  elements.pdfLoadingStatusText.textContent = text;
}

function hidePdfLoading() {
  elements.pdfLoadingProgress.style.display = 'none';
}

function switchToIframeMode(reasonText) {
  hidePdfLoading();
  state.isFlipbookMode = false;

  if (state.currentBook) {
    let embedUrl = getDriveEmbedUrl(state.currentBook.pdfEmbedUrl || state.currentBook.pdfDriveUrl || '');
    if (state.currentPage > 1) {
      embedUrl = `${embedUrl}?page=${state.currentPage}#page=${state.currentPage}`;
    }
    elements.pdfIframe.src = embedUrl;
  }

  updateViewerLayoutMode();
  showToast(reasonText, 'info');
}

function toggleViewerMode() {
  state.isFlipbookMode = !state.isFlipbookMode;

  if (!state.isFlipbookMode && state.currentBook) {
    let embedUrl = getDriveEmbedUrl(state.currentBook.pdfEmbedUrl || state.currentBook.pdfDriveUrl || '');
    if (state.currentPage > 1) {
      embedUrl = `${embedUrl}?page=${state.currentPage}#page=${state.currentPage}`;
    }
    elements.pdfIframe.src = embedUrl;
  }

  updateViewerLayoutMode();
}

function updateViewerLayoutMode() {
  if (state.isFlipbookMode) {
    elements.flipbookStage.style.display = 'flex';
    elements.pdfIframe.style.display = 'none';
    elements.viewerModeText.textContent = 'โหมด Flipbook';
  } else {
    elements.flipbookStage.style.display = 'none';
    elements.pdfIframe.style.display = 'block';
    elements.viewerModeText.textContent = 'โหมด Drive Viewer';
  }
}

function closePdfModal() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => { });
  }
  elements.pdfModal.classList.remove('active');
  destroyPageFlip();
  elements.pdfIframe.src = 'about:blank';
}

/**
 * ดึง File ID จาก Google Drive URL ทุกรูปแบบอย่างแม่นยำ 100%
 */
function extractGoogleDriveFileId(url) {
  if (!url) return null;
  const cleanUrl = decodeURIComponent(url.trim());

  // 1. กรณีผู้ใช้ใส่ File ID โดยตรง (ข้อความตัวอักษรและตัวเลขความยาว 20-60 ตัว)
  if (/^[a-zA-Z0-9_-]{20,60}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // 2. กรณีใส่ลิงก์ Google Drive รูปแบบต่างๆ
  const match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/id=([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/\/open\?id=([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/\/uc\?id=([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);

  return match ? match[1] : null;
}

/**
 * Detail Modal Handlers
 */
function openDetailModal(book) {
  state.currentBook = book;

  elements.detailCover.src = book.coverUrl || getFallbackCoverSvg(book.title, book.category);
  elements.detailCover.style.cursor = 'pointer';
  elements.detailCover.title = 'คลิกที่รูปปกเพื่อเปิดอ่าน 3D Flipbook ทันที';
  elements.detailCover.onclick = () => {
    closeDetailModal();
    openPdfReader(book);
  };

  elements.detailTitle.textContent = book.title;
  elements.detailAuthor.textContent = book.author || 'ไม่ระบุ';
  elements.detailCategory.textContent = book.category || 'ทั่วไป';
  elements.detailDate.textContent = book.dateAdded || '-';
  elements.detailViews.textContent = (book.viewCount || 0).toLocaleString();
  elements.detailDesc.textContent = book.description || 'ไม่มีรายละเอียดเพิ่มเติม';

  elements.detailReadBtn.onclick = () => {
    closeDetailModal();
    openPdfReader(book);
  };

  elements.detailModal.classList.add('active');
}

function closeDetailModal() {
  elements.detailModal.classList.remove('active');
}

async function incrementViewCount(bookId) {
  const book = state.books.find(b => b.id === bookId);
  if (book) {
    book.viewCount = (Number(book.viewCount) || 0) + 1;
    updateStats();
    applyFilters();
  }

  if (state.apiUrl) {
    fetch(`${state.apiUrl}?action=view&id=${bookId}`).catch(() => {});
  }
}

function getFallbackCoverSvg(title, category) {
  const shortTitle = (title || 'E-Book').substring(0, 30);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
      <rect width="100%" height="100%" fill="#15803d"/>
      <rect x="20" y="20" width="260" height="360" rx="10" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
      <circle cx="150" cy="120" r="40" fill="rgba(255,255,255,0.12)"/>
      <path d="M135 120 L165 120 M150 105 L150 135" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
      <text x="150" y="220" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">${shortTitle}</text>
      <text x="150" y="250" fill="#bbf7d0" font-family="sans-serif" font-size="14" text-anchor="middle">${category || 'E-Book'}</text>
      <text x="150" y="340" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="12" text-anchor="middle">เทศบาลตำบลตันหยงมัส</text>
    </svg>
  `;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}
