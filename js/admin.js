/**
 * ==============================================================================
 * WebE-Book Application - Admin Management JavaScript (admin.js)
 * ==============================================================================
 */

// Admin State
let adminState = {
  isLoggedIn: false,
  editingBookId: null,
  pdfFileBase64: null,
  pdfFileName: null,
  coverFileBase64: null,
  coverFileName: null,
  coverMimeType: null
};

// DOM Elements for Admin
const adminElements = {
  adminBtn: document.getElementById('adminBtn'),
  loginModal: document.getElementById('loginModal'),
  closeLoginModalBtn: document.getElementById('closeLoginModalBtn'),
  pinInput: document.getElementById('pinInput'),
  submitPinBtn: document.getElementById('submitPinBtn'),
  loginErrorMsg: document.getElementById('loginErrorMsg'),

  // Admin Dashboard Modal
  adminModal: document.getElementById('adminModal'),
  closeAdminModalBtn: document.getElementById('closeAdminModalBtn'),
  openAddBookBtn: document.getElementById('openAddBookBtn'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  openSetupGuideBtn: document.getElementById('openSetupGuideBtn'),
  adminBooksTableBody: document.getElementById('adminBooksTableBody'),

  // Add/Edit Book Modal
  bookFormModal: document.getElementById('bookFormModal'),
  closeBookFormModalBtn: document.getElementById('closeBookFormModalBtn'),
  bookFormTitleText: document.getElementById('bookFormTitleText'),
  bookForm: document.getElementById('bookForm'),
  inputTitle: document.getElementById('inputTitle'),
  inputAuthor: document.getElementById('inputAuthor'),
  inputCategory: document.getElementById('inputCategory'),
  inputDescription: document.getElementById('inputDescription'),
  inputPdfDriveUrl: document.getElementById('inputPdfDriveUrl'),
  inputCoverUrl: document.getElementById('inputCoverUrl'),
  pdfFileInput: document.getElementById('pdfFileInput'),
  pdfDropzone: document.getElementById('pdfDropzone'),
  pdfFileNameLabel: document.getElementById('pdfFileNameLabel'),
  coverFileInput: document.getElementById('coverFileInput'),
  coverDropzone: document.getElementById('coverDropzone'),
  coverFileNameLabel: document.getElementById('coverFileNameLabel'),
  saveBookBtn: document.getElementById('saveBookBtn'),

  // Settings Modal
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
  apiUrlInput: document.getElementById('apiUrlInput'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  testApiBtn: document.getElementById('testApiBtn'),

  // Guide Modal
  guideModal: document.getElementById('guideModal'),
  closeGuideModalBtn: document.getElementById('closeGuideModalBtn'),
  copyScriptBtn: document.getElementById('copyScriptBtn')
};

document.addEventListener('DOMContentLoaded', () => {
  initAdminEventListeners();
});

function initAdminEventListeners() {
  if (adminElements.adminBtn) {
    adminElements.adminBtn.addEventListener('click', () => {
      if (adminState.isLoggedIn) {
        openAdminDashboard();
      } else {
        openLoginModal();
      }
    });
  }

  if (adminElements.submitPinBtn) {
    adminElements.submitPinBtn.addEventListener('click', handleLoginSubmit);
  }
  if (adminElements.pinInput) {
    adminElements.pinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLoginSubmit();
    });
  }

  // Modals Close
  if (adminElements.closeLoginModalBtn) {
    adminElements.closeLoginModalBtn.addEventListener('click', () => closeModal(adminElements.loginModal));
  }
  if (adminElements.closeAdminModalBtn) {
    adminElements.closeAdminModalBtn.addEventListener('click', () => closeModal(adminElements.adminModal));
  }
  if (adminElements.closeBookFormModalBtn) {
    adminElements.closeBookFormModalBtn.addEventListener('click', () => closeModal(adminElements.bookFormModal));
  }
  if (adminElements.closeSettingsModalBtn) {
    adminElements.closeSettingsModalBtn.addEventListener('click', () => closeModal(adminElements.settingsModal));
  }
  if (adminElements.closeGuideModalBtn) {
    adminElements.closeGuideModalBtn.addEventListener('click', () => closeModal(adminElements.guideModal));
  }

  // Action Buttons
  if (adminElements.openAddBookBtn) {
    adminElements.openAddBookBtn.addEventListener('click', () => openBookFormModal());
  }
  if (adminElements.openSettingsBtn) {
    adminElements.openSettingsBtn.addEventListener('click', openSettingsModal);
  }
  if (adminElements.openSetupGuideBtn) {
    adminElements.openSetupGuideBtn.addEventListener('click', openGuideModal);
  }

  // PDF Dropzone
  if (adminElements.pdfDropzone && adminElements.pdfFileInput) {
    adminElements.pdfDropzone.addEventListener('click', () => adminElements.pdfFileInput.click());
    adminElements.pdfFileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0], 'pdf'));
  }

  // Cover Dropzone
  if (adminElements.coverDropzone && adminElements.coverFileInput) {
    adminElements.coverDropzone.addEventListener('click', () => adminElements.coverFileInput.click());
    adminElements.coverFileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0], 'cover'));
  }

  // Form Submit
  if (adminElements.bookForm) {
    adminElements.bookForm.addEventListener('submit', handleBookFormSubmit);
  }

  // Settings Save
  if (adminElements.saveSettingsBtn) {
    adminElements.saveSettingsBtn.addEventListener('click', saveSettings);
  }
  if (adminElements.testApiBtn) {
    adminElements.testApiBtn.addEventListener('click', testApiConnection);
  }

  // Copy Code.gs
  if (adminElements.copyScriptBtn) {
    adminElements.copyScriptBtn.addEventListener('click', copyAppsScriptCode);
  }
}

function openLoginModal() {
  adminElements.pinInput.value = '';
  adminElements.loginErrorMsg.style.display = 'none';
  openModal(adminElements.loginModal);
}

function handleLoginSubmit() {
  const pin = adminElements.pinInput.value.trim();
  const savedPin = localStorage.getItem(CONFIG.ADMIN_PIN_KEY) || CONFIG.DEFAULT_PIN;

  if (pin === savedPin) {
    adminState.isLoggedIn = true;
    closeModal(adminElements.loginModal);
    showToast('เข้าสู่ระบบแอดมินสำเร็จ', 'success');
    openAdminDashboard();
  } else {
    adminElements.loginErrorMsg.textContent = 'รหัส PIN ไม่ถูกต้อง';
    adminElements.loginErrorMsg.style.display = 'block';
  }
}

function openAdminDashboard() {
  renderAdminBooksTable();
  openModal(adminElements.adminModal);
}

function renderAdminBooksTable() {
  if (!adminElements.adminBooksTableBody) return;
  adminElements.adminBooksTableBody.innerHTML = '';

  if (state.books.length === 0) {
    adminElements.adminBooksTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
          ยังไม่มีรายการหนังสือในระบบ <br>
          <small style="color: var(--brand-primary);">กดที่ปุ่ม "+ เพิ่ม E-Book เล่มใหม่" ด้านบนเพื่อเริ่มอัพโหลดหนังสือเล่มแรก</small>
        </td>
      </tr>
    `;
    return;
  }

  state.books.forEach(book => {
    const tr = document.createElement('tr');
    const cover = book.coverUrl || getFallbackCoverSvg(book.title, book.category);

    tr.innerHTML = `
      <td><img src="${cover}" class="table-cover-thumb" alt="cover"></td>
      <td><strong>${book.title}</strong></td>
      <td>${book.category || 'ทั่วไป'}</td>
      <td>${book.author || 'ไม่ระบุ'}</td>
      <td>${book.viewCount || 0} ครั้ง</td>
      <td>
        <button class="btn btn-secondary btn-edit-book" data-id="${book.id}" style="padding: 4px 8px; font-size: 0.8rem;">
          <i class="fas fa-edit"></i> แก้ไข
        </button>
        <button class="btn btn-secondary btn-delete-book" data-id="${book.id}" style="padding: 4px 8px; font-size: 0.8rem; color: var(--accent-red); border-color: rgba(239, 68, 68, 0.3);">
          <i class="fas fa-trash"></i> ลบ
        </button>
      </td>
    `;

    tr.querySelector('.btn-edit-book').addEventListener('click', () => openBookFormModal(book));
    tr.querySelector('.btn-delete-book').addEventListener('click', () => handleDeleteBook(book.id));

    adminElements.adminBooksTableBody.appendChild(tr);
  });
}

function openBookFormModal(book = null) {
  adminState.editingBookId = book ? book.id : null;
  adminState.pdfFileBase64 = null;
  adminState.pdfFileName = null;
  adminState.coverFileBase64 = null;
  adminState.coverFileName = null;

  adminElements.pdfFileNameLabel.textContent = 'ยังไม่ได้เลือกไฟล์ PDF';
  adminElements.coverFileNameLabel.textContent = 'ยังไม่ได้เลือกไฟล์รูปปก';

  if (book) {
    adminElements.bookFormTitleText.textContent = 'แก้ไขข้อมูล E-Book';
    adminElements.inputTitle.value = book.title || '';
    adminElements.inputAuthor.value = book.author || '';
    adminElements.inputCategory.value = book.category || 'ทั่วไป';
    adminElements.inputDescription.value = book.description || '';
    adminElements.inputPdfDriveUrl.value = book.pdfDriveUrl || '';
    adminElements.inputCoverUrl.value = book.coverUrl || '';
  } else {
    adminElements.bookFormTitleText.textContent = 'เพิ่ม E-Book เล่มใหม่';
    adminElements.bookForm.reset();
  }

  openModal(adminElements.bookFormModal);
}

function handleFileSelect(file, type) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Data = e.target.result;
    if (type === 'pdf') {
      adminState.pdfFileBase64 = base64Data;
      adminState.pdfFileName = file.name;
      adminElements.pdfFileNameLabel.textContent = `เลือกแล้ว: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    } else if (type === 'cover') {
      adminState.coverFileBase64 = base64Data;
      adminState.coverFileName = file.name;
      adminState.coverMimeType = file.type;
      adminElements.coverFileNameLabel.textContent = `เลือกแล้ว: ${file.name}`;
    }
  };

  reader.readAsDataURL(file);
}

async function handleBookFormSubmit(e) {
  e.preventDefault();

  const title = adminElements.inputTitle.value.trim();
  if (!title) {
    showToast('กรุณากรอกชื่อหนังสือ E-Book', 'error');
    return;
  }

  const payload = {
    action: adminState.editingBookId ? 'edit' : 'add',
    id: adminState.editingBookId,
    title: title,
    author: adminElements.inputAuthor.value.trim() || 'ไม่ระบุผู้แต่ง',
    category: adminElements.inputCategory.value.trim() || 'ทั่วไป',
    description: adminElements.inputDescription.value.trim(),
    pdfDriveUrl: adminElements.inputPdfDriveUrl.value.trim(),
    coverUrl: adminElements.inputCoverUrl.value.trim(),
    pdfFileBase64: adminState.pdfFileBase64,
    pdfFileName: adminState.pdfFileName,
    coverFileBase64: adminState.coverFileBase64,
    coverFileName: adminState.coverFileName,
    coverMimeType: adminState.coverMimeType
  };

  adminElements.saveBookBtn.disabled = true;
  adminElements.saveBookBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังอัพโหลดไปยัง Google Drive & Sheet...';

  if (state.apiUrl) {
    try {
      const response = await fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success) {
        showToast(result.message || 'บันทึกสำเร็จ', 'success');
        closeModal(adminElements.bookFormModal);
        await loadBooksData();
        renderAdminBooksTable();
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (err) {
      showToast('ไม่สามารถบันทึกไปยัง API ได้: ' + err.message, 'error');
    }
  } else {
    showToast('กรุณาใส่ API URL เพื่อบันทึกไฟล์เข้า Google Drive & Sheet', 'error');
  }

  adminElements.saveBookBtn.disabled = false;
  adminElements.saveBookBtn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล E-Book';
}

async function handleDeleteBook(bookId) {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ E-Book เล่มนี้?')) return;

  if (state.apiUrl) {
    try {
      const response = await fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id: bookId })
      });
      const result = await response.json();
      if (result.success) {
        showToast('ลบรายการสำเร็จ', 'success');
        await loadBooksData();
        renderAdminBooksTable();
      }
    } catch (err) {
      showToast('ไม่สามารถลบรายการได้: ' + err.message, 'error');
    }
  }
}

function openSettingsModal() {
  adminElements.apiUrlInput.value = state.apiUrl || '';
  openModal(adminElements.settingsModal);
}

function saveSettings() {
  const url = adminElements.apiUrlInput.value.trim();
  state.apiUrl = url;
  localStorage.setItem(CONFIG.API_URL_KEY, url);
  showToast('บันทึกการตั้งค่า API เรียบร้อยแล้ว', 'success');
  closeModal(adminElements.settingsModal);
  loadBooksData();
}

async function testApiConnection() {
  const url = adminElements.apiUrlInput.value.trim();
  if (!url) {
    showToast('กรุณากรอก Google Apps Script Web App URL ก่อนทดสอบ', 'error');
    return;
  }

  adminElements.testApiBtn.disabled = true;
  adminElements.testApiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังทดสอบ...';

  try {
    const res = await fetch(url + '?action=list');
    const result = await res.json();
    if (result.success) {
      showToast('เชื่อมต่อสำเร็จ! ดึงข้อมูลได้เรียบร้อย', 'success');
    } else {
      showToast('เชื่อมต่อ API ได้ แต่ได้รับข้อความ: ' + result.error, 'error');
    }
  } catch (err) {
    showToast('ไม่สามารถเชื่อมต่อได้ ตรวจสอบ URL หรือการตั้งค่า Deploy (Anyone)', 'error');
  }

  adminElements.testApiBtn.disabled = false;
  adminElements.testApiBtn.innerHTML = '<i class="fas fa-plug"></i> ทดสอบการเชื่อมต่อ';
}

function openGuideModal() {
  openModal(adminElements.guideModal);
}

function copyAppsScriptCode() {
  const scriptCode = `/**
 * WebE-Book Backend API - Google Apps Script (GAS)
 */
const SHEET_NAME = 'EBooks';
const TARGET_FOLDER_ID = '1oG5n5-JchnAhm21pjCf19nkYH2Pkhteo';

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Title', 'Author', 'Category', 'Description', 'CoverUrl', 'PdfDriveUrl', 'PdfEmbedUrl', 'DateAdded', 'ViewCount']);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#4A6CF7').setFontColor('#FFFFFF');
  }
  try {
    DriveApp.getFolderById(TARGET_FOLDER_ID).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
}

function doGet(e) {
  try {
    setupDatabase();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'list';
    if (action === 'view') {
      incrementViewCount(e.parameter.id);
      return createJsonResponse({ success: true });
    }
    if (action === 'getPdf') {
      const file = DriveApp.getFileById(e.parameter.fileId);
      return createJsonResponse({ success: true, base64: Utilities.base64Encode(file.getBlob().getBytes()) });
    }
    return createJsonResponse({ success: true, data: getAllBooks() });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    setupDatabase();
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'add') return createJsonResponse({ success: true, data: addBook(data) });
    if (data.action === 'edit') return createJsonResponse({ success: true, data: editBook(data) });
    if (data.action === 'delete') return createJsonResponse({ success: true, message: 'ลบสำเร็จ' });
    return createJsonResponse({ success: false, error: 'Invalid action' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function getAllBooks() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const books = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    books.push({
      id: row[0].toString(),
      title: row[1] || '',
      author: row[2] || '',
      category: row[3] || 'ทั่วไป',
      description: row[4] || '',
      coverUrl: row[5] || '',
      pdfDriveUrl: row[6] || '',
      pdfEmbedUrl: row[7] || '',
      dateAdded: row[8] ? new Date(row[8]).toISOString().split('T')[0] : '',
      viewCount: Number(row[9]) || 0
    });
  }
  return books.reverse();
}

function addBook(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const bookId = 'EB-' + new Date().getTime();
  let pdfDriveUrl = data.pdfDriveUrl || '';
  let pdfEmbedUrl = data.pdfEmbedUrl || '';
  let coverUrl = data.coverUrl || '';

  if (data.pdfFileBase64 && data.pdfFileName) {
    const pdfUpload = uploadFileToDrive(data.pdfFileBase64, data.pdfFileName, 'application/pdf');
    pdfDriveUrl = pdfUpload.viewUrl;
    pdfEmbedUrl = pdfUpload.embedUrl;
  }
  if (data.coverFileBase64 && data.coverFileName) {
    const coverUpload = uploadFileToDrive(data.coverFileBase64, data.coverFileName, data.coverMimeType || 'image/jpeg');
    coverUrl = coverUpload.directUrl;
  }

  const dateAdded = new Date().toISOString().split('T')[0];
  sheet.appendRow([bookId, data.title, data.author || 'ไม่ระบุ', data.category || 'ทั่วไป', data.description || '', coverUrl, pdfDriveUrl, pdfEmbedUrl, dateAdded, 0]);
  return { id: bookId, title: data.title };
}

function editBook(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) {
      sheet.getRange(i + 1, 2).setValue(data.title);
      sheet.getRange(i + 1, 3).setValue(data.author);
      sheet.getRange(i + 1, 4).setValue(data.category);
      sheet.getRange(i + 1, 5).setValue(data.description);
      if (data.coverUrl) sheet.getRange(i + 1, 6).setValue(data.coverUrl);
      if (data.pdfDriveUrl) sheet.getRange(i + 1, 7).setValue(data.pdfDriveUrl);
      return { id: data.id, success: true };
    }
  }
}

function incrementViewCount(bookId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === bookId.toString()) {
      sheet.getRange(i + 1, 10).setValue((Number(rows[i][9]) || 0) + 1);
      break;
    }
  }
}

function uploadFileToDrive(base64Data, fileName, mimeType) {
  if (base64Data.indexOf('base64,') > -1) base64Data = base64Data.split('base64,')[1];
  const decodedBytes = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
  let folder;
  try {
    folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
  } catch (e) {
    const folders = DriveApp.getFoldersByName('WebEBook_Files');
    folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('WebEBook_Files');
  }
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const fileId = file.getId();
  return {
    viewUrl: \`https://drive.google.com/file/d/\${fileId}/view?usp=sharing\`,
    embedUrl: \`https://drive.google.com/file/d/\${fileId}/preview\`,
    directUrl: \`https://lh3.googleusercontent.com/d/\${fileId}\`
  };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

  navigator.clipboard.writeText(scriptCode).then(() => {
    showToast('คัดลอกโค้ด Google Apps Script อัพเดตเรียบร้อยแล้ว!', 'success');
  }).catch(() => {
    showToast('คัดลอกไม่สำเร็จ ดูได้ในไฟล์ google-apps-script/Code.gs', 'error');
  });
}

function openModal(modal) {
  if (modal) modal.classList.add('active');
}

function closeModal(modal) {
  if (modal) modal.classList.remove('active');
}
