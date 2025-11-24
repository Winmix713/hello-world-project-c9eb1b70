import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Download,
  MoreHorizontal,
  MessageSquare,
  Calendar,
  CheckCircle,
  AlertCircle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedbackWithDetails {
  id: string;
  subject: string;
  message: string;
  feedback_type: string;
  status: string | null;
  priority: string | null;
  user_id: string | null;
  responded_by: string | null;
  responded_at: string | null;
  response: string | null;
  created_at: string;
}

const FeedbackInboxPanel = () => {
  const { profile } = useAuth();
  const { log: logAudit } = useAuditLog();
  const queryClient = useQueryClient();

  const { data: feedback, isLoading, error } = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_inbox")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ feedbackId, status }: { feedbackId: string; status: string }) => {
      const { error } = await supabase
        .from("feedback_inbox")
        .update({ 
          status, 
          responded_by: profile?.id, 
          responded_at: new Date().toISOString() 
        })
        .eq("id", feedbackId);

      if (error) throw error;

      await logAudit("admin_action", {
        action: "feedback_status_changed",
        feedback_id: feedbackId,
        new_status: status,
        admin_email: profile?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });
      toast.success("Feedback status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const exportToCSV = async () => {
    if (!feedback || feedback.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvData = feedback.map((item) => ({
      ID: item.id,
      Subject: item.subject,
      Message: item.message,
      Type: item.feedback_type,
      Status: item.status || "open",
      Priority: item.priority || "medium",
      "Created At": format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss"),
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

    await logAudit("feedback_exported", {
      export_count: feedback.length,
      admin_email: profile?.email,
    });
    toast.success("Feedback exported successfully");
  };

  const changeStatus = (feedbackId: string, newStatus: string) => {
    updateStatusMutation.mutate({ feedbackId, status: newStatus });
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

  const openCount = feedback?.filter(f => f.status === 'open' || !f.status).length || 0;
  const closedCount = feedback?.filter(f => f.status === 'closed' || f.status === 'resolved').length || 0;

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
              {openCount} open
            </Badge>
            <Badge variant="default">
              {closedCount} resolved
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
                  <TableHead>Priority</TableHead>
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
                      <Badge variant="outline">
                        {item.feedback_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                        {item.priority || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'open' || !item.status ? 'secondary' : 'default'}>
                        {item.status === 'open' || !item.status ? (
                          <AlertCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        {item.status || 'open'}
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
                          {(item.status === 'open' || !item.status) && (
                            <DropdownMenuItem onClick={() => changeStatus(item.id, 'resolved')}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Resolved
                            </DropdownMenuItem>
                          )}
                          {item.status === 'resolved' && (
                            <DropdownMenuItem onClick={() => changeStatus(item.id, 'open')}>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Reopen
                            </DropdownMenuItem>
                          )}
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
    </Card>
  );
};

export default FeedbackInboxPanel;
