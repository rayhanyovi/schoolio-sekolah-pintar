'use client';

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ThumbsUp, 
  Pin, 
  Lock, 
  CheckCircle, 
  Send,
  MessageSquare
} from "lucide-react";
import { createReply, listReplies } from "@/lib/handlers/forum";
import { ForumReplySummary, ForumThreadSummary } from "@/lib/schemas";
import { THREAD_STATUS, THREAD_STATUS_COLORS, ThreadStatus } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ThreadDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thread: ForumThreadSummary | null;
  canModerate: boolean;
  onTogglePin: (id: string) => void;
  onToggleLock: (id: string) => void;
  currentUserId?: string;
  currentUserRole?: string;
}

export function ThreadDetailSheet({ 
  open, 
  onOpenChange, 
  thread, 
  canModerate,
  onTogglePin,
  onToggleLock,
  currentUserId,
  currentUserRole,
}: ThreadDetailSheetProps) {
  const { toast } = useToast();
  const [replies, setReplies] = useState<ForumReplySummary[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [newReply, setNewReply] = useState("");

  const loadReplies = async () => {
    try {
      setIsLoadingReplies(true);
      const data = await listReplies(thread.id);
      setReplies(data);
    } catch (error) {
      toast({
        title: "Gagal memuat balasan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setIsLoadingReplies(false);
    }
  };

  useEffect(() => {
    if (open && thread?.id) {
      loadReplies();
    }
  }, [open, thread?.id]);

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;
    if (!currentUserId) {
      toast({
        title: "Tidak ada pengguna",
        description: "Tambahkan pengguna terlebih dahulu sebelum membalas.",
      });
      return;
    }

    try {
      await createReply(thread.id, {
        content: newReply,
        authorId: currentUserId,
        authorRole: currentUserRole ?? "STUDENT",
      });
      setNewReply("");
      await loadReplies();
      toast({ title: "Berhasil", description: "Balasan berhasil dikirim" });
    } catch (error) {
      toast({
        title: "Gagal mengirim balasan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  if (!thread) return null;

  const threadReplies = replies.filter((r) => r.threadId === thread.id);
  const statusColor = THREAD_STATUS_COLORS[thread.status as ThreadStatus];
  const isLocked = thread.status === "LOCKED";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {thread.isPinned && <Pin className="h-4 w-4 text-primary" />}
                <SheetTitle className="text-left">{thread.title}</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{thread.subjectName}</Badge>
                <Badge className={statusColor}>
                  {thread.status === "LOCKED" && <Lock className="h-3 w-3 mr-1" />}
                  {THREAD_STATUS[thread.status as ThreadStatus]}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Original Post */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${thread.authorRole === "TEACHER" ? "text-primary" : ""}`}>
                  {thread.authorName}
                </span>
                {thread.authorRole === "TEACHER" && (
                  <Badge variant="secondary" className="text-xs">Guru</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(thread.createdAt, { addSuffix: true, locale: id })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{thread.content}</p>
            <div className="flex items-center gap-4 mt-4">
              <Button variant="ghost" size="sm" className="h-8">
                <ThumbsUp className="h-4 w-4 mr-1" />
                {thread.upvotes}
              </Button>
            </div>
          </div>

          {/* Moderation Actions */}
          {canModerate && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onTogglePin(thread.id)}
              >
                <Pin className="h-4 w-4 mr-1" />
                {thread.isPinned ? "Unpin" : "Pin"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onToggleLock(thread.id)}
              >
                <Lock className="h-4 w-4 mr-1" />
                {isLocked ? "Unlock" : "Lock"}
              </Button>
            </div>
          )}

          <Separator />

          {/* Replies */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Balasan ({threadReplies.length})
            </h4>
            <ScrollArea className="h-[250px]">
              {isLoadingReplies ? (
                <div className="text-center py-8 text-muted-foreground">
                  Memuat balasan...
                </div>
              ) : threadReplies.length > 0 ? (
                <div className="space-y-3 pr-4">
                  {threadReplies.map((reply) => (
                    <div 
                      key={reply.id} 
                      className={`p-3 rounded-lg ${reply.isAcceptedAnswer ? "border-2 border-success bg-success/5" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${reply.authorRole === "TEACHER" ? "text-primary" : ""}`}>
                            {reply.authorName}
                          </span>
                          {reply.authorRole === "TEACHER" && (
                            <Badge variant="secondary" className="text-xs">Guru</Badge>
                          )}
                          {reply.isAcceptedAnswer && (
                            <Badge className="bg-success text-success-foreground text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Jawaban Terbaik
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: id })}
                        </span>
                      </div>
                      <p className="text-sm">{reply.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {reply.upvotes}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada balasan
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Reply Form */}
          {!isLocked && (
            <div className="space-y-3">
              <Textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Tulis balasan..."
                rows={3}
              />
              <Button onClick={handleSubmitReply} disabled={!newReply.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Kirim Balasan
              </Button>
            </div>
          )}

          {isLocked && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Lock className="h-4 w-4 inline mr-2" />
              Diskusi ini telah dikunci
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
