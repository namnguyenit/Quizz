# Hướng Dẫn Deploy Lên Vercel

## Bước 1: Chuẩn Bị Database (Turso)

### 1.1. Tạo tài khoản Turso

1. Truy cập: https://turso.tech
2. Đăng ký tài khoản (có thể dùng GitHub)

### 1.2. Cài đặt Turso CLI

```bash
# Windows (PowerShell)
powershell -c "irm https://windows.turso.tech/install.ps1 | iex"

# hoặc dùng npm
npm install -g @turso/cli
```

### 1.3. Login vào Turso

```bash
turso auth login
```

### 1.4. Tạo database mới

```bash
# Tạo database
turso db create quiz-universal

# Lấy URL của database
turso db show quiz-universal --url

# Tạo auth token
turso db tokens create quiz-universal
```

**Lưu lại 2 thông tin:**

- `TURSO_URL`: URL của database (có dạng `libsql://...`)
- `TURSO_AUTH_TOKEN`: Token vừa tạo

---

## Bước 2: Setup Environment Variables Local

### 2.1. Tạo file `.env`

```bash
# Copy từ template
cp .env.template .env
```

### 2.2. Điền thông tin vào `.env`

```env
TURSO_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...your-token-here
PUBLIC_DEBUG=false
```

---

## Bước 3: Sync Dữ Liệu Lên Database

### 3.1. Cài đặt dependencies

```bash
bun install
```

### 3.2. Sync quiz data lên Turso

```bash
# Sync toàn bộ dữ liệu (lần đầu)
bun run sync:clean

# Hoặc sync incremental (nếu đã có data)
bun run sync
```

### 3.3. Kiểm tra database

```bash
# Mở Turso shell để kiểm tra
turso db shell quiz-universal

# Chạy các query test
SELECT COUNT(*) FROM subjects;
SELECT COUNT(*) FROM quiz_collections;
SELECT COUNT(*) FROM questions;

# Exit
.quit
```

---

## Bước 4: Test Local Trước Khi Deploy

### 4.1. Chạy development server

```bash
bun run dev
```

Mở http://localhost:5173 và kiểm tra:

- ✅ Quiz library hiển thị đầy đủ
- ✅ Load được câu hỏi
- ✅ Favorites hoạt động
- ✅ Settings hoạt động

### 4.2. Build production

```bash
bun run build
```

### 4.3. Preview production build

```bash
bun run preview
```

---

## Bước 5: Push Code Lên GitHub

### 5.1. Commit code mới (nếu có thay đổi)

```bash
git add .
git commit -m "Add design credits and prepare for deployment"
git push origin main
```

### 5.2. Kiểm tra repository

Truy cập: https://github.com/namnguyenit/Quizz
Đảm bảo code đã được push thành công.

---

## Bước 6: Deploy Lên Vercel

### 6.1. Tạo tài khoản Vercel

1. Truy cập: https://vercel.com
2. Đăng nhập bằng GitHub

### 6.2. Import project từ GitHub

1. Click **"Add New..."** → **"Project"**
2. Chọn repository: `namnguyenit/Quizz`
3. Click **"Import"**

### 6.3. Configure Project

**Framework Preset:** Vite (auto-detected)

**Build Settings:**

- Build Command: `bun run build` (hoặc để mặc định)
- Output Directory: `.vercel/output` (auto)
- Install Command: `bun install`

### 6.4. Thêm Environment Variables

Click **"Environment Variables"**, thêm:

| Name               | Value                             |
| ------------------ | --------------------------------- |
| `TURSO_URL`        | `libsql://your-database.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbGc...your-token`            |
| `PUBLIC_DEBUG`     | `false`                           |

**⚠️ LƯU Ý:** Paste đúng giá trị từ file `.env` local

### 6.5. Deploy

1. Click **"Deploy"**
2. Đợi 2-3 phút để Vercel build & deploy
3. Vercel sẽ tự động tạo URL: `https://your-project.vercel.app`

---

## Bước 7: Kiểm Tra Deployment

### 7.1. Mở URL production

```
https://your-project.vercel.app
```

### 7.2. Checklist kiểm tra

- ✅ Trang chủ hiển thị quiz library
- ✅ Click vào quiz → load được câu hỏi
- ✅ Favorites hoạt động
- ✅ Settings hoạt động
- ✅ Hiển thị "Design By TrungCao" ở TopBar, Footer, và trang chủ
- ✅ Responsive trên mobile

### 7.3. Kiểm tra Console (F12)

- ❌ Không có lỗi đỏ
- ✅ API calls thành công (`/api/nav`, `/api/quiz`)

---

## Bước 8: Cấu Hình Domain (Tùy Chọn)

### 8.1. Thêm custom domain

1. Vào Vercel Dashboard → Settings → Domains
2. Click **"Add"**
3. Nhập domain của bạn (vd: `quiz.example.com`)
4. Follow hướng dẫn cấu hình DNS

### 8.2. Cấu hình DNS

Thêm CNAME record tại nhà cung cấp domain:

```
Type: CNAME
Name: quiz (hoặc @)
Value: cname.vercel-dns.com
```

---

## Bước 9: Setup Auto-Deploy

Vercel tự động deploy khi push code mới lên GitHub:

```bash
# Thay đổi code
git add .
git commit -m "Update feature"
git push origin main

# Vercel sẽ tự động build & deploy
```

---

## Troubleshooting

### Lỗi: "Failed to fetch navigation"

**Nguyên nhân:** Environment variables chưa đúng

**Giải pháp:**

1. Vào Vercel Dashboard → Settings → Environment Variables
2. Kiểm tra lại `TURSO_URL` và `TURSO_AUTH_TOKEN`
3. Redeploy: Deployments → Click "..." → Redeploy

### Lỗi: "No quizzes found"

**Nguyên nhân:** Database chưa có data

**Giải pháp:**

```bash
# Sync lại data lên Turso
bun run sync:clean
```

### Lỗi build: "Cannot find module..."

**Nguyên nhân:** Dependencies chưa đầy đủ

**Giải pháp:**

```bash
# Cài lại dependencies
rm -rf node_modules bun.lock
bun install
git add bun.lock
git commit -m "Update lock file"
git push
```

### Lỗi: "Deployment failed"

**Giải pháp:**

1. Check build logs trong Vercel
2. Test build local: `bun run build`
3. Fix lỗi → push lại

---

## Useful Commands

```bash
# Local development
bun run dev              # Start dev server
bun run build            # Build production
bun run preview          # Preview production build

# Database sync
bun run sync             # Incremental sync
bun run sync:clean       # Full reset & sync
bun run sync:add         # Only add/update, no delete
bun run sync --dry-run   # Preview changes

# Code quality
bun run check            # Type check
bun run lint             # Lint code
bun run format           # Format code

# Turso CLI
turso db list                    # List databases
turso db show quiz-universal     # Show database info
turso db shell quiz-universal    # Open database shell
turso db tokens create           # Create new token
```

---

## Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Turso Dashboard:** https://turso.tech/app
- **GitHub Repo:** https://github.com/namnguyenit/Quizz
- **Documentation:**
  - SvelteKit: https://kit.svelte.dev
  - Vercel: https://vercel.com/docs
  - Turso: https://docs.turso.tech

---

## Lưu Ý Quan Trọng

1. **Không commit file `.env`** vào git (đã có trong `.gitignore`)
2. **Backup Turso credentials** - lưu ở nơi an toàn
3. **Sync data trước khi deploy** - đảm bảo database có đầy đủ quiz
4. **Test kỹ local** trước khi deploy production
5. **Monitor Vercel logs** - kiểm tra lỗi runtime

---

## Next Steps

- [ ] Deploy lên Vercel
- [ ] Thêm custom domain (optional)
- [ ] Setup analytics (đã có @vercel/analytics)
- [ ] Add more quizzes vào `subjects/`
- [ ] Monitor performance & errors

---

**🎉 Chúc bạn deploy thành công!**

Design By TrungCao
