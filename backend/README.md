# Financial Dashboard Project

## 🚀 Project Overview
A comprehensive financial management and analytics platform designed to track project expenses, invoicing, and provide detailed financial insights.

## 🛠 Tech Stack

### Backend
- **Framework**: Django 5.1
- **Language**: Python 3.10+
- **API**: Django REST Framework
- **Authentication**: Simple JWT
- **Database**: SQLite (Development), Flexible Database Support
- **Key Libraries**: 
  - pandas for data processing
  - djongo for potential MongoDB integration
  - drf-spectacular for API documentation

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: React Query, Context API
- **UI Libraries**: 
  - Tailwind CSS
  - Headless UI
  - MUI
- **Charting**: Recharts
- **Build Tool**: Vite
- **Testing**: Vitest, React Testing Library

## 📦 Key Features

### Financial Tracking
- Expense Control Management
- Project Invoicing
- Detailed Financial Metrics Calculation
- Multi-Project Support
- User and Project Membership Management

### Dashboard Capabilities
- Real-time Financial Metrics
- Project Performance Analytics
- Profitability Ratio Calculations
- Expense Tracking and Forecasting

## 🚦 Project Structure

### Backend Structure
```
backend/
├── apps/
│   ├── core/           # Shared utilities
│   ├── user_management/  # User and project relationships
│   ├── commandes/      # Purchase order management
│   ├── controle_depenses/  # Expense tracking
│   ├── facturation/    # Invoicing
│   └── dashboard/      # Analytics and reporting
├── config/             # Django project configuration
└── manage.py
```

### Frontend Structure
```
frontend/
├── src/
│   ├── api/            # API interaction
│   ├── components/     # Reusable UI components
│   ├── features/       # Feature-specific components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   └── utils/          # Utility functions
└── vite.config.ts
```

## 🔧 Development Setup

### Backend Setup
1. Clone the repository
2. Create virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables
   ```bash
   cp .env.example .env
   # Update configuration as needed
   ```
5. Run migrations
   ```bash
   python manage.py migrate
   ```
6. Start development server
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to frontend directory
2. Install dependencies
   ```bash
   npm install
   ```
3. Start development server
   ```bash
   npm run dev
   ```

## 🔐 Authentication
- JWT-based authentication
- Access Token: 60 minutes
- Refresh Token: 24 hours

## 📊 Key Metrics Calculated
- Committed Expenses
- Invoiced Expenses
- Projected End Cost
- Profitability Ratios
- Remaining Budget
- Project Financial Evolution

## 🧪 Testing
- Backend: pytest
- Frontend: Vitest with React Testing Library
- Coverage reporting available

## 🌐 API Documentation
- Swagger/OpenAPI documentation available
- Endpoint details and interaction guides

## 🔍 Development Workflow
1. Use feature branches
2. Write comprehensive tests
3. Ensure type safety
4. Follow PEP 8 and ESLint guidelines

## 📝 Environment Variables
- `DEBUG`: Toggle development mode
- `DJANGO_SECRET_KEY`: Security key
- `BACKEND_URL`: API endpoint
- `WS_TOKEN`: Websocket authentication

## 🚀 Deployment Considerations
- Production-ready secure settings
- CORS configuration
- Environment-specific configurations
- SSL support

## 📋 Roadmap
- [ ] Implement advanced reporting
- [ ] Enhanced data visualization
- [ ] Performance optimization
- [ ] Expanded user roles and permissions

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License
[Specify your license here]

## 💬 Support
For issues or questions, please open a GitHub issue or contact [your contact information]