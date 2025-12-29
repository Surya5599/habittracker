# AI Rules for Annual Habit Tracker Dashboard

This document outlines the technical stack and specific library usage rules for developing and modifying the Annual Habit Tracker Dashboard application.

## Tech Stack Overview

*   **Frontend Framework**: React (version 19.x) for building dynamic and interactive user interfaces.
*   **Language**: TypeScript for enhanced code quality, type safety, and better developer tooling.
*   **Styling**: Tailwind CSS for a utility-first approach to styling, ensuring responsive and maintainable designs.
*   **UI Components**: shadcn/ui for pre-built, accessible, and customizable UI components.
*   **Charting Library**: Recharts for all data visualization needs, including line, pie, and bar charts.
*   **Icons**: Lucide React for a comprehensive and customizable set of SVG icons.
*   **Build Tool**: Vite for a fast development server and optimized production builds.
*   **State Management**: Primarily uses React Hooks (`useState`, `useEffect`, `useMemo`, `useRef`) for component-level state management.
*   **Data Persistence**: Utilizes the browser's `localStorage` for client-side data storage.
*   **Routing**: React Router for managing application navigation and routes.

## Library Usage Rules

To maintain consistency and best practices, please adhere to the following guidelines when making changes or adding new features:

*   **UI Components & Styling**:
    *   **Tailwind CSS**: *Always* use Tailwind CSS classes for all styling. Avoid custom CSS files or inline styles where Tailwind utilities are sufficient.
    *   **shadcn/ui**: For new UI elements, prioritize using components from the shadcn/ui library. If a specific component is not available or requires significant customization, create a new component in `src/components/` following the existing styling conventions.
*   **Charting & Data Visualization**:
    *   **Recharts**: All charts and data visualizations must be implemented using the Recharts library.
*   **Icons**:
    *   **Lucide React**: Use icons exclusively from the `lucide-react` package.
*   **State Management**:
    *   **React Hooks**: Leverage React's built-in Hooks (`useState`, `useEffect`, `useMemo`, `useRef`) for managing component state and side effects. Avoid introducing external state management libraries unless explicitly necessary for complex global state patterns and after discussion.
*   **Routing**:
    *   **React Router**: If new pages or navigation flows are introduced, use React Router for defining and managing routes. Keep route definitions within `src/App.tsx`.
*   **File Structure**:
    *   **Components**: All new reusable UI components should reside in `src/components/`.
    *   **Pages**: New application views or pages should be placed in `src/pages/`.
    *   **Utilities/Constants/Types**: Place utility functions, constants, and type definitions in `src/utils/`, `constants.ts`, and `types.ts` respectively.
*   **Data Persistence**:
    *   **localStorage**: Continue to use `localStorage` for client-side data storage.
*   **Code Quality**:
    *   **TypeScript**: Ensure all new code is written in TypeScript, adhering to strict type definitions.
    *   **Responsiveness**: All new UI elements and layouts must be responsive and adapt well to different screen sizes.
    *   **Simplicity**: Prioritize simple and elegant solutions. Avoid over-engineering.
    *   **Completeness**: All implemented features must be fully functional and complete; no partial implementations or placeholder code.