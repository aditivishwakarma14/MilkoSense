# 🥛 MilkoSense - System Installation & Setup Guide

This guide provides detailed setup instructions for the **MilkoSense Smart AI Milk Quality Assessment System**. The system consists of three main decoupled services working together:

1. **Frontend**: React 18 + Vite + Tailwind CSS telemetry console.
2. **Backend**: Node.js + Express.js + Socket.IO intelligence API (MongoDB persistence).
3. **ML Service**: Python FastAPI machine learning service (RandomForest, XGBoost, CNN).

---

## 📋 System Prerequisites

Before starting, ensure you have the following software installed:

- **Node.js** (v18.0.0 or higher) & **npm** (v9.0.0 or higher)
- **Python** (v3.10 or v3.11 recommended) & **pip**
- **MongoDB** (Local instance or MongoDB Atlas cloud connection URI)
- **Docker & Docker Compose** (Optional, for containerized run)

---

## 🛠️ Folder Structure Overview

```text
MilkoSense/
├── package.json           # Root workspace script launcher (Monorepo setup)
├── docker-compose.yml     # Orchestration configuration
├── frontend/              # React Client UI
├── backend/               # Express API and Database engine
└── ml-service/            # Python FastAPI Machine Learning models
```

---

## ⚙️ Environment Configuration

### Backend Setup (`backend/.env`)
Create a file named `.env` inside the `backend/` directory and configure the environment variables as follows:

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Local or Cloud Atlas)
MONGO_URI=mongodb://localhost:27017/milkosense

# JWT Authentication Secret Key
JWT_SECRET=milkosense_jwt_secret_key_change_me_in_production

# Email SMTP configuration (For alerts/OTP notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# API Key validation for Python ML service communication
PYTHON_ML_API_KEY=dev-key-milkosense
```

---

## 🚀 Installation Steps

### Option A: Unified Setup (Recommended for Local Development)

In this mode, a single command fires up the frontend, backend, and machine learning microservice concurrently.

#### Step 1: Install Root and Subproject Dependencies
Run the following commands in the root of the project:

```bash
# Install root workspace package launcher dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### Step 2: Set up the Python Machine Learning Service
Navigate to the `ml-service` directory, initialize a virtual environment, and train the local models:

```bash
cd ml-service

# 1. Create a Python Virtual Environment
python -m venv venv

# 2. Activate Virtual Environment
# For Windows (Command Prompt/PowerShell):
venv\Scripts\activate
# For Mac/Linux:
source venv/bin/activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Generate the milk synthetic dataset (4,000 samples)
python generate_dataset.py

# 5. Train Random Forest, XGBoost, and Isolation Forest models & export to ONNX
python train.py

# 6. Compute SHAP explanations and baseline stats for drift detection
python compute_shap.py

# 7. Train the 1D-CNN model for spectral classification
python train_cnn.py

cd ..
```

#### Step 3: Run the Monorepo Development Environment
Return to the root directory and start all services concurrently:

```bash
# Make sure your Python venv is created beforehand
npm run dev
```
- **React Frontend Console**: http://localhost:3000
- **Express Backend API**: http://localhost:5000
- **Python ML API**: http://localhost:8000

---

### Option B: Decoupled Setup (Run Services Separately)

You can run and test each service individually by executing commands in their respective directories.

#### 1. Running the Backend API Server
```bash
cd backend
# Starts in developer reload mode
npm run dev 
# Active at: http://localhost:5000
```

#### 2. Running the Frontend Dev Server
```bash
cd frontend
# Starts Vite development server
npm run dev
# Active at: http://localhost:3000
```

#### 3. Running the ML Microservice
```bash
cd ml-service
# Make sure your virtual environment is active
venv\Scripts\activate
# Start FastAPI server using Uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Active at: http://localhost:8000
```

---

### Option C: Docker Container Setup (Production Ready)

To run the entire system in isolated Docker containers, run the following command in the root folder:

```bash
# Build and orchestrate backend, frontend, and MongoDB services
docker-compose up --build
```
- **Frontend Container URL**: http://localhost:3000
- **Backend Container URL**: http://localhost:5000
- **MongoDB Local Port**: localhost:27017

*(Note: Ensure your local ports 3000, 5000, and 27017 are free before running the Docker setup.)*

---

## 📊 Verification & Diagnostics

Once all services are running, verify they are communicating properly:

1. **Express Server Health Check**: Visit `http://localhost:5000/api/sensors` to verify the sensor reading feeds.
2. **FastAPI Server Interactive Docs**: Visit `http://localhost:8000/docs` to access the Swagger API client interface.
3. **Telemetry Test**: Access the **Real-Time Dashboard** page on the frontend (http://localhost:3000/realtime-dashboard) and click "Start Monitoring" to watch live Socket.IO charts stream.

---

## 🔬 Sensor Standards Reference

The AI assessment system relies on the following standard milk parameter bounds:

| Parameter | Optimal Range | Unit | Description |
| :--- | :--- | :--- | :--- |
| **pH Level** | `6.4 - 6.7` | pH | Milk acidity/alkalinity indicator |
| **Temperature** | `15.0 - 30.0` | °C | Transport storage hygiene evaluation |
| **TDS (Solids)** | `300 - 600` | ppm | Mineral profile & water dilution detection |
| **Turbidity** | `10.0 - 20.0` | NTU | Suspended fat / foreign solid contamination |
| **Gas Ferment** | `100 - 150` | units | Bacterial breeding index |
