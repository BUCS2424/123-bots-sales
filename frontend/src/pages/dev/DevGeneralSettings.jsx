import React, { useState } from 'react';
import { Settings, Globe, Lock, ChevronDown, ChevronUp, Edit, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';

const DevGeneralSettings = () => {
  const [expandedSections, setExpandedSections] = useState(['system']);
  const [isEditing, setIsEditing] = useState(false);
  
  const [settings, setSettings] = useState({
    adminEmail: 'mel@a2gdesigns.com',
    supportEmail: 'support@123bots.com',
    maintenanceMode: false,
    debugMode: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const SettingsSection = ({ id, title, description, children, locked = false }) => {
    const isExpanded = expandedSections.includes(id);
    
    return (
      <Card className="mb-4">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-[#6e2ea8]" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {title}
                  {locked && <Lock className="w-4 h-4 text-gray-400" />}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {locked && <Badge variant="outline">Locked</Badge>}
              {!isEditing && !locked && (
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="max-w-4xl" data-testid="dev-general-settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-[#6e2ea8]" />
            General Settings
          </h2>
          <p className="text-gray-500 mt-1">Configure system modes and contact settings</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Site
          </a>
        </Button>
      </div>

      {/* System Settings */}
      <SettingsSection 
        id="system" 
        title="System Settings" 
        description="Maintenance mode and debug options"
      >
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-gray-500">Show maintenance page to visitors</p>
            </div>
            <Switch 
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Debug Mode</p>
              <p className="text-sm text-gray-500">Enable detailed error logging</p>
            </div>
            <Switch 
              checked={settings.debugMode}
              onCheckedChange={(checked) => setSettings({...settings, debugMode: checked})}
            />
          </div>
        </div>
      </SettingsSection>

      {/* Contact Settings */}
      <SettingsSection 
        id="contact" 
        title="Contact Settings" 
        description="Admin and support email addresses"
      >
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Admin Email</Label>
              <Input 
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Support Email</Label>
              <Input 
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default DevGeneralSettings;
