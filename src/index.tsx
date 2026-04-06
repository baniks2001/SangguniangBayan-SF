import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Layouts
import PublicLayout from './layouts/PublicLayout';

// Pages
import HomePage from './pages/HomePage';
import ResolutionsPage from './pages/ResolutionsPage';
import OrdinancesPage from './pages/OrdinancesPage';
import VacanciesPage from './pages/VacanciesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import NewsPage from './pages/NewsPage';
import ContactPage from './pages/ContactPage';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="resolutions" element={<ResolutionsPage />} />
          <Route path="ordinances" element={<OrdinancesPage />} />
          <Route path="vacancies" element={<VacanciesPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>
      </Routes>
    </Router>
  </React.StrictMode>
);
