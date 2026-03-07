import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ScanFace, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FinalPass() {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = location.state?.userData || { fullName: 'JOHN DOE', nationality: 'USA', passportNumber: 'SECURE-X1' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center h-full bg-[#020617] px-5 py-8"
    >
      <div className="text-center mb-8 flex flex-col items-center w-full">
        <Badge variant="success" className="mb-4 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
          <CheckCircle2 className="w-4 h-4" />
          Identity Minted
        </Badge>
        <h1 className="text-2xl font-black text-white uppercase tracking-widest">
          Digital Token
        </h1>
      </div>

      <motion.div whileHover={{ scale: 1.02 }}>
        <Card className="w-full max-w-sm p-6">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <CardHeader className="flex-row justify-between items-start space-y-0 px-0 pt-0">
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Authenticated User</div>
              <div className="text-xl font-bold tracking-wider text-white uppercase truncate max-w-[180px]">
                {userData.fullName}
              </div>
            </div>

            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <ScanFace className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_5px_currentColor]" strokeWidth={1.5} />
            </div>
          </CardHeader>

          <CardContent className="px-0 pt-5 pb-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Document No.</div>
                <div className="font-mono text-slate-200 text-sm tracking-widest uppercase truncate">•••{userData.passportNumber?.slice(-4) || '1234'}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Citizenship</div>
                <div className="font-mono text-slate-200 text-sm tracking-widest uppercase truncate">{userData.nationality}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Clearance Level</div>
                <div className="font-mono text-cyan-400 font-bold text-sm tracking-widest uppercase">Global-1</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Token Hash</div>
                <div className="font-mono text-slate-400 text-xs tracking-widest truncate">0x7F...9A2</div>
              </div>
            </div>

            <div className="mt-6 bg-[#020617] rounded-xl p-3 flex items-center justify-center border border-emerald-900/50 shadow-inner">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold">Biometrically Verified</span>
              </div>
            </div>
          </CardContent>

          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none z-10 opacity-30"></div>
        </Card>
      </motion.div>

      <div className="mt-10 w-full flex flex-col items-center flex-1 max-w-sm">
         <Badge variant="secondary" className="border-border bg-slate-900/30">
           System: Ready for Airport Flow
         </Badge>

         <div className="mt-auto w-full pb-6">
           <Button
             variant="accent"
             size="lg"
             onClick={() => alert("Navigate to actual Airport Flight timeline...")}
             className="w-full flex items-center justify-between"
             asChild
           >
             <motion.button whileTap={{ scale: 0.96 }}>
               <span>Enter Airport Mode</span>
               <ChevronRight className="w-5 h-5" />
             </motion.button>
           </Button>
         </div>
      </div>
    </motion.div>
  );
}
