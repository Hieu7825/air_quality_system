# Air Quality Monitoring System

Hệ thống giám sát và phân tích chất lượng không khí thời gian thực được phát triển bằng Flask và MySQL.

air_quality_system/
├── app.py # Main Flask application
├── config.py # Configuration settings
├── requirements.txt # Python dependencies
├── database/
│ ├── **init**.py
│ ├── models.py # Database models
│ └── init_db.py # Database initialization
├── static/
│ ├── css/
│ │ └── style.css # Modern UI styling
│ ├── js/
│ │ ├── map.js # Map functionality
│ │ ├── charts.js # Chart functionality
│ │ └── sounds.js # Sound effects
│ └── sounds/
│ ├── click.mp3 # Click sound
│ ├── hover.mp3 # Hover sound
│ └── notification.mp3 # Notification sound
├── templates/
│ ├── base.html # Base template
│ ├── index.html # Home page
│ ├── map.html # Map view
│ └── charts.html # Charts view
└── README.md # Project documentation

## Tính năng chính

### 🗺️ Bản đồ tương tác

- Hiển thị vị trí cảm biến trên bản đồ Leaflet
- Popup thông tin chi tiết khi click vào cảm biến
- Màu sắc trực quan theo mức độ ô nhiễm
- Tự động cập nhật dữ liệu

### 📊 Biểu đồ phân tích

- Biểu đồ đường cho PM2.5 theo thời gian
- Biểu đồ đa tham số (PM2.5, PM10, CO, NO₂)
- Biểu đồ nhiệt độ và độ ẩm
- Biểu đồ so sánh giữa các khu vực

### 🎨 Giao diện hiện đại

- Thiết kế responsive cho mọi thiết bị
- Hiệu ứng animations mượt mà
- Âm thanh phản hồi tương tác
- Dark mode và glassmorphism

### 📱 Tính năng nâng cao

- PWA support
- Xuất dữ liệu CSV/JSON
- Tooltip thông tin chi tiết
- Tự động làm mới dữ liệu

## Yêu cầu hệ thống

- Python 3.8+
- MySQL 5.7+
- 2GB RAM
- 1GB ổ cứng

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd air_quality_system
```

### 2. Tạo virtual environment

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\\Scripts\\activate  # Windows
```

### 3. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 4. Cấu hình database

Tạo file `.env` trong thư mục gốc:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=air_quality_db
SECRET_KEY=your-secret-key-here
```

### 5. Tạo database MySQL

```sql
CREATE DATABASE air_quality_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. Chạy ứng dụng

```bash
python app.py
```

Truy cập: `http://localhost:5000`
