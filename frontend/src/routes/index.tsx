import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, ChevronRight, Flame, Calendar, CheckCircle2, LogOut } from "lucide-react";
import heroImg from "@/assets/study-hero.jpg";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyFlow — Plataforma moderna de estudos" },
      { name: "description", content: "Organize seus estudos, acompanhe progresso e mantenha o foco com Pomodoro, metas e flashcards." },
    ],
  }),
  component: Index,
});


const tasks = [
  { id: 1, title: "Revisar cálculo integral", subject: "Matemática", done: false },
  { id: 2, title: "Exercícios de cinemática", subject: "Física", done: true },
  { id: 3, title: "Projeto React + TypeScript", subject: "Programação", done: false },
  { id: 4, title: "Resumo Revolução Francesa", subject: "História", done: false },
];

function Index() {
  const [todos, setTodos] = useState(tasks);
  const [streak] = useState(12);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");
  const { user, logout } = useAuth();

  function openLogin() { setModalMode("login"); setModalOpen(true); }
  function openRegister() { setModalMode("register"); setModalOpen(true); }

  async function handleLogout() {
    await logout();
    toast.success("Até logo!");
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">StudyFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a className="hover:text-foreground transition-smooth" href="#dashboard">Dashboard</a>
            <a className="hover:text-foreground transition-smooth" href="#tarefas">Tarefas</a>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden md:block">
                Olá, <span className="text-foreground font-semibold">{user.name.split(" ")[0]}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full glass text-sm font-medium hover:bg-card transition-smooth"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:scale-105 transition-smooth"
            >
              Entrar
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Sequência de</span>
              <span className="font-bold text-accent">{streak} dias</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05]">
              Estude com <span className="text-gradient">foco</span>,
              <br /> conquiste mais.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              A plataforma que une Pomodoro, metas, flashcards e analytics em um único lugar — feita para quem leva os estudos a sério.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={openRegister} className="px-7 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-smooth flex items-center gap-2">
                Começar agora <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              {[
                { n: "120K+", l: "Estudantes" },
                { n: "4.9★", l: "Avaliação" },
                { n: "98%", l: "Aprovação" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold text-gradient">{s.n}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-30 animate-pulse-glow" />
            <img
              src={heroImg}
              alt="Ilustração de estudos"
              width={1536}
              height={1024}
              className="relative rounded-3xl shadow-glow animate-float"
            />
          </div>
        </div>
      </header>

      {/* Tasks */}
      <section id="dashboard" className="max-w-7xl mx-auto px-6 py-16">
        <div id="tarefas" className="glass rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4 text-secondary" /> Hoje
              </div>
              <h3 className="text-2xl font-bold">Tarefas de estudo</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {todos.filter((t) => t.done).length} / {todos.length} concluídas
            </span>
          </div>
          <ul className="space-y-3">
            {todos.map((t) => (
              <li
                key={t.id}
                onClick={() => setTodos((p) => p.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card/40 hover:bg-card transition-smooth cursor-pointer group border border-border"
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-smooth ${t.done ? "bg-gradient-primary border-transparent" : "border-muted-foreground/40 group-hover:border-primary"}`}>
                  {t.done && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <div className={`font-medium transition-smooth ${t.done ? "line-through text-muted-foreground" : ""}`}>
                    {t.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.subject}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative glass rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-20" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary rounded-full blur-3xl opacity-30 animate-pulse-glow" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary rounded-full blur-3xl opacity-30 animate-pulse-glow" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-bold mb-5">
              Pronto para <span className="text-gradient">transformar</span> seus estudos?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Junte-se a milhares de estudantes que já elevaram seu desempenho com o StudyFlow.
            </p>
            <button onClick={openRegister} className="px-8 py-4 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-smooth">
              Criar conta grátis
            </button>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-border text-center text-sm text-muted-foreground">
        © 2026 StudyFlow — Feito com foco e café ☕
      </footer>

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
      />
    </div>
  );
}
