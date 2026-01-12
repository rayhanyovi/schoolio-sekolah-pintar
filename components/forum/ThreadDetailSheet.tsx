'use client';

import { useState } from "react";
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
import { ForumThread, ForumReply, mockReplies } from "@/lib/mockData";
import { THREAD_STATUS, THREAD_STATUS_COLORS, ThreadStatus } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ThreadDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thread: ForumThread | null;
  canModerate: boolean;
  onTogglePin: (id: string) => void;
  onToggleLock: (id: string) => void;
}

export function ThreadDetailSheet({ 
  open, 
  onOpenChange, 
  thread, 
  canModerate,
  onTogglePin,
  onToggleLock
}: ThreadDetailSheetProps) {
  const { toast } = useToast();
  const [replies, setReplies] = useState<ForumReply[]>(mockReplies);
  const [newReply, setNewReply] = useState("");

  if (!thread) return null;

  const threadReplies = replies.filter(r => r.threadId === thread.id);
  const statusColor = THREAD_STATUS_COLORS[thread.status as ThreadStatus];
  const isLocked = thread.status === "LOCKED";

  const handleSubmitReply = () => {
    if (!newReply.trim()) return;
    
    const reply: ForumReply = {
      id: Date.now().toString(),
      threadId: thread.id,
      content: newReply,
      authorId: "current-user",
      authorName: "Anda",
      authorRole: "STUDENT",
      isAcceptedAnswer: false,
      upvotes: 0,
      createdAt: new Date(),
    };
    
    setReplies([...replies, reply]);
    setNewReply("");
    toast({ title: "Berhasil", description: "Balasan berhasil dikirim" });
  };

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
              {threadReplies.length > 0 ? (
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
