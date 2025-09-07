import React from 'react';
import AppLayout from '../components/AppLayout';

const ShortsPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Content', href: '/content' },
    { label: 'Shorts' }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex justify-center">
        <iframe
          width="315"
          height="560"
          src="https://www.youtube.com/embed/8-fWbQAoqPI"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </AppLayout>
  );
};

export default ShortsPage;
