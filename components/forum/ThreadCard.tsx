'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Pin, Lock, Clock } from "lucide-react";
import { ForumThread } from "@/lib/mockData";
import { THREAD_STATUS, THREAD_STATUS_COLORS, ThreadStatus } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface ThreadCardProps {
  thread: ForumThread;
  onClick: () => void;
}

export function ThreadCard({ thread, onClick }: ThreadCardProps) {
  const statusColor = THREAD_STATUS_COLORS[thread.status as ThreadStatus];

  return (
    <Card 
      className="group hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-wrap">
              {thread.isPinned && (
                <Pin className="h-4 w-4 text-primary shrink-0 mt-1" />
              )}
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {thread.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={statusColor}>
                {thread.status === "LOCKED" && <Lock className="h-3 w-3 mr-1" />}
                {THREAD_STATUS[thread.status as ThreadStatus]}
              </Badge>
            </div>
          </div>

          {/* Content Preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {thread.content}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">{thread.subjectName}</Badge>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{thread.replyCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span>{thread.upvotes}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={thread.authorRole === "TEACHER" ? "font-medium text-primary" : ""}>
                {thread.authorName}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(thread.updatedAt, { addSuffix: true, locale: id })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
