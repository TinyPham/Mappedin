# Mappedin 3D Models - SQL Server Backend

Backend API để quản lý 3D models với Microsoft SQL Server.

## Setup

### 1. Cài đặt SQL Server

**Option A: SQL Server Express (Free, Local)**
- Download: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Chọn "Download now" → Express edition
- Cài đặt với default settings

**Option B: Azure SQL Database (Cloud)**
- Tạo account Azure: https://azure.microsoft.com
- Tạo SQL Database resource

### 2. Tạo Database

```sql
-- Chạy file schema.sql trong SQL Server Management Studio (SSMS)
-- hoặc Azure Data Studio
```

Mở `database/schema.sql` và execute toàn bộ script.

### 3. Setup Backend

```bash
cd backend
npm install
```

### 4. Configure Environment

```bash
# Copy .env.example to .env
copy .env.example .env

# Edit .env với thông tin database của bạn
```

### 5. Run Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## API Endpoints

### GET /api/models
Lấy tất cả models

**Response:**
```json
[
  {
    "uuid": "airplane-1",
    "url": "./Model3D/airplane.glb",
    "name": "",
    "desc": "",
    "latitude": 10.77315555,
    "longitude": 107.03798811,
    "floorId": null,
    "rotation": [90, 124, 15],
    "scale": [30, 30, 30]
  }
]
```

### GET /api/models/:uuid
Lấy model theo UUID

### POST /api/models
Tạo hoặc update model

**Request Body:**
```json
{
  "uuid": "airplane-1",
  "url": "./Model3D/airplane.glb",
  "name": "My Airplane",
  "desc": "Custom airplane model",
  "latitude": 10.77315555,
  "longitude": 107.03798811,
  "floorId": "floor-123",
  "rotation": [90, 124, 15],
  "scale": [30, 30, 30]
}
```

### DELETE /api/models/:uuid
Xóa model (soft delete)

### POST /api/models/batch
Batch import models (dùng để migrate từ localStorage)

**Request Body:**
```json
{
  "models": [...]
}
```

## Database Schema

```
Models3D Table:
- Id (INT, PK, Auto-increment)
- UUID (NVARCHAR(50), UNIQUE)
- ModelName (NVARCHAR(200))
- Description (NVARCHAR(500))
- ModelURL (NVARCHAR(500))
- Latitude (DECIMAL(10,8))
- Longitude (DECIMAL(11,8))
- FloorId (NVARCHAR(100))
- FloorName (NVARCHAR(100))
- RotationX, RotationY, RotationZ (DECIMAL(10,4))
- ScaleX, ScaleY, ScaleZ (DECIMAL(10,4))
- CreatedAt, UpdatedAt (DATETIME2)
- CreatedBy (NVARCHAR(100))
- IsActive (BIT)
```

## Testing

Test API với Postman hoặc curl:

```bash
# Get all models
curl http://localhost:3000/api/models

# Create model
curl -X POST http://localhost:3000/api/models \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "test-1",
    "url": "./Model3D/airplane.glb",
    "latitude": 10.77315555,
    "longitude": 107.03798811,
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1]
  }'
```

## Migrate từ localStorage

Sử dụng endpoint `/api/models/batch` để import data hiện tại từ localStorage vào database.
