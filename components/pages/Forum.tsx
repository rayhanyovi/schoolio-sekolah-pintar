'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, MessageSquare, TrendingUp, Users } from "lucide-react";
import { ThreadCard } from "@/components/forum/ThreadCard";
import { ThreadFormDialog } from "@/components/forum/ThreadFormDialog";
import { ThreadDetailSheet } from "@/components/forum/ThreadDetailSheet";
import { mockThreads, mockSubjects, ForumThread } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";

export default function Forum() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [threads, setThreads] = useState<ForumThread[]>(mockThreads);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);

  const canModerate = role === "ADMIN" || role === "TEACHER";
  const canPost = role !== "PARENT";

  const filteredThreads = threads.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || t.subjectId === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Sort: pinned first, then by updatedAt
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const totalReplies = threads.reduce((acc, t) => acc + t.replyCount, 0);
  const resolvedCount = threads.filter(t => t.status === "RESOLVED").length;

  const handleCreateThread = (data: { title: string; content: string; subjectId: string }) => {
    const subject = mockSubjects.find(s => s.id === data.subjectId);
    const newThread: ForumThread = {
      id: Date.now().toString(),
      title: data.title,
      content: data.content,
      subjectId: data.subjectId,
      subjectName: subject?.name || "",
      authorId: "current-user",
      authorName: "Anda",
      authorRole: role === "TEACHER" ? "TEACHER" : "STUDENT",
      status: "OPEN",
      isPinned: false,
      replyCount: 0,
      upvotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setThreads([newThread, ...threads]);
    toast({ title: "Berhasil", description: "Diskusi baru berhasil dibuat" });
  };

  const handleThreadClick = (thread: ForumThread) => {
    setSelectedThread(thread);
    setDetailSheetOpen(true);
  };

  const handleTogglePin = (id: string) => {
    setThreads(threads.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
    toast({ title: "Berhasil", description: "Status pin berhasil diubah" });
  };

  const handleToggleLock = (id: string) => {
    setThreads(threads.map(t => t.id === id ? { 
      ...t, 
      status: t.status === "LOCKED" ? "OPEN" : "LOCKED" 
    } : t));
    setSelectedThread(prev => prev ? { ...prev, status: prev.status === "LOCKED" ? "OPEN" : "LOCKED" } : null);
    toast({ title: "Berhasil", description: "Status diskusi berhasil diubah" });
  };

  if (role === "PARENT") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-muted-foreground">Akses Terbatas</h2>
          <p className="text-sm text-muted-foreground">Fitur forum hanya tersedia untuk Guru dan Siswa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forum Diskusi</h1>
          <p className="text-muted-foreground">Diskusi dan tanya jawab mata pelajaran</p>
        </div>
        {canPost && (
          <Button onClick={() => setFormDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Diskusi
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Diskusi</p>
              <p className="text-2xl font-bold">{threads.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Balasan</p>
              <p className="text-2xl font-bold">{totalReplies}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Terjawab</p>
              <p className="text-2xl font-bold">{resolvedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari diskusi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter by Subject */}
      <Tabs defaultValue="all" onValueChange={setSelectedSubject}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Semua</TabsTrigger>
          {mockSubjects.slice(0, 6).map((subject) => (
            <TabsTrigger key={subject.id} value={subject.id}>{subject.name}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedSubject} className="mt-6">
          <div className="space-y-3">
            {sortedThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onClick={() => handleThreadClick(thread)}
              />
            ))}
          </div>
          {sortedThreads.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Tidak ada diskusi ditemukan
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ThreadFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSubmit={handleCreateThread}
      />
      <ThreadDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        thread={selectedThread}
        canModerate={canModerate}
        onTogglePin={handleTogglePin}
        onToggleLock={handleToggleLock}
      />
    </div>
  );
}
