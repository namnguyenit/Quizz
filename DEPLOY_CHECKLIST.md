# 🚀 Deploy Checklist - Quiz Universal

## ✅ Pre-Deploy Checklist

### 1. Database Setup (Turso)

- [ ] Đăng ký tài khoản Turso: https://turso.tech
- [ ] Cài đặt Turso CLI: `npm install -g @turso/cli`
- [ ] Login: `turso auth login`
- [ ] Tạo database: `turso db create quiz-universal`
- [ ] Lấy TURSO_URL: `turso db show quiz-universal --url`
- [ ] Tạo token: `turso db tokens create quiz-universal`
- [ ] Lưu lại TURSO_URL và TURSO_AUTH_TOKEN

### 2. Local Setup

- [ ] Tạo file `.env` từ `.env.template`
- [ ] Điền TURSO_URL và TURSO_AUTH_TOKEN vào `.env`
- [ ] Cài dependencies: `bun install`
- [ ] Sync data: `bun run sync:clean`
- [ ] Test local: `bun run dev` → http://localhost:5173

### 3. Build Test

- [ ] Build production: `bun run build`
- [ ] Preview build: `bun run preview`
- [ ] Kiểm tra không có lỗi build

### 4. Git Push

- [ ] Commit changes: `git add . && git commit -m "Ready for deployment"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Kiểm tra code trên GitHub: https://github.com/namnguyenit/Quizz

---

## 🌐 Vercel Deployment

### 5. Vercel Setup

- [ ] Đăng nhập Vercel bằng GitHub: https://vercel.com
- [ ] Click "Add New..." → "Project"
- [ ] Import: `namnguyenit/Quizz`

### 6. Configure Project

- [ ] Framework: **Vite** (auto-detected)
- [ ] Build Command: `bun run build` (hoặc default)
- [ ] Install Command: `bun install`

### 7. Environment Variables

Thêm các biến sau vào Vercel:

| Variable           | Value          | Note           |
| ------------------ | -------------- | -------------- |
| `TURSO_URL`        | `libsql://...` | Copy từ `.env` |
| `TURSO_AUTH_TOKEN` | `eyJhbGc...`   | Copy từ `.env` |
| `PUBLIC_DEBUG`     | `false`        |                |

- [ ] Đã thêm TURSO_URL
- [ ] Đã thêm TURSO_AUTH_TOKEN
- [ ] Đã thêm PUBLIC_DEBUG

### 8. Deploy

- [ ] Click **Deploy**
- [ ] Đợi build hoàn tất (2-3 phút)
- [ ] Vercel tạo URL production

---

## ✨ Post-Deploy Testing

### 9. Production Check

URL: `https://your-project.vercel.app`

- [ ] Trang chủ hiển thị quiz library
- [ ] Click quiz → load câu hỏi thành công
- [ ] Favorites hoạt động
- [ ] Settings hoạt động
- [ ] "Design By TrungCao" hiển thị (TopBar, Footer, Library)
- [ ] Responsive trên mobile
- [ ] F12 Console không có lỗi đỏ

### 10. API Testing

- [ ] `/api/nav` - Lấy danh sách quiz
- [ ] `/api/quiz?id=xxx` - Lấy câu hỏi
- [ ] Database connection thành công

---

## 🔧 Optional: Custom Domain

### 11. Add Custom Domain (Tùy chọn)

- [ ] Vercel → Settings → Domains → Add
- [ ] Nhập domain: `quiz.yourdomain.com`
- [ ] Cấu hình DNS CNAME:
  ```
  Type: CNAME
  Name: quiz
  Value: cname.vercel-dns.com
  ```
- [ ] Đợi DNS propagate (5-10 phút)
- [ ] Test domain mới

---

## 📝 Common Issues

### ❌ "Failed to fetch navigation"

**Fix:** Kiểm tra Environment Variables trong Vercel → Redeploy

### ❌ "No quizzes found"

**Fix:** Chạy `bun run sync:clean` để sync data lại

### ❌ Build failed

**Fix:**

1. Check logs trong Vercel
2. Test local: `bun run build`
3. Fix lỗi → push lại

---

## 🎯 Quick Commands

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build production
bun run preview          # Preview build

# Database
bun run sync             # Sync quiz data
bun run sync:clean       # Full reset
turso db shell quiz-universal  # Open DB

# Git
git add .
git commit -m "message"
git push origin main     # Auto-deploy to Vercel
```

---

## 📌 Important Notes

1. ⚠️ **Không commit `.env`** vào git
2. 💾 **Backup Turso credentials**
3. 🔄 **Sync data trước khi deploy**
4. 🧪 **Test local trước**
5. 📊 **Monitor Vercel logs**

---

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Turso Dashboard: https://turso.tech/app
- GitHub Repo: https://github.com/namnguyenit/Quizz
- Local Dev: http://localhost:5173

---

## ✅ Deploy Status

- [ ] Database setup complete
- [ ] Local testing passed
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Production testing passed
- [ ] Custom domain configured (optional)

**Deploy Date:** ******\_******

**Production URL:** ******\_******

**Deployed By:** TrungCao

---

🎉 **Deployment Complete!**
