import React from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function StyleGuide() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold font-display mb-2">RailSync Design System</h1>
        <p className="text-muted-foreground">Premium, modern, trustworthy operations product built for a national railway.</p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold border-b pb-2 mb-6">Typography</h2>
        <div className="space-y-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Display / Headings (Plus Jakarta Sans)</div>
            <h1 className="text-5xl font-display font-bold">The quick brown fox (H1)</h1>
            <h2 className="text-4xl font-display font-semibold mt-2">The quick brown fox (H2)</h2>
            <h3 className="text-3xl font-display font-semibold mt-2">The quick brown fox (H3)</h3>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Body / UI Text (Inter)</div>
            <p className="text-base font-body">The quick brown fox jumps over the lazy dog. Used for all general UI elements, paragraphs, and standard tables.</p>
            <p className="text-sm font-body mt-2">The quick brown fox jumps over the lazy dog. (Small body text)</p>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Technical / Monospace (JetBrains Mono)</div>
            <div className="font-mono text-sm bg-slate-100 p-2 rounded">
              BLOCK-ID: 9283-TR-ENG<br/>
              TIMESTAMP: 2026-09-17T09:24:00Z
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold border-b pb-2 mb-6">Colors</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Functional Palette</h3>
            <div className="flex flex-wrap gap-4">
              <ColorSwatch name="Complete / Sanctioned" bg="bg-[#22c55e]" fg="text-white" />
              <ColorSwatch name="Caution / Proposed" bg="bg-[#f59e0b]" fg="text-white" />
              <ColorSwatch name="Error / Critical" bg="bg-[#ef4444]" fg="text-white" />
              <ColorSwatch name="Information" bg="bg-[#3b82f6]" fg="text-white" />
              <ColorSwatch name="Unavailable" bg="bg-[#9ca3af]" fg="text-white" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Department Colors</h3>
            <div className="flex flex-wrap gap-4">
              <ColorSwatch name="Engineering" bg="bg-[#475569]" fg="text-white" />
              <ColorSwatch name="Signal & Telecom" bg="bg-[#0d9488]" fg="text-white" />
              <ColorSwatch name="Traction" bg="bg-[#8b5cf6]" fg="text-white" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Brand & Shell</h3>
            <div className="flex flex-wrap gap-4">
              <ColorSwatch name="Primary Accent (Saffron)" bg="bg-[var(--color-rail-saffron)]" fg="text-white" />
              <ColorSwatch name="Nav Shell" bg="bg-[var(--color-shell-nav)]" fg="text-white" />
              <ColorSwatch name="Background" bg="bg-[var(--color-shell-bg)]" fg="text-black border" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold border-b pb-2 mb-6">Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex gap-4">
                <Button isLoading>Processing</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Sanctioned</Badge>
                <Badge variant="warning">Overrun</Badge>
                <Badge variant="critical">Rejected</Badge>
                <Badge variant="info">Proposed</Badge>
                <Badge variant="unavailable">Draft</Badge>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Badge variant="eng">ENG - Track</Badge>
                <Badge variant="sig">S&T - Interlocking</Badge>
                <Badge variant="trc">TRC - OHE</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Block Request ID" placeholder="Enter ID..." />
              <Input label="Reason" error="This field is required" defaultValue="Track Maintenance" />
              <Input label="Start Time" helperText="Browser local time will be converted to UTC" type="datetime-local" />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function ColorSwatch({ name, bg, fg }: { name: string, bg: string, fg: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-24 h-24 rounded-lg shadow-sm flex items-center justify-center font-mono text-xs text-center p-2 ${bg} ${fg}`}>
        {name}
      </div>
    </div>
  );
}
