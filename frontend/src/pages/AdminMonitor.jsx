import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminMonitor() {
  const [liveFeed] = useState([
    { id: '1', passengerId: 'BIO-***9X2', location: 'Security Checkpoint A', matchScore: 98.7, timestamp: new Date(Date.now() - 5000), status: 'Pass' },
    { id: '2', passengerId: 'BIO-***3F1', location: 'Gate 42 Boarding', matchScore: 99.1, timestamp: new Date(Date.now() - 15000), status: 'Pass' },
    { id: '3', passengerId: 'UNKNOWN_***', location: 'Terminal 2 Entrance', matchScore: 42.1, timestamp: new Date(Date.now() - 45000), status: 'Alert' },
  ]);

  return (
    <div className="flex flex-col space-y-6 w-full pb-8">
      <div className="flex flex-col space-y-2 border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">
          Live Monitoring
        </h1>
        <div className="flex justify-between items-center">
          <p className="text-primary text-xs font-medium flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            Live Feed
          </p>
          <Badge variant="secondary" className="text-[10px]">
            System <span className="text-emerald-600 ml-1">Online</span>
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {liveFeed.map((event) => (
          <Card key={event.id} className="rounded-xl bg-card border-border shadow-sm active:scale-[0.98] transition-all">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-foreground text-sm">
                    {event.passengerId}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">
                    @ {event.location}
                  </div>
                </div>
                <Badge variant={event.status === 'Pass' ? 'success' : 'destructive'}>
                  <span className={`w-1.5 h-1.5 rounded-full ${event.status === 'Pass' ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`}></span>
                  {event.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${event.matchScore > 80 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${event.matchScore}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${event.matchScore > 80 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {event.matchScore.toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {liveFeed.length === 0 && (
          <Card className="rounded-xl bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Waiting for events...
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
