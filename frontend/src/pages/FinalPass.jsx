import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, ScanFace, Fingerprint, Plane } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function FinalPass() {
  const location = useLocation();
  const userData = location.state?.userData || { fullName: 'JOHN DOE', nationality: 'USA', passportNumber: 'SECURE-X1' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col gap-6 h-full bg-background overflow-y-auto sm:bg-card sm:border sm:border-border sm:rounded-2xl sm:shadow-sm sm:max-w-lg sm:mx-auto sm:h-auto"
    >
      <div className="text-center flex flex-col items-center w-full">
        <Badge variant="success" className="mb-3">
          <CheckCircle2 className="w-4 h-4" />
          Verified
        </Badge>
        <h1 className="text-2xl font-bold text-foreground">
          Your Boarding Pass
        </h1>
        <p className="text-muted-foreground text-sm mt-1">You're all set for your flight!</p>
      </div>

      <Card className="w-full p-5">
        <CardHeader className="flex-row justify-between items-start space-y-0 px-0 pt-0">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground mb-1">Passenger</div>
            <div className="text-lg font-bold text-foreground truncate">
              {userData.fullName}
            </div>
          </div>

          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 shrink-0 ml-3">
            <ScanFace className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
        </CardHeader>

        <CardContent className="px-0 pt-4 pb-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Document No.</div>
              <div className="text-sm text-foreground font-medium truncate">•••{userData.passportNumber?.slice(-4) || '1234'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Citizenship</div>
              <div className="text-sm text-foreground font-medium truncate">{userData.nationality}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Flight</div>
              <div className="text-sm text-foreground font-medium">{userData.flightNumber || 'SG372'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Gate</div>
              <div className="text-sm text-foreground font-medium">{userData.gate || 'A7'}</div>
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="w-full bg-green-50 rounded-xl p-3 flex items-center justify-center border border-green-200">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </div>
          <span className="text-green-700 text-sm font-medium">Biometric Pass Active</span>
        </div>
      </div>

      <div className="w-full">
        <h2 className="text-sm font-semibold text-foreground mb-3">At the airport</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Fingerprint className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Go to immigration</p>
              <p className="text-xs text-muted-foreground">Look at the biometric camera — no passport needed, your face is your ID.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Plane className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Board your flight</p>
              <p className="text-xs text-muted-foreground">Head to Gate {userData.gate || 'A7'} — scan your face at the gate to board.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
