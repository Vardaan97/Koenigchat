'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/dashboard/header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen,
  FileText,
  GraduationCap,
  Upload,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle,
  Clock,
  Plus,
  X,
  FileUp,
  Trash2,
  Edit,
  Save,
} from 'lucide-react';
import type { Course } from '@/types';

type Tab = 'courses' | 'articles' | 'documents';
type ModalType = 'article' | 'course' | 'csv' | 'document' | null;

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  status: 'processing' | 'indexed' | 'failed';
  chunk_count: number;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({
    total_courses: 0,
    total_lps: 0,
    total_articles: 0,
    total_documents: 0,
    indexed_courses: 0,
    last_sync: null as string | null,
  });

  // Form states
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'FAQ',
    tags: '',
  });

  const [courseForm, setCourseForm] = useState({
    title: '',
    course_code: '',
    vendor: '',
    certification: '',
    duration_hours: '',
    price_info: '',
    page_url: '',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, coursesRes, articlesRes, docsRes] = await Promise.all([
        fetch('/api/knowledge/stats'),
        fetch(`/api/knowledge/courses?limit=20&search=${searchQuery}`),
        fetch('/api/knowledge/articles'),
        fetch('/api/knowledge/documents'),
      ]);

      const [statsData, coursesData, articlesData, docsData] = await Promise.all([
        statsRes.json(),
        coursesRes.json(),
        articlesRes.json(),
        docsRes.json(),
      ]);

      setStats(statsData.data || stats);
      setCourses(coursesData.data || []);
      setArticles(articlesData.data || []);
      setDocuments(docsData.data || []);
    } catch (error) {
      console.error('Failed to fetch knowledge base data:', error);
      // Use mock data for demo
      setStats({
        total_courses: 5000,
        total_lps: 6000,
        total_articles: 450,
        total_documents: 25,
        indexed_courses: 4800,
        last_sync: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/knowledge/sync', { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/knowledge/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...articleForm,
          tags: articleForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setModalOpen(null);
        setArticleForm({ title: '', content: '', category: 'FAQ', tags: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create article:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/knowledge/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...courseForm,
          duration_hours: parseInt(courseForm.duration_hours) || null,
        }),
      });
      if (res.ok) {
        setModalOpen(null);
        setCourseForm({
          title: '',
          course_code: '',
          vendor: '',
          certification: '',
          duration_hours: '',
          price_info: '',
          page_url: '',
          description: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/knowledge/courses/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Successfully imported ${data.imported} courses`);
        setModalOpen(null);
        fetchData();
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } catch (error) {
      console.error('CSV upload failed:', error);
      alert('Failed to upload CSV');
    } finally {
      setSaving(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/knowledge/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setModalOpen(null);
        fetchData();
      }
    } catch (error) {
      console.error('Document upload failed:', error);
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await fetch(`/api/knowledge/articles/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await fetch(`/api/knowledge/documents/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  // Mock data for demo
  const mockCourses: Course[] = [
    {
      id: '1',
      title: 'AZ-104T00: Microsoft Azure Administrator',
      slug: 'microsoft-azure-administrator-training',
      course_code: 'AZ-104T00-A',
      vendor: 'Microsoft',
      certification: 'Microsoft Certified: Azure Administrator Associate',
      duration_hours: 32,
      price_info: 'EUR 1,950',
      page_url: 'https://www.koenig-solutions.com/microsoft-azure-administrator-training',
      is_active: true,
      objectives: [],
      key_features: [],
      topics_covered: [],
      usps: [],
      delivery_modes: [],
      credibility_markers: [],
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'PL-300T00: Design and Manage Analytics Solutions Using Power BI',
      slug: 'microsoft-power-bi-certification-training-course',
      course_code: 'PL-300T00',
      vendor: 'Microsoft',
      certification: 'PL-300 / Power BI Data Analyst',
      duration_hours: 24,
      price_info: 'EUR 1,550',
      page_url: 'https://www.koenig-solutions.com/microsoft-power-bi-certification-training-course',
      is_active: true,
      objectives: [],
      key_features: [],
      topics_covered: [],
      usps: [],
      delivery_modes: [],
      credibility_markers: [],
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'AWS Solutions Architect Associate',
      slug: 'aws-solutions-architect-associate',
      course_code: 'AWS-SAA',
      vendor: 'AWS',
      certification: 'AWS Certified Solutions Architect - Associate',
      duration_hours: 40,
      price_info: 'EUR 1,800',
      page_url: 'https://www.koenig-solutions.com/aws-solutions-architect-associate',
      is_active: true,
      objectives: [],
      key_features: [],
      topics_covered: [],
      usps: [],
      delivery_modes: [],
      credibility_markers: [],
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'What payment methods do you accept?',
      content: 'We accept all major credit cards, PayPal, bank transfers, and corporate purchase orders.',
      category: 'FAQ',
      tags: ['payment', 'billing'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'How do I get a certification after course completion?',
      content: 'Upon successful completion of the course and passing the exam, you will receive a digital certificate within 5-7 business days.',
      category: 'FAQ',
      tags: ['certification', 'completion'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockDocuments: Document[] = [
    {
      id: '1',
      filename: 'Koenig_Training_Policies.pdf',
      file_type: 'application/pdf',
      size_bytes: 245000,
      status: 'indexed',
      chunk_count: 15,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      filename: 'Course_Prerequisites_Guide.md',
      file_type: 'text/markdown',
      size_bytes: 12000,
      status: 'indexed',
      chunk_count: 8,
      created_at: new Date().toISOString(),
    },
  ];

  const displayCourses = courses.length > 0 ? courses : mockCourses;
  const displayArticles = articles.length > 0 ? articles : mockArticles;
  const displayDocuments = documents.length > 0 ? documents : mockDocuments;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Knowledge Base"
        description="Manage course data, articles, and AI training content"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button onClick={() => setModalOpen(activeTab === 'courses' ? 'course' : activeTab === 'articles' ? 'article' : 'document')}>
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === 'courses' ? 'Course' : activeTab === 'articles' ? 'Article' : 'Document'}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Courses"
            value={stats.total_courses || 5000}
            icon={GraduationCap}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Learning Paths"
            value={stats.total_lps || 6000}
            icon={BookOpen}
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Articles & FAQs"
            value={stats.total_articles || 450}
            icon={FileText}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Documents"
            value={stats.total_documents || 25}
            icon={FileUp}
            iconColor="text-orange-600"
          />
        </div>

        {/* Last Sync Info */}
        {stats.last_sync && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last synced: {new Date(stats.last_sync).toLocaleString()}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={activeTab === 'courses' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('courses')}
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Courses
          </Button>
          <Button
            variant={activeTab === 'articles' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('articles')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Articles & FAQs
          </Button>
          <Button
            variant={activeTab === 'documents' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('documents')}
          >
            <FileUp className="h-4 w-4 mr-2" />
            Documents
          </Button>
          {activeTab === 'courses' && (
            <Button variant="outline" className="ml-auto" onClick={() => setModalOpen('csv')}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div className="space-y-4">
                {displayCourses.map((course) => (
                  <Card key={course.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{course.vendor}</Badge>
                            {course.course_code && (
                              <Badge variant="secondary">{course.course_code}</Badge>
                            )}
                          </div>
                          <h3 className="font-medium mb-1">{course.title}</h3>
                          {course.certification && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Certification: {course.certification}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {course.duration_hours && <span>{course.duration_hours} hours</span>}
                            {course.price_info && <span>{course.price_info}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={course.is_active ? 'default' : 'secondary'}>
                            {course.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {course.page_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={course.page_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Articles Tab */}
            {activeTab === 'articles' && (
              <div className="space-y-4">
                {displayArticles.map((article) => (
                  <Card key={article.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{article.category}</Badge>
                            {article.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="font-medium mb-2">{article.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteArticle(article.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {displayDocuments.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-lg">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-medium">{doc.filename}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{formatFileSize(doc.size_bytes)}</span>
                              <span>{doc.chunk_count} chunks indexed</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              doc.status === 'indexed'
                                ? 'default'
                                : doc.status === 'processing'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {doc.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {modalOpen === 'article' && 'Create Article'}
                {modalOpen === 'course' && 'Add Course'}
                {modalOpen === 'csv' && 'Import Courses from CSV'}
                {modalOpen === 'document' && 'Upload Document'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setModalOpen(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4">
              {/* Article Form */}
              {modalOpen === 'article' && (
                <form onSubmit={handleCreateArticle} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={articleForm.title}
                      onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                      placeholder="e.g., What are the prerequisites for AZ-104?"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={articleForm.category}
                      onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    >
                      <option value="FAQ">FAQ</option>
                      <option value="Policy">Policy</option>
                      <option value="Technical">Technical</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                      placeholder="Write the article content here..."
                      rows={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tags (comma-separated)</label>
                    <Input
                      value={articleForm.tags}
                      onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                      placeholder="e.g., azure, prerequisites, certification"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Article'}
                  </Button>
                </form>
              )}

              {/* Course Form */}
              {modalOpen === 'course' && (
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Course Title</label>
                    <Input
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      placeholder="e.g., Microsoft Azure Administrator"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Course Code</label>
                      <Input
                        value={courseForm.course_code}
                        onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                        placeholder="e.g., AZ-104"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vendor</label>
                      <Input
                        value={courseForm.vendor}
                        onChange={(e) => setCourseForm({ ...courseForm, vendor: e.target.value })}
                        placeholder="e.g., Microsoft"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Certification</label>
                    <Input
                      value={courseForm.certification}
                      onChange={(e) => setCourseForm({ ...courseForm, certification: e.target.value })}
                      placeholder="e.g., Azure Administrator Associate"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Duration (hours)</label>
                      <Input
                        type="number"
                        value={courseForm.duration_hours}
                        onChange={(e) => setCourseForm({ ...courseForm, duration_hours: e.target.value })}
                        placeholder="e.g., 32"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <Input
                        value={courseForm.price_info}
                        onChange={(e) => setCourseForm({ ...courseForm, price_info: e.target.value })}
                        placeholder="e.g., EUR 1,950"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Page URL</label>
                    <Input
                      type="url"
                      value={courseForm.page_url}
                      onChange={(e) => setCourseForm({ ...courseForm, page_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      placeholder="Course description..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Course'}
                  </Button>
                </form>
              )}

              {/* CSV Import */}
              {modalOpen === 'csv' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with the following columns:
                  </p>
                  <div className="bg-muted p-3 rounded-md text-xs font-mono">
                    URL, Course Name, Code, Vendor, Certification, Duration, Category, Price
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <Button onClick={() => csvInputRef.current?.click()} disabled={saving}>
                      {saving ? 'Uploading...' : 'Select CSV File'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Document Upload */}
              {modalOpen === 'document' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload PDF, Markdown, or text documents to add to the knowledge base.
                    Documents will be automatically chunked and indexed for AI retrieval.
                  </p>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.md,.txt,.docx"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                    <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={saving}>
                      {saving ? 'Uploading...' : 'Select Document'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported: PDF, Markdown, TXT, DOCX (max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
