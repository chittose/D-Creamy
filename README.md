# ☕ D'Creamy Finance

> A modern, mobile-first financial management application tailored for UMKM (Micro, Small, and Medium Enterprises), specifically coffee shops and culinary businesses.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Supabase](https://img.shields.io/badge/Supabase-Database-green) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-cyan)

## 📖 About

**D'Creamy Finance** is designed to streamline the daily operations of a coffee shop. From recording sales at the cashier (POS) to tracking inventory in real-time and generating insightful financial reports, this application provides a complete solution for business owners and staff.

Built with performance and user experience in mind, it features a responsive **Glassmorphism UI** that looks great on both desktop and mobile devices.

## ✨ Key Features

### 🏪 Point of Sale (POS) & Transactions
- **Quick Transaction Recording**: Optimized interface for fast input of sales and expenses.
- **Product Grid**: Visual product selection with images and prices.
- **Shopping Cart**: Add multiple items, adjust quantities, and calculate totals automatically.
- **Payment Methods**: Support for Cash and QRIS payments.

### 📦 Inventory & Product Management
- **Real-time Stock Tracking**: Automatically deducts stock upon sale.
- **Recipe Management**: Link products to raw materials (e.g., *1 Iced Latte uses 200ml Milk + 1 Espresso Shot*).
- **Low Stock Alerts**: Visual indicators when stock levels adhere to minimum thresholds.
- **Product CRUD**: Easily add, edit, or remove products and upload images.

### 📊 Financial Reporting & Dashboard
- **Interactive Dashboard**: KPI cards for Income, Expense, and Profit with trend indicators.
- **Visual Charts**: Income vs. Expense bar charts and Category breakdown pie charts.
- **Transaction History**: Detailed list of all past transactions with filtering options.
- **Export Data**: (Coming Soon) Export reports to CSV/Excel.

### 🔐 Security & Role-Management
- **Role-Based Access**: Distinct features for **Owners** (full access) and **Staff** (POS only).
- **Secure Authentication**: Powered by Supabase Auth (`@supabase/ssr`).
- **Onboarding Flow**: Guided setup for new warung (shop) creation.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**:
  - [Lucide React](https://lucide.dev/) (Icons)
  - [Radix UI](https://www.radix-ui.com/) (Primitives)
  - [Sonner](https://sonner.emilkowal.ski/) (Toasts)
  - [Vaul](https://vaul.emilkowal.ski/) (Mobile Drawer)
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Hooks + Context API
- **PWA Support**: `next-pwa` for offline capabilities.

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/chittose/D-Creamy.git
    cd dcreamy-finance
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    > **Note:** The project uses `@supabase/ssr` for secure server-side access. Ensure your RLS (Row Level Security) policies are correctly configured in Supabase.

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```bash
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Authentication routes (login, register)
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard layout & pages
│   ├── transaksi/        # POS features
│   ├── stok/             # Stock management
│   └── laporan/          # Reporting
├── components/           # Reusable UI components
│   ├── ui/               # Base UI (Button, Input, Card, etc.)
│   ├── layout/           # Sidebar, Header, MobileNav
│   └── ...
├── hooks/                # Custom React hooks (useAuth, useCart)
├── lib/                  # Utilities & Helper functions
│   ├── supabase/         # Supabase client configuration
│   └── utils.ts          # Common utility functions
└── styles/               # Global styles (globals.css)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is proprietary software. Unauthorized copying of this file, via any medium is strictly prohibited.

---

Made with ❤️ by [Chittose](https://github.com/chittose)
