# LearnPoint Admin Dashboard

A modern, responsive admin dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard Overview**: Comprehensive metrics and visualizations
- **Key Metrics**: Total Members, Courses Assigned, Courses Completed, Not Started
- **Charts**: Course Progress (Bar Chart), Class Attendance (Line Chart), Status Breakdown (Donut Chart)
- **Station Activity Map**: Visual representation of station locations
- **Responsive Design**: Works on all screen sizes
- **Modern UI**: Clean, professional design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── Header.tsx          # Top header with search
│   ├── MetricCard.tsx      # Metric card component
│   ├── CourseProgressChart.tsx
│   ├── AttendanceChart.tsx
│   ├── StatusBreakdownChart.tsx
│   ├── StationMap.tsx
│   └── NewContentCard.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Technologies Used

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Chart library for data visualization
- **Lucide React**: Icon library

## Build for Production

```bash
npm run build
npm start
```



