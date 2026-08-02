/**
 * ==============================================================================
 * WebE-Book Backend API - Google Apps Script (GAS)
 * ==============================================================================
 * 
 * ระบบ Backend แบบ Serverless สำหรับจัดการฐานข้อมูล E-Book บน Google Sheet
 * และอัพโหลดไฟล์ PDF และรูปภาพขึ้น Google Drive
 * ==============================================================================
 */

// ชื่อแท็บใน Google Sheet
const SHEET_NAME = 'EBooks';

// Google Drive Folder ID สำหรับเก็บไฟล์ทั้งหมด
const TARGET_FOLDER_ID = '1oG5n5-JchnAhm21pjCf19nkYH2Pkhteo';

/**
 * ฟังก์ชันเริ่มต้นสำหรับจัดเตรียมโครงสร้าง Google Sheet และ Google Drive
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // สร้าง Header Row
    sheet.appendRow([
      'ID', 
      'Title', 
      'Author', 
      'Category', 
      'Description', 
      'CoverUrl', 
      'PdfDriveUrl', 
      'PdfEmbedUrl', 
      'DateAdded', 
      'ViewCount'
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#4A6CF7').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }

  // ตรวจสอบและเปิดสิทธิ์แชร์โฟลเดอร์ Google Drive ปลายทาง
  try {
    const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('Folder check error: ' + e.toString());
  }
}

/**
 * รับคำขอ GET - สำหรับการดึงข้อมูล E-Book ทั้งหมด, เพิ่มจำนวนเข้าชม หรือดึงไฟล์ PDF
 */
function doGet(e) {
  try {
    setupDatabase();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'list';
    
    if (action === 'view') {
      const bookId = e.parameter.id;
      incrementViewCount(bookId);
      return createJsonResponse({ success: true, message: 'View count updated' });
    }

    if (action === 'getPdf') {
      const fileId = e.parameter.fileId || e.parameter.id;
      if (!fileId) return createJsonResponse({ success: false, error: 'ไม่พบพารามิเตอร์ fileId' });
      
      try {
        const file = DriveApp.getFileById(fileId);
        
        // ตรวจสอบเปิดสิทธิ์แชร์ไฟล์ให้อ่านได้สาธารณะอัตโนมัติ
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {}

        const blob = file.getBlob();
        const base64 = Utilities.base64Encode(blob.getBytes());
        
        return createJsonResponse({ 
          success: true, 
          base64: base64, 
          fileName: file.getName(),
          fileSize: blob.getBytes().length,
          mimeType: blob.getContentType() 
        });
      } catch (fileErr) {
        return createJsonResponse({ 
          success: false, 
          error: 'เกิดข้อผิดพลาดในการดึงไฟล์จาก Drive: ' + fileErr.toString() 
        });
      }
    }

    // Default: ดึงรายการหนังสือทั้งหมด
    const books = getAllBooks();
    return createJsonResponse({ success: true, data: books });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * รับคำขอ POST - สำหรับการเพิ่ม, แก้ไข, ลบ E-Book และการอัพโหลดไฟล์
 */
function doPost(e) {
  try {
    setupDatabase();
    let data;
    
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return createJsonResponse({ success: false, error: 'No post data received' });
    }

    const action = data.action;

    if (action === 'add') {
      const result = addBook(data);
      return createJsonResponse({ success: true, data: result, message: 'บันทึก E-Book สำเร็จ' });
    } else if (action === 'edit') {
      const result = editBook(data);
      return createJsonResponse({ success: true, data: result, message: 'แก้ไข E-Book สำเร็จ' });
    } else if (action === 'delete') {
      const result = deleteBook(data.id);
      return createJsonResponse({ success: true, message: 'ลบ E-Book สำเร็จ' });
    }

    return createJsonResponse({ success: false, error: 'Invalid action' });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * ดึงรายการหนังสือทั้งหมดจาก Google Sheet
 */
function getAllBooks() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const books = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // ข้ามแถวว่าง

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

/**
 * เพิ่มหนังสือใหม่ลงใน Google Sheet และอัพโหลดไฟล์
 */
function addBook(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const bookId = 'EB-' + new Date().getTime();
  
  let pdfDriveUrl = data.pdfDriveUrl || '';
  let pdfEmbedUrl = data.pdfEmbedUrl || '';
  let coverUrl = data.coverUrl || '';

  // 1. อัพโหลดไฟล์ PDF ถ้ามีข้อมูล base64
  if (data.pdfFileBase64 && data.pdfFileName) {
    const pdfUpload = uploadFileToDrive(data.pdfFileBase64, data.pdfFileName, 'application/pdf');
    pdfDriveUrl = pdfUpload.viewUrl;
    pdfEmbedUrl = pdfUpload.embedUrl;
  }

  // 2. อัพโหลดรูปปก ถ้ามีข้อมูล base64
  if (data.coverFileBase64 && data.coverFileName) {
    const coverUpload = uploadFileToDrive(data.coverFileBase64, data.coverFileName, data.coverMimeType || 'image/jpeg');
    coverUrl = coverUpload.directUrl;
  }

  const dateAdded = new Date().toISOString().split('T')[0];
  const viewCount = 0;

  sheet.appendRow([
    bookId,
    data.title,
    data.author || 'ไม่ระบุผู้แต่ง',
    data.category || 'ทั่วไป',
    data.description || '',
    coverUrl,
    pdfDriveUrl,
    pdfEmbedUrl,
    dateAdded,
    viewCount
  ]);

  return {
    id: bookId,
    title: data.title,
    author: data.author,
    category: data.category,
    description: data.description,
    coverUrl: coverUrl,
    pdfDriveUrl: pdfDriveUrl,
    pdfEmbedUrl: pdfEmbedUrl,
    dateAdded: dateAdded,
    viewCount: viewCount
  };
}

/**
 * แก้ไขข้อมูลหนังสือ
 */
function editBook(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) {
      let pdfDriveUrl = data.pdfDriveUrl || rows[i][6];
      let pdfEmbedUrl = data.pdfEmbedUrl || rows[i][7];
      let coverUrl = data.coverUrl || rows[i][5];

      if (data.pdfFileBase64 && data.pdfFileName) {
        const pdfUpload = uploadFileToDrive(data.pdfFileBase64, data.pdfFileName, 'application/pdf');
        pdfDriveUrl = pdfUpload.viewUrl;
        pdfEmbedUrl = pdfUpload.embedUrl;
      }

      if (data.coverFileBase64 && data.coverFileName) {
        const coverUpload = uploadFileToDrive(data.coverFileBase64, data.coverFileName, data.coverMimeType || 'image/jpeg');
        coverUrl = coverUpload.directUrl;
      }

      const rowNum = i + 1;
      sheet.getRange(rowNum, 2).setValue(data.title);
      sheet.getRange(rowNum, 3).setValue(data.author);
      sheet.getRange(rowNum, 4).setValue(data.category);
      sheet.getRange(rowNum, 5).setValue(data.description);
      sheet.getRange(rowNum, 6).setValue(coverUrl);
      sheet.getRange(rowNum, 7).setValue(pdfDriveUrl);
      sheet.getRange(rowNum, 8).setValue(pdfEmbedUrl);

      return { id: data.id, success: true };
    }
  }

  throw new Error('ไม่พบหนังสือ ID: ' + data.id);
}

/**
 * ลบหนังสือตาม ID
 */
function deleteBook(bookId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === bookId.toString()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/**
 * เพิ่มจำนวนการเข้าอ่าน
 */
function incrementViewCount(bookId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === bookId.toString()) {
      const currentViews = Number(rows[i][9]) || 0;
      sheet.getRange(i + 1, 10).setValue(currentViews + 1);
      break;
    }
  }
}

/**
 * อัพโหลดไฟล์ Base64 ไปยัง Google Drive โฟลเดอร์ปลายทาง
 */
function uploadFileToDrive(base64Data, fileName, mimeType) {
  if (base64Data.indexOf('base64,') > -1) {
    base64Data = base64Data.split('base64,')[1];
  }

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
  
  // กำหนดสิทธิ์แชร์ไฟล์เป็นสาธารณะ (Anyone with link)
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  const fileId = file.getId();
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

  return {
    fileId: fileId,
    viewUrl: viewUrl,
    embedUrl: embedUrl,
    directUrl: directUrl
  };
}

/**
 * ช่วยสร้าง JSON Response
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
