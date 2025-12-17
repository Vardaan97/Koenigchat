'use client';

import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Palette,
  Bell,
  Shield,
  Database,
  Webhook,
  Save,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Widget Settings
    widget: {
      primaryColor: '#0066CC',
      greeting: 'Hi! Welcome to Koenig Solutions. How can I help you find the right IT training course today?',
      agentName: 'Koenig Assistant',
      companyName: 'Koenig Solutions',
      placeholder: 'Type your message...',
      position: 'bottom-right',
      collectEmail: true,
    },
    // AI Settings
    ai: {
      primaryModel: 'claude-sonnet-4-20250514',
      fallbackModel: 'gpt-4o',
      maxResponseLength: 500,
      temperature: 0.7,
    },
    // CRM Settings
    crm: {
      webhookUrl: '',
      webhookSecret: '',
      autoSync: true,
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      // Show success message
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Settings"
        description="Configure chatbot behavior and integrations"
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        }
      />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Navigation */}
        <div className="flex gap-2 border-b pb-4">
          <Button variant="default">General</Button>
          <Button variant="ghost" onClick={() => (window.location.href = '/settings/widget')}>
            Widget
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = '/settings/prompts')}>
            AI Prompts
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = '/settings/team')}>
            Team
          </Button>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Widget Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Widget Appearance</CardTitle>
              </div>
              <CardDescription>Customize how the chat widget looks on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.widget.primaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          widget: { ...settings.widget, primaryColor: e.target.value },
                        })
                      }
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.widget.primaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          widget: { ...settings.widget, primaryColor: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Position</label>
                  <select
                    value={settings.widget.position}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        widget: { ...settings.widget, position: e.target.value },
                      })
                    }
                    className="w-full h-10 border rounded-md px-3"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Agent Name</label>
                <Input
                  value={settings.widget.agentName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      widget: { ...settings.widget, agentName: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Greeting Message</label>
                <Textarea
                  value={settings.widget.greeting}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      widget: { ...settings.widget, greeting: e.target.value },
                    })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>AI Configuration</CardTitle>
              </div>
              <CardDescription>Configure AI model settings and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Primary Model</label>
                  <select
                    value={settings.ai.primaryModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, primaryModel: e.target.value },
                      })
                    }
                    className="w-full h-10 border rounded-md px-3"
                  >
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Fallback Model</label>
                  <select
                    value={settings.ai.fallbackModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, fallbackModel: e.target.value },
                      })
                    }
                    className="w-full h-10 border rounded-md px-3"
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Max Response Length (tokens)
                  </label>
                  <Input
                    type="number"
                    value={settings.ai.maxResponseLength}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, maxResponseLength: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Temperature (0-1)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={settings.ai.temperature}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, temperature: parseFloat(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CRM Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                <CardTitle>CRM Integration</CardTitle>
              </div>
              <CardDescription>Connect leads to your CRM system via webhook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Webhook URL</label>
                <Input
                  type="url"
                  placeholder="https://your-crm.com/api/webhook/leads"
                  value={settings.crm.webhookUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      crm: { ...settings.crm, webhookUrl: e.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leads will be sent to this URL when captured
                </p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Webhook Secret</label>
                <Input
                  type="password"
                  placeholder="Enter webhook secret for verification"
                  value={settings.crm.webhookSecret}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      crm: { ...settings.crm, webhookSecret: e.target.value },
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={settings.crm.autoSync}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      crm: { ...settings.crm, autoSync: e.target.checked },
                    })
                  }
                  className="rounded"
                />
                <label htmlFor="autoSync" className="text-sm">
                  Automatically sync leads to CRM
                </label>
              </div>
              <Button variant="outline" size="sm">
                Test Webhook Connection
              </Button>
            </CardContent>
          </Card>

          {/* Embed Code */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Embed Code</CardTitle>
              </div>
              <CardDescription>Add this code to your website to display the chat widget</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<script>
  (function(w,d,s,o,f,js,fjs){
    w['KoenigChat']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','kchat','https://chat.learnova.training/widget/loader.js'));

  kchat('init', {
    apiKey: 'YOUR_API_KEY',
    position: '${settings.widget.position}',
    primaryColor: '${settings.widget.primaryColor}'
  });
</script>`}
              </pre>
              <Button variant="outline" size="sm" className="mt-4">
                Copy Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
