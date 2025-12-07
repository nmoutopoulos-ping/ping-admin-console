import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { mockRequests, InboundRequest, RequestStatus, executeInboundRequest } from "@/lib/mockRequests";
import { shortenAddress } from "@/lib/onchain";
import { Search, Eye, CheckCircle, XCircle, Clock, Zap, FileJson } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<RequestStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", icon: Clock },
  approved: { label: "Approved", className: "bg-blue-500/20 text-blue-500 border-blue-500/30", icon: CheckCircle },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive border-destructive/30", icon: XCircle },
  executed: { label: "Executed", className: "bg-primary/20 text-primary border-primary/30", icon: Zap },
};

function StatusPill({ status }: { status: RequestStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<InboundRequest[]>(mockRequests);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<InboundRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.toAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateRequestStatus = (id: string, newStatus: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    setSelectedRequest((prev) => (prev?.id === id ? { ...prev, status: newStatus } : prev));
  };

  const handleApproveAndExecute = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      const result = await executeInboundRequest(selectedRequest.id);
      if (result.success) {
        updateRequestStatus(selectedRequest.id, "executed");
        toast({
          title: "Request Executed",
          description: `Transaction submitted: ${result.txHash?.slice(0, 10)}...`,
        });
        setSelectedRequest(null);
      }
    } catch {
      toast({
        title: "Execution Failed",
        description: "Could not execute the request. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    updateRequestStatus(selectedRequest.id, "rejected");
    toast({
      title: "Request Rejected",
      description: `Request ${selectedRequest.id} has been rejected.`,
    });
    setSelectedRequest(null);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Inbound Transfer Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review and process pending requests from LPs and GPs.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="console-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "approved", "rejected", "executed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }`}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, address, or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="console-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Request ID
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Token
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    From
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    To
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Amount
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm">{req.id}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(req.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{req.tokenSymbol}</span>
                          <span className="text-xs text-muted-foreground">{req.tokenLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {req.fromLabel && <span className="text-sm block">{req.fromLabel}</span>}
                          <span className="font-mono text-xs text-muted-foreground">{shortenAddress(req.fromAddress)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {req.toLabel && <span className="text-sm block">{req.toLabel}</span>}
                          <span className="font-mono text-xs text-muted-foreground">{shortenAddress(req.toAddress)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{req.amount}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusPill status={req.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(req)}>
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Sheet */}
        <Sheet open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-border">
            {selectedRequest && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    Request {selectedRequest.id}
                    <StatusPill status={selectedRequest.status} />
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Created</p>
                      <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Token</p>
                      <p className="text-sm font-mono">{selectedRequest.tokenSymbol}</p>
                      <p className="text-xs text-muted-foreground">{selectedRequest.tokenLabel}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">From</p>
                      {selectedRequest.fromLabel && <p className="text-sm">{selectedRequest.fromLabel}</p>}
                      <p className="font-mono text-xs break-all">{selectedRequest.fromAddress}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">To</p>
                      {selectedRequest.toLabel && <p className="text-sm">{selectedRequest.toLabel}</p>}
                      <p className="font-mono text-xs break-all">{selectedRequest.toAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
                      <p className="text-lg font-mono font-medium text-primary">{selectedRequest.amount}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedRequest.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm p-3 bg-secondary/50 rounded-lg">{selectedRequest.notes}</p>
                    </div>
                  )}

                  {/* Raw Payload */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileJson className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Raw Payload</p>
                    </div>
                    <pre className="text-xs p-3 bg-secondary rounded-lg overflow-x-auto font-mono">
                      {JSON.stringify(selectedRequest.rawPayload, null, 2)}
                    </pre>
                  </div>

                  {/* Actions */}
                  {selectedRequest.status === "pending" && (
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Button
                        className="flex-1"
                        onClick={handleApproveAndExecute}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Approve & Execute On-Chain
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleReject} disabled={isProcessing}>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
