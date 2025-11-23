import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Download,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/admin/useAuditLog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedbackWithDetails {
  id: string;
  feedback_type: string;
  subject: string;
  message: string;
  user_id: string | null;
  status: string | null;
  priority: string | null;
  responded_at: string | null;
  responded_by: string | null;
  response: string | null;
  created_at: string;
  user_profiles?: {
    email: string;
    full_name: string | null;
  } | null;
}

const FeedbackInboxPanel = () => {
  const { profile } = useAuth();
  const { log: logAudit } = useAuditLog();
  const queryClient = useQueryClient();
  const [selectedPrediction, setSelectedPrediction] = useState<FeedbackWithDetails | null>(null);
  const [isPredictionDialogOpen, setIsPredictionDialogOpen] = useState(false);

  const { data: feedback, isLoading, error } = useQuery({
    queryKey: ["admin", "feedback_inbox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_inbox")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as FeedbackWithDetails[];
    },
    enabled: !!profile,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ feedbackId, status }: { feedbackId: string; status: string }) => {
      const { error } = await supabase
        .from("feedback_inbox")
        .update({ status })
        .eq("id", feedbackId);

      if (error) throw error;

      // Log audit action
      await logAudit(status === "resolved" ? "feedback_resolved" : "feedback_reopened", {
        feedback_id: feedbackId,
        status: status,
        admin_email: profile?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feedback_inbox"] });
      toast.success(`Feedback ${resolveMutation.variables?.status === "resolved" ? "resolved" : "updated"} successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update feedback: ${error.message}`);
    },
  });

  const exportToCSV = async () => {
    if (!feedback || feedback.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvData = feedback.map((item) => ({
      ID: item.id,
      Type: item.feedback_type,
      Subject: item.subject,
      Message: item.message,
      Submitter: item.user_profiles?.email || "Unknown",
      "Submitter Name": item.user_profiles?.full_name || "",
      Status: item.status || "Pending",
      Priority: item.priority || "Normal",
      "Submitted At": format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss"),
      "Response": item.response || "",
      "Responded At": item.responded_at ? format(new Date(item.responded_at), "yyyy-MM-dd HH:mm:ss") : "",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `feedback_export_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log audit action
    await logAudit("feedback_exported", {
      export_count: feedback.length,
      admin_email: profile?.email,
    });
    toast.success("Feedback exported successfully");
  };

  const viewFeedback = async (feedbackItem: FeedbackWithDetails) => {
    setSelectedPrediction(feedbackItem);
    setIsPredictionDialogOpen(true);
    
    // Log audit action
    await logAudit("feedback_viewed", {
      feedback_id: feedbackItem.id,
      admin_email: profile?.email,
    });
  };

  const toggleResolve = (feedbackId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "resolved" ? "pending" : "resolved";
    resolveMutation.mutate({ feedbackId, status: newStatus });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-32" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Error loading feedback: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Inbox
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {feedback?.length || 0} total
            </Badge>
            <Badge variant="secondary">
              {feedback?.filter(f => f.status !== "resolved").length || 0} pending
            </Badge>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {feedback && feedback.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate font-medium">
                        {item.subject}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {item.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.feedback_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {item.user_profiles?.full_name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.user_profiles?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "resolved" ? "default" : "secondary"}>
                        {item.status === "resolved" ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {item.status || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(item.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewFeedback(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toggleResolve(item.id, item.status)}
                          >
                            {item.status === "resolved" ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Reopen
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Resolved
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No feedback submissions yet.</p>
          </div>
        )}
      </CardContent>

      {/* Feedback Details Dialog */}
      <Dialog open={isPredictionDialogOpen} onOpenChange={setIsPredictionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Full details for this feedback submission
            </DialogDescription>
          </DialogHeader>
          {selectedPrediction && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Subject</h4>
                <p className="text-sm">{selectedPrediction.subject}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Message</h4>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedPrediction.message}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    {selectedPrediction.feedback_type}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {selectedPrediction.status || "Pending"}
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>{" "}
                    {selectedPrediction.priority || "Normal"}
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span>{" "}
                    {format(new Date(selectedPrediction.created_at), "PPP")}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Submitter</h4>
                <div className="text-sm">
                  <div className="font-medium">
                    {selectedPrediction.user_profiles?.full_name || "Unknown"}
                  </div>
                  <div className="text-muted-foreground">
                    {selectedPrediction.user_profiles?.email}
                  </div>
                </div>
              </div>

              {selectedPrediction.response && (
                <div>
                  <h4 className="font-semibold mb-2">Response</h4>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedPrediction.response}</p>
                    {selectedPrediction.responded_at && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Responded on {format(new Date(selectedPrediction.responded_at), "PPP")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FeedbackInboxPanel;