import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Brain, LogOut, FileUp, Loader2, CheckCircle,
  AlertCircle, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Doc {
  id: number;
  title: string;
  original_filename: string;
  file_type: "pdf" | "txt" | "docx";
  file_size: number;
  status: "pending" | "processing" | "completed" | "failed";
  summary: string | null;
  error_message: string | null;
  created_at: string;
}

export const Route = createFileRoute("/documents")({
  beforeLoad: () => {
    if (!localStorage.getItem("token")) throw redirect({ to: "/" });
  },
  component: DocumentsPage,
});

function DocumentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<Doc[]>("/documents")
      .then((r) => setDocs(r.data))
      .catch(() => toast.error("Erro ao carregar documentos."))
      .finally(() => setLoadingList(false));
  }, []);

  // Live status: poll while any document is in a non-final state
  useEffect(() => {
    const hasPending = docs.some((d) => d.status === "pending" || d.status === "processing");
    if (!hasPending) return;

    const id = setInterval(() => {
      api.get<Doc[]>("/documents")
        .then((r) => {
          setDocs((prev) => {
            // notify when a doc transitions to completed or failed
            for (const fresh of r.data) {
              const old = prev.find((d) => d.id === fresh.id);
              if (old?.status !== fresh.status) {
                if (fresh.status === "completed") toast.success(`"${fresh.title}" resumido com sucesso!`);
                if (fresh.status === "failed")    toast.error(`Falha ao processar "${fresh.title}".`);
              }
            }
            return r.data;
          });
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(id);
  }, [docs]);

  async function confirmAndLogout() {
    setConfirmLogout(false);
    await logout();
    navigate({ to: "/" });
  }

  const upload = useCallback(async (file: File) => {
    if (uploading) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "txt", "docx"].includes(ext)) {
      toast.error("Formato não suportado. Use PDF, DOCX ou TXT.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const { data } = await api.post<Doc>("/documents", formData, {
        headers: { "Content-Type": undefined as unknown as string },
        timeout: 125_000,
      });
      setDocs((prev) => [data, ...prev]);
      if (data.status === "completed") {
        toast.success("Resumo gerado com sucesso!");
      } else if (data.status === "failed") {
        toast.error("Falha ao processar: " + (data.error_message ?? "erro desconhecido"));
      }
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Erro no upload.")
          : "Erro no upload.",
      );
    } finally {
      setUploading(false);
    }
  }, [uploading]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  async function deleteDoc(doc: Doc) {
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Documento removido.");
    } catch {
      toast.error("Erro ao remover documento.");
    }
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">StudyFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full glass text-sm font-medium hover:bg-card transition-smooth"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Heading */}
        <div>
          <h1 className="text-4xl font-bold">
            Seus <span className="text-gradient">Resumos</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Envie um documento e a IA resume para você em instantes.
          </p>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => { if (!uploading) fileRef.current?.click(); }}
          className={[
            "relative glass rounded-3xl p-14 text-center border-2 border-dashed transition-all duration-300",
            uploading
              ? "cursor-default border-primary/30"
              : "cursor-pointer hover:border-primary/60",
            dragOver && !uploading ? "border-primary scale-[1.01] shadow-glow" : "border-border",
          ].join(" ")}
        >
          {/* Decorative blob */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-primary rounded-full blur-3xl opacity-10 pointer-events-none" />

          {uploading ? (
            <div className="relative space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
              </div>
              <div>
                <div className="text-xl font-bold mb-1">Resumindo com IA...</div>
                <p className="text-sm text-muted-foreground">
                  O agente está analisando o documento. Isso pode levar até 1 minuto.
                </p>
              </div>
              <div className="w-56 h-1.5 mx-auto bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-primary rounded-full animate-progress" />
              </div>
            </div>
          ) : (
            <div className="relative space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow transition-transform duration-300 ${dragOver ? "scale-110 rotate-3" : ""}`}>
                <FileUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xl font-bold mb-1">
                  {dragOver ? "Solte para resumir!" : "Arraste ou clique para enviar"}
                </div>
                <p className="text-sm text-muted-foreground">
                  PDF, DOCX ou TXT · máx. 20 MB
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Document list */}
        <div className="space-y-4">
          {docs.length > 0 && (
            <h2 className="text-xl font-bold">Histórico</h2>
          )}

          {loadingList ? (
            <div className="text-center py-10 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : docs.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
              <p className="font-medium">Nenhum documento ainda.</p>
              <p className="text-sm mt-1">Envie seu primeiro arquivo acima.</p>
            </div>
          ) : (
            docs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onDelete={() => deleteDoc(doc)}
              />
            ))
          )}
        </div>
      </main>

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Sair da conta?"
        description="Você será desconectado e precisará entrar novamente para acessar seus documentos."
        confirmLabel="Sair"
        onConfirm={confirmAndLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}

const TYPE_ICON: Record<string, string> = { pdf: "📄", docx: "📝", txt: "📃" };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)} dias`;
}

function StatusBadge({ status }: { status: Doc["status"] }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted/60 text-muted-foreground border border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
        Pendente
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
        <span className="flex gap-[3px] items-end h-3">
          <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms",   animationDuration: "0.8s" }} />
          <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.8s" }} />
          <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.8s" }} />
        </span>
        Processando
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20">
        <CheckCircle className="w-3 h-3" />
        Concluído
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
      <AlertCircle className="w-3 h-3" />
      Falha
    </span>
  );
}

function DocCard({ doc, onDelete }: { doc: Doc; onDelete: () => void }) {
  return (
    <div className="glass rounded-2xl overflow-hidden transition-smooth group">
      <div className="p-5 flex items-center gap-4">
        <div className="text-2xl select-none shrink-0">
          {TYPE_ICON[doc.file_type] ?? "📄"}
        </div>

        <Link
          to="/documents/$id"
          params={{ id: String(doc.id) }}
          className="flex-1 min-w-0 space-y-2 block"
        >
          <div className="font-semibold truncate group-hover:text-primary transition-smooth">{doc.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{formatSize(doc.file_size)}</span>
            <span>·</span>
            <span>{timeAgo(doc.created_at)}</span>
          </div>
          <StatusBadge status={doc.status} />
        </Link>

        <button
          onClick={onDelete}
          className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth shrink-0"
          title="Remover"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
