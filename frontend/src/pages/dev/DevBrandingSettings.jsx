import React from 'react';
import { Palette, Image, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const DevBrandingSettings = () => {
  return (
    <div className="max-w-4xl" data-testid="dev-branding-settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-7 h-7 text-[#6e2ea8]" />
            Branding Settings
          </h2>
          <p className="text-gray-500 mt-1">Customize logo, colors, and visual identity</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Image className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <CardTitle className="text-base">Logo Settings</CardTitle>
              <CardDescription>Configure site logos for different contexts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Primary Logo</Label>
                <Input 
                  defaultValue="https://customer-assets.emergentagent.com/job_35efb418-d957-4303-979f-4e5863096b08/artifacts/hzi2b2xm_amino-chain-logo-final-1.png"
                  className="mt-1" 
                />
                <p className="text-xs text-gray-500 mt-1">Used in header and emails</p>
              </div>
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
                <img 
                  src="https://customer-assets.emergentagent.com/job_35efb418-d957-4303-979f-4e5863096b08/artifacts/hzi2b2xm_amino-chain-logo-final-1.png" 
                  alt="Logo preview" 
                  className="max-h-16" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Dark Logo</Label>
                <Input placeholder="URL for logo on dark backgrounds" className="mt-1" />
                <p className="text-xs text-gray-500 mt-1">Used when background is dark</p>
              </div>
              <div className="flex items-center justify-center bg-gray-800 rounded-lg p-4">
                <span className="text-gray-400 text-sm">No dark logo set</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Color Scheme</CardTitle>
              <CardDescription>Define brand colors used throughout the site</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#6e2ea8' }}></div>
                <Input defaultValue="#6e2ea8" className="font-mono" />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#6e2ea8' }}></div>
                <Input defaultValue="#6e2ea8" className="font-mono" />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#2d5a8f' }}></div>
                <Input defaultValue="#2d5a8f" className="font-mono" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Type className="w-5 h-5 text-[#6e2ea8]" />
            </div>
            <div>
              <CardTitle className="text-base">Typography</CardTitle>
              <CardDescription>Configure fonts and text styles</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Heading Font</Label>
              <Input defaultValue="Inter" className="mt-1" />
            </div>
            <div>
              <Label>Body Font</Label>
              <Input defaultValue="Inter" className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 pt-4 mt-4 border-t">
            <Button>Save Branding</Button>
            <Button variant="outline">Reset to Default</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevBrandingSettings;
