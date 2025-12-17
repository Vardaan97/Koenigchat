'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import type { Course } from '@/types';

export default function KnowledgeBasePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    total_courses: 0,
    total_lps: 0,
    total_articles: 0,
    indexed_courses: 0,
    last_sync: null as string | null,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/knowledge/stats');
      const statsData = await statsRes.json();
      setStats(statsData.data || stats);

      // Fetch courses
      const coursesRes = await fetch(`/api/knowledge/courses?limit=20&search=${searchQuery}`);
      const coursesData = await coursesRes.json();
      setCourses(coursesData.data || []);
    } catch (error) {
      console.error('Failed to fetch knowledge base data:', error);
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

  const displayCourses = courses.length > 0 ? courses : mockCourses;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Knowledge Base"
        description="Manage course data and AI training content"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
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
            title="FAQ Articles"
            value={stats.total_articles || 450}
            icon={FileText}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Indexed for Search"
            value={`${stats.indexed_courses || 4800} / ${stats.total_courses || 5000}`}
            icon={CheckCircle}
            iconColor="text-emerald-600"
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
          <Button variant="default">Courses</Button>
          <Button variant="ghost" onClick={() => (window.location.href = '/knowledge-base/articles')}>
            Articles & FAQs
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = '/knowledge-base/documents')}>
            Documents
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses by name, vendor, or certification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Courses List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
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
                      <Badge variant={course.is_active ? 'success' : 'secondary'}>
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
      </div>
    </div>
  );
}
