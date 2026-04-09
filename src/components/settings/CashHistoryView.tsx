import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SettingsManager } from "@/lib/settingsManager";

interface ClosedSession {
  id: string;
  drawer_name: string;
  starting_cash: number;
  closing_cash: number | null;
  expected_in_drawer: number;
  difference: number;
  cash_sales: number;
  cash_refunds: number;
  opened_at: string;
  closed_at: string | null;
}

interface CashTx {
  id: string;
  type: string;
  amount: number;
  reason: string;
  employee_name: string | null;
  note: string | null;
  created_at: string;
}

const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}`;
const signedFmt = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`;

const getStatus = (diff: number) => {
  if (diff === 0) return { label: "Matched", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
  if (diff > 0) return { label: "Over", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" };
  return { label: "Short", color: "bg-red-500/15 text-red-400 border-red-500/20" };
};

const CashHistoryView = () => {
  const [sessions, setSessions] = useState<ClosedSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Record<string, CashTx[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await SettingsManager.getAllClosedSessions();
      setSessions(data);
      setLoading(false);
    };
    load();
  }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!transactions[id]) {
      const txs = await SettingsManager.getCashTransactions(id);
      setTransactions(prev => ({ ...prev, [id]: txs }));
    }
  };

  // Build running balance for a session's transactions
  const getRunningBalance = (session: ClosedSession, txs: CashTx[]) => {
    let balance = Number(session.starting_cash);
    const rows: Array<{ tx: CashTx; balanceAfter: number }> = [];
    for (const tx of txs) {
      if (tx.type === 'pay_in') balance += Number(tx.amount);
      else if (tx.type === 'pay_out') balance -= Number(tx.amount);
      rows.push({ tx, balanceAfter: balance });
    }
    return rows;
  };

  if (loading) {
    return (
      <div className="mt-6">
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">History</h2>
        <div className="bg-neutral-800/60 rounded-2xl p-8 flex items-center justify-center">
          <span className="text-neutral-500 text-sm">Loading history...</span>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">History</h2>
        <div className="bg-neutral-800/60 rounded-2xl p-8 flex items-center justify-center">
          <span className="text-neutral-500 text-sm">No closed drawer sessions yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">History</h2>
      <div className="space-y-3">
        {sessions.map((session) => {
          const diff = Number(session.difference);
          const status = getStatus(diff);
          const isExpanded = expandedId === session.id;
          const closedAt = session.closed_at ? new Date(session.closed_at) : null;
          const openedAt = new Date(session.opened_at);
          const txs = transactions[session.id] || [];
          const runningRows = isExpanded ? getRunningBalance(session, txs) : [];
          const paidInOut = txs.reduce((acc, t) => {
            return acc + (t.type === 'pay_in' ? Number(t.amount) : -Number(t.amount));
          }, 0);

          return (
            <div key={session.id} className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              {/* Session Header Row - clickable */}
              <button
                onClick={() => toggleExpand(session.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-neutral-700/20 transition-colors"
              >
                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  )}
                </div>

                {/* Date & Shift */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {closedAt ? format(closedAt, 'MMM d, yyyy') : 'N/A'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {format(openedAt, 'hh:mm a')} – {closedAt ? format(closedAt, 'hh:mm a') : '...'}
                  </p>
                </div>

                {/* Drawer */}
                <div className="hidden md:block flex-shrink-0 w-36">
                  <p className="text-xs text-neutral-500">Drawer</p>
                  <p className="text-sm text-foreground">{session.drawer_name}</p>
                </div>

                {/* Expected */}
                <div className="flex-shrink-0 w-24 text-right">
                  <p className="text-xs text-neutral-500">Expected</p>
                  <p className="text-sm text-foreground">{fmt(Number(session.expected_in_drawer))}</p>
                </div>

                {/* Actual */}
                <div className="flex-shrink-0 w-24 text-right">
                  <p className="text-xs text-neutral-500">Actual</p>
                  <p className="text-sm text-foreground">{session.closing_cash != null ? fmt(Number(session.closing_cash)) : '—'}</p>
                </div>

                {/* Variance */}
                <div className="flex-shrink-0 w-24 text-right">
                  <p className="text-xs text-neutral-500">Variance</p>
                  <p className={`text-sm font-medium ${diff === 0 ? 'text-foreground' : diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff > 0 ? '+' : ''}{signedFmt(diff)}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0 w-20 flex justify-end">
                  <Badge className={`text-[10px] font-semibold px-2.5 py-0.5 ${status.color}`}>
                    {status.label}
                  </Badge>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-neutral-700/40 px-5 pb-5">
                  {/* Reconciliation Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
                    <div className="bg-neutral-900/50 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Starting Cash</p>
                      <p className="text-base text-foreground font-medium mt-1">{fmt(Number(session.starting_cash))}</p>
                    </div>
                    <div className="bg-neutral-900/50 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Cash Sales</p>
                      <p className="text-base text-foreground font-medium mt-1">{fmt(Number(session.cash_sales))}</p>
                    </div>
                    <div className="bg-neutral-900/50 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Cash Refunds</p>
                      <p className="text-base text-foreground font-medium mt-1">{fmt(Number(session.cash_refunds))}</p>
                    </div>
                    <div className="bg-neutral-900/50 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Paid In/Out</p>
                      <p className="text-base text-foreground font-medium mt-1">{signedFmt(paidInOut)}</p>
                    </div>
                  </div>

                  {/* Transaction Log Table */}
                  <h3 className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 px-1">Transaction Log</h3>
                  <div className="bg-neutral-900/40 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-neutral-700/30 hover:bg-transparent">
                          <TableHead className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">Time</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">Employee</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">Reason</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">Type</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Starting Cash row */}
                        <TableRow className="border-neutral-700/20 hover:bg-neutral-800/30">
                          <TableCell className="text-foreground text-xs py-2.5">{format(openedAt, 'hh:mm a')}</TableCell>
                          <TableCell className="text-foreground text-xs py-2.5">—</TableCell>
                          <TableCell className="text-foreground text-xs py-2.5">Starting Cash</TableCell>
                          <TableCell className="py-2.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">Opening</span>
                          </TableCell>
                          <TableCell className="text-foreground text-xs py-2.5 text-right">{fmt(Number(session.starting_cash))}</TableCell>
                          <TableCell className="text-foreground text-xs py-2.5 text-right font-medium">{fmt(Number(session.starting_cash))}</TableCell>
                        </TableRow>

                        {runningRows.length === 0 && (
                          <TableRow className="border-neutral-700/20">
                            <TableCell colSpan={6} className="text-center text-neutral-500 text-xs py-4">
                              No transactions recorded
                            </TableCell>
                          </TableRow>
                        )}

                        {runningRows.map(({ tx, balanceAfter }) => {
                          const isPayIn = tx.type === 'pay_in';
                          const typeLabel = isPayIn ? 'Pay In' : 'Pay Out';
                          const typeColor = isPayIn ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400';
                          const txTime = format(new Date(tx.created_at), 'hh:mm a');

                          return (
                            <TableRow key={tx.id} className="border-neutral-700/20 hover:bg-neutral-800/30">
                              <TableCell className="text-foreground text-xs py-2.5">{txTime}</TableCell>
                              <TableCell className="text-foreground text-xs py-2.5">{tx.employee_name || '—'}</TableCell>
                              <TableCell className="text-foreground text-xs py-2.5">
                                <div>
                                  {tx.reason}
                                  {tx.note && <span className="block text-neutral-500 text-[10px] mt-0.5">{tx.note}</span>}
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                              </TableCell>
                              <TableCell className={`text-xs py-2.5 text-right font-medium ${isPayIn ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isPayIn ? '+' : '-'}{fmt(Number(tx.amount))}
                              </TableCell>
                              <TableCell className="text-foreground text-xs py-2.5 text-right font-medium">{fmt(balanceAfter)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Reconciliation Footer */}
                  <div className="mt-4 bg-neutral-900/50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Expected</p>
                        <p className="text-sm text-foreground font-medium">{fmt(Number(session.expected_in_drawer))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Actual</p>
                        <p className="text-sm text-foreground font-medium">{session.closing_cash != null ? fmt(Number(session.closing_cash)) : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Variance</p>
                        <p className={`text-sm font-semibold ${diff === 0 ? 'text-foreground' : diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diff > 0 ? '+' : ''}{signedFmt(diff)}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xs font-semibold px-3 py-1 ${status.color}`}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CashHistoryView;
