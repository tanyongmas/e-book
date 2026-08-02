# 📚 WebE-Book Application - เทศบาลตำบลตันหยงมัส

เว็บแอปพลิเคชันบริการคลัง E-Book และเอกสารดิจิทัลออนไลน์ **เทศบาลตำบลตันหยงมัส อำเภอระแงะ จังหวัดนราธิวาส** ออกแบบเป็น **Pure Static Frontend** สามารถอัพโหลดขึ้น **GitHub Pages** ได้ทันที 100% เชื่อมต่อกับ **Google Sheets** ทำหน้าที่เป็นฐานข้อมูล และ **Google Drive** ทำหน้าที่เป็นคลังจัดเก็บไฟล์ PDF e-book และรูปภาพ ใช้งานได้ฟรี 100% ไม่มีค่าบริการเซิร์ฟเวอร์

---

## 🌟 ฟีเจอร์เด่น (Key Features)

### 📖 สำหรับประชาชนทั่วไป (Public Readers)
- **3D Interactive PDF Flipbook Reader Engine**: เปิดอ่านไฟล์ PDF เสมือนพลิกอ่านหนังสือจริง 3 มิติ ด้วยเทคโนโลยี Mozilla PDF.js ร่วมกับ StPageFlip 3D Engine
- **Dynamic Batch Rendering (รองรับ PDF ใหญ่ 300+ หน้า)**: ระบบทยอยประมวลผลหน้ากระดาษอัจฉริยะ ช่วยให้เปิดอ่านไฟล์เทศบัญญัติงบประมาณขนาดใหญ่ยักษ์ 300+ หน้า ได้ใน 1 วินาที ไม่กิน RAM และไม่ค้าง
- **CMap & Thai Font Full Recovery**: รองรับการอ่านและถอดรหัสฟอนต์ภาษาไทย TrueType และโปรไฟล์สีสแกนพิเศษของเอกสารราชการไทยทุกรูปแบบ
- **ระบบค้นหาและเปลี่ยนเลขหน้า (Page Jump Search)**: กล่องพิมพ์เลขหน้า `[ หน้า X / Y ]` สามารถพิมพ์เปลี่ยนหน้าได้ทันทีทั้งใน **โหมด 3D Flipbook** และ **โหมด Google Drive Viewer**
- **เปิดอ่านแบบเต็มหน้าจอ (Fullscreen View)**: สลับโหมดอ่านเต็มหน้าจอผ่าน HTML5 Fullscreen API
- **คลัง E-Book ดิจิทัลเรียลไทม์**: ระบบค้นหาหนังสือ (Search Filter), แยกหมวดหมู่ (Category Filter Chips), และเลือกเรียงลำดับ (ล่าสุด / ยอดนิยม / ก-ฮ)
- **Minimalist Emerald Green Design System**: โทนสีเขียวมินิมอลสบายตา Flat Solid Color พร้อมสลับโหมดสว่าง (**Light Mode**) และโหมดมืดถนอมสายตา (**Dark Mode**) สีเทา-ดำสบายตา (`#121212` / `#212529`)
- **Full Mobile Responsive**: จัดรูปแบบการแสดงผลแบบ 2 คอลัมน์บนมือถือ ใช้งานง่าย พอดีหน้าจอสมาร์ตโฟนและแท็บเล็ต

### 🔐 สำหรับแอดมิน (Admin Management)
- **ระบบยืนยันตัวตนรหัส PIN**: ปกป้องแผงควบคุมแอดมินด้วยรหัส PIN
- **อัพโหลดไฟล์เข้า Google Drive อัตโนมัติ**: ฟอร์มเพิ่ม/แก้ไข E-Book ลากไฟล์ PDF หรือรูปปกมาวางเพื่ออัพโหลดไปยังโฟลเดอร์ Google Drive ของเทศบาลได้ทันที (Folder ID: `1oG5n5-JchnAhm21pjCf19nkYH2Pkhteo`)
- **จัดการข้อมูลใน Google Sheets**: เพิ่ม, แก้ไข, ลบรายการ E-Book ซิงค์ข้อมูลเรียลไทม์กับ Google Sheet
- **Universal Drive File ID Extractor**: ระบบสตรีมไฟล์ฉลาดรองรับลิงก์และรหัสไฟล์ Google Drive ทุกรูปแบบ

---

## 🚀 ขั้นตอนการอัพโหลดขึ้น GitHub Pages (GitHub Deployment Guide)

เนื่องจากโปรเจกต์นี้เขียนด้วย Vanilla HTML5, CSS3, JavaScript (ES6+) จึงสามารถ Upload ขึ้น GitHub และเปิดใช้งาน **GitHub Pages** ได้ฟรีทันทีตามขั้นตอนดังนี้:

### Step 1: สร้าง Repository บน GitHub
1. เข้าไปที่ [GitHub.com](https://github.com) แล้วเปิดสร้าง **New Repository** (เช่น ชื่อ `webebook-tanyongmat`)
2. เลือกตั้งค่าเป็น **Public**

### Step 2: Push โค้ดขึ้น GitHub
เปิด Terminal / Command Prompt ในโฟลเดอร์นี้ แล้วรันคำสั่ง:

```bash
# 1. เริ่มต้น Git repository
git init

# 2. เพิ่มไฟล์ทั้งหมด
git add .

# 3. Commit โค้ด
git commit -m "Initial commit for WebE-Book Tanyongmat Municipality"

# 4. เปลี่ยนชื่อ Branch หลักเป็น main
git branch -M main

# 5. เชื่อมต่อไปยัง GitHub Repository ของคุณ (เปลี่ยน URL เป็นของคุณ)
git remote add origin https://github.com/YOUR_USERNAME/webebook-tanyongmat.git

# 6. Push ขึ้น GitHub
git push -u origin main
```

### Step 3: เปิดใช้งาน GitHub Pages
1. ไปที่หน้า Repository บน GitHub ➔ กดเมนู **Settings**
2. เลือกเมนูด้านข้าง **Pages**
3. ตรงส่วน **Build and deployment**:
   - Source: เลือก **Deploy from a branch**
   - Branch: เลือก **main** และโฟลเดอร์ **/(root)**
4. กด **Save**
5. รอ 1-2 นาที คุณจะได้ URL เว็บไซต์ เช่น `https://YOUR_USERNAME.github.io/webebook-tanyongmat/` พร้อมใช้งานทันที!

---

## ⚙️ ขั้นตอนการตั้งค่า Google Sheets & Google Drive (Backend Setup)

1. **สร้าง Google Sheet**: เข้า [sheets.new](https://sheets.new) บน Google Drive ของเทศบาล
2. **เปิด Apps Script**: ไปที่เมนู `ขยายส่วนต่าง ๆ (Extensions)` ➔ `Apps Script`
3. **คัดลอกโค้ด**: คัดลอกเนื้อหาทั้งหมดจากไฟล์ [google-apps-script/Code.gs](file:///f:/Municipality%202568/WebApp/WebE-Book/google-apps-script/Code.gs) ไปวางแทนที่ในหน้าต่าง Apps Script
4. **Deploy เป็น Web App**:
   - กดปุ่ม `การทำให้ใช้งานได้ (Deploy)` ➔ `การทำให้ใช้งานได้รายการใหม่ (New Deployment)`
   - เลือกประเภท: **เว็บแอป (Web App)**
   - คำอธิบาย: `WebE-Book API`
   - ผู้มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)** *(สำคัญมาก)*
5. **คัดลอก Web App URL**: นำ URL ที่ได้จากการ Deploy มากรอกในปุ่ม **"ไอคอนแผงแอดมิน" ➔ "ตั้งค่า API"** บนหน้าเว็บ

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
WebE-Book/
├── index.html                # หน้าเว็บหลัก Semantic HTML5
├── css/
│   └── style.css             # Minimalist Emerald Green & Dark Slate Design System
├── js/
│   ├── app.js                # Dynamic Batch 3D Flipbook Engine & Client Core
│   └── admin.js              # Admin Dashboard, Auth & Drive Upload Logic
├── img/
│   └── Logo.png              # ตราสัญลักษณ์เทศบาลตำบลตันหยงมัส
├── google-apps-script/
│   └── Code.gs               # Backend REST API สำหรับนำไปวางใน Google Apps Script
└── README.md                 # คู่มือการใช้งานและการนำขึ้น GitHub Pages
```

---

## 📄 License & Attribution
พัฒนาขึ้นเพื่อประโยชน์สาธารณะ สำหรับ **เทศบาลตำบลตันหยงมัส อำเภอระแงะ จังหวัดนราธิวาส** และหน่วยงานภาครัฐ/องค์กรปกครองส่วนท้องถิ่นทั่วไป
