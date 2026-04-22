import React from 'react';
import { Users, Building2 } from 'lucide-react';

// Organization categories with descriptive image names
const ORGANIZATION_CATEGORIES = [
  {
    id: 'vice_mayor',
    name: 'Municipal Vice Mayor',
    description: 'Presiding Officer',
    images: ['/homepage-images/vice-mayor.jpg']
  },
  {
    id: 'sb_members',
    name: 'SB Members',
    description: 'Sangguniang Bayan Members',
    images: ['/homepage-images/sb-member-1.jpg', '/homepage-images/sb-member-2.jpg', '/homepage-images/sb-member-3.jpg','/homepage-images/sb-member-4.jpg', '/homepage-images/sb-member-5.jpg', '/homepage-images/sb-member-7.jpg', '/homepage-images/sb-member-8.jpg']
  },
  {
    id: 'sb_secretary',
    name: 'SB Secretary',
    description: 'Secretary to the SB',
    images: ['/homepage-images/sb-secretary.jpg']
  },
  {
    id: 'legislative_staff',
    name: 'Legislative Staff',
    description: 'Support Staff',
    images: ['/homepage-images/staff-1.jpg', '/homepage-images/staff-2.jpg', '/homepage-images/staff-3.jpg', '/homepage-images/staff-4.jpg', '/homepage-images/staff-5.jpg', '/homepage-images/staff-6.jpg', '/homepage-images/staff-7.jpg', '/homepage-images/staff-8.jpg', '/homepage-images/staff-9.jpg', '/homepage-images/staff-10.jpg', '/homepage-images/staff-11.jpg', '/homepage-images/staff-12.jpg']
  }
];

// Category Grid Component - displays all images in a grid layout
const CategoryGrid: React.FC<{ category: typeof ORGANIZATION_CATEGORIES[0] }> = ({ category }) => {
  const images = category.images;
  
  // Determine grid columns based on image count
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-sm mx-auto';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 sm:grid-cols-2';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    if (count <= 9) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-4 sm:p-6">
        <div className={`grid ${getGridCols(images.length)} gap-4`}>
          {images.map((src, index) => (
            <div key={index} className="group">
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 shadow-md">
                <img 
                  src={src} 
                  alt={`${category.name} - ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2 font-medium">
                {category.id === 'legislative_staff' ? `Staff ${index + 1}` : 
                 category.id === 'sb_members' ? `SB Member ${index + 1}` :
                 category.name}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 text-center bg-gradient-to-b from-white to-gray-50 border-t">
        <h4 className="font-bold text-gray-900 text-lg">{category.name}</h4>
        <p className="text-blue-600 font-medium text-sm">{category.description}</p>
        {images.length > 1 && (
          <p className="text-gray-400 text-xs mt-1">{images.length} members</p>
        )}
      </div>
    </div>
  );
};

const LegislativeOrganizationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-blue-600 mr-3" />
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Legislative Organization
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Meet the dedicated officials serving the people of San Francisco, Southern Leyte
          </p>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-4"></div>
        </div>

        {/* Organization Grid Layout - Vertical stack order */}
        <div className="space-y-8">
          {/* Vice Mayor */}
          <CategoryGrid category={ORGANIZATION_CATEGORIES[0]} />
          
          {/* SB Members */}
          <CategoryGrid category={ORGANIZATION_CATEGORIES[1]} />
          
          {/* SB Secretary */}
          <CategoryGrid category={ORGANIZATION_CATEGORIES[2]} />
          
          {/* Legislative Staff */}
          <CategoryGrid category={ORGANIZATION_CATEGORIES[3]} />
        </div>
      </div>
    </div>
  );
};

export default LegislativeOrganizationPage;
