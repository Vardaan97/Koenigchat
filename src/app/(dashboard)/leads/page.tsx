'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Header } from '@/components/dashboard/header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  UserCheck,
  Download,
  Search,
  Mail,
  Phone,
  Building,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import type { Lead } from '@/types';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/leads?${params}`);
      const data = await response.json();
      setLeads(data.data || []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleSyncCRM = async () => {
    setSyncing(true);
    try {
      await fetch('/api/leads/sync-crm', { method: 'PUT' });
      await fetchLeads();
    } catch (error) {
      console.error('CRM sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Score', 'Created At'];
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.phone || '',
      l.company || '',
      l.status,
      l.lead_score,
      format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(search.toLowerCase()))
  );

  const statusColors = {
    new: 'default',
    qualified: 'success',
    unqualified: 'secondary',
    contacted: 'warning',
    converted: 'success',
  } as const;

  // Stats
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified').length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;
  const unsyncedLeads = leads.filter((l) => !l.crm_synced).length;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Leads"
        description="Manage captured leads from chat conversations"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSyncCRM} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to CRM'}
              {unsyncedLeads > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unsyncedLeads}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total Leads" value={totalLeads} icon={Users} iconColor="text-blue-600" />
          <StatsCard
            title="Qualified"
            value={qualifiedLeads}
            icon={UserCheck}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Converted"
            value={convertedLeads}
            icon={UserCheck}
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Pending CRM Sync"
            value={unsyncedLeads}
            icon={RefreshCw}
            iconColor="text-orange-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No leads found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Leads from chat conversations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{lead.name}</h3>
                        <Badge variant={statusColors[lead.status]}>{lead.status}</Badge>
                        <Badge variant="outline">Score: {lead.lead_score}</Badge>
                        {lead.crm_synced ? (
                          <Badge variant="success" className="text-xs">
                            CRM Synced
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Pending Sync
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${lead.email}`} className="hover:underline">
                            {lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${lead.phone}`} className="hover:underline">
                              {lead.phone}
                            </a>
                          </div>
                        )}
                        {lead.company && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-4 w-4" />
                            <span>{lead.company}</span>
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          {format(new Date(lead.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>

                      {lead.interested_courses && lead.interested_courses.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Interested in:</p>
                          <div className="flex flex-wrap gap-1">
                            {lead.interested_courses.map((course, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {course.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {lead.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{lead.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {lead.conversation_id && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/conversations/${lead.conversation_id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Chat
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
