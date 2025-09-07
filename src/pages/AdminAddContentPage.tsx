import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AdminUploadModal from '../components/admin/AdminUploadModal';

const AdminAddContentPage: React.FC = () => {
  const navigate = useNavigate();

  const handleContentAdded = () => {
    navigate('/admin/content');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/content')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content Library
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Content</CardTitle>
          <CardDescription>
            Upload a new video with associated questions for your study groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUploadModal onContentAdded={handleContentAdded} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAddContentPage;
