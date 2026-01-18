'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, StickyNote, Pin, Pencil, Trash2 } from "lucide-react";
import {
  createNote,
  deleteNote,
  listNotes,
  toggleNotePin,
  updateNote,
} from "@/lib/handlers/notes";
import { listSubjects } from "@/lib/handlers/subjects";
import { listStudents, listTeachers } from "@/lib/handlers/users";
import { NoteSummary, SubjectSummary } from "@/lib/schemas";
import { NOTE_VISIBILITY, NoteVisibility } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const NOTE_COLORS = [
  "bg-blue-100 dark:bg-blue-900/30",
  "bg-green-100 dark:bg-green-900/30",
  "bg-yellow-100 dark:bg-yellow-900/30",
  "bg-red-100 dark:bg-red-900/30",
  "bg-purple-100 dark:bg-purple-900/30",
  "bg-pink-100 dark:bg-pink-900/30",
];

export default function Notes() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteSummary | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", subjectId: "", visibility: "PRIVATE" as NoteVisibility, color: NOTE_COLORS[0] });

  const isTeacher = role === "TEACHER";
  const canCreateClassNotes = isTeacher || role === "ADMIN";

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [noteData, subjectData, teacherData, studentData] =
        await Promise.all([
          listNotes(),
          listSubjects(),
          listTeachers(),
          listStudents(),
        ]);
      setNotes(noteData);
      setSubjects(subjectData);
      const defaultUser =
        role === "TEACHER"
          ? teacherData[0]?.id
          : role === "STUDENT"
          ? studentData[0]?.id
          : teacherData[0]?.id ?? studentData[0]?.id;
      setCurrentUserId(defaultUser);
    } catch (error) {
      toast({
        title: "Gagal memuat catatan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "my" ? n.visibility === "PRIVATE" : n.visibility === "CLASS";
    return matchesSearch && matchesTab;
  });

  const handleSubmit = async () => {
    if (!currentUserId) {
      toast({
        title: "Tidak ada pengguna",
        description: "Tambahkan pengguna terlebih dahulu sebelum membuat catatan.",
      });
      return;
    }

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        subjectId: formData.subjectId || null,
        visibility: formData.visibility,
        color: formData.color,
      };
      if (selectedNote) {
        await updateNote(selectedNote.id, payload);
        toast({ title: "Berhasil", description: "Catatan berhasil diperbarui" });
      } else {
        await createNote({
          ...payload,
          authorId: currentUserId,
        });
        toast({ title: "Berhasil", description: "Catatan baru berhasil dibuat" });
      }
      setFormDialogOpen(false);
      setSelectedNote(null);
      await loadData();
    } catch (error) {
      toast({
        title: "Gagal menyimpan catatan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleEdit = (note: NoteSummary) => {
    setSelectedNote(note);
    setFormData({ title: note.title, content: note.content, subjectId: note.subjectId || "", visibility: note.visibility, color: note.color });
    setFormDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      toast({ title: "Berhasil", description: "Catatan berhasil dihapus" });
      await loadData();
    } catch (error) {
      toast({
        title: "Gagal menghapus catatan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await toggleNotePin(id);
      await loadData();
    } catch (error) {
      toast({
        title: "Gagal mengubah pin",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const openNewNote = () => {
    setSelectedNote(null);
    setFormData({ title: "", content: "", subjectId: "", visibility: activeTab === "class" && canCreateClassNotes ? "CLASS" : "PRIVATE", color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] });
    setFormDialogOpen(true);
  };

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catatan</h1>
          <p className="text-muted-foreground">Catatan pribadi dan catatan kelas</p>
        </div>
        <Button onClick={openNewNote}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Catatan
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari catatan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="my" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my">Catatan Saya</TabsTrigger>
          <TabsTrigger value="class">Catatan Kelas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Memuat catatan...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedNotes.map((note) => (
                <Card key={note.id} className={`group hover:shadow-lg transition-all ${note.color}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {note.isPinned && <Pin className="h-4 w-4 text-primary" />}
                        <h3 className="font-semibold">{note.title}</h3>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTogglePin(note.id)}>
                          <Pin className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(note)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(note.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-4 pt-2 border-t">
                      {note.subjectName && <Badge variant="outline" className="text-xs">{note.subjectName}</Badge>}
                      <span className="text-xs text-muted-foreground">{format(note.updatedAt, "d MMM", { locale: id })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!isLoading && sortedNotes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada catatan</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNote ? "Edit Catatan" : "Buat Catatan Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Judul catatan" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select value={formData.subjectId} onValueChange={(v) => setFormData({ ...formData, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              {canCreateClassNotes && (
                <div className="space-y-2">
                  <Label>Visibilitas</Label>
                  <Select value={formData.visibility} onValueChange={(v) => setFormData({ ...formData, visibility: v as NoteVisibility })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(NOTE_VISIBILITY).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Isi Catatan</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={6} placeholder="Tulis catatan..." />
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex gap-2">
                {NOTE_COLORS.map((color) => (
                  <button key={color} className={`w-8 h-8 rounded-full ${color} ${formData.color === color ? "ring-2 ring-primary ring-offset-2" : ""}`} onClick={() => setFormData({ ...formData, color })} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setFormDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSubmit}>{selectedNote ? "Simpan" : "Buat Catatan"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
