import { lazy, Suspense } from "react";
import { Link, useRoute, useSearch } from "wouter";
import { ArrowRight, Braces, Database, FunctionSquare, RotateCcw } from "lucide-react";
import scene from "@/assets/environments/optimized/activities-practice-hall.webp";
import "./trainer.css";

const Trainer = lazy(() => import("./Trainer"));

const tracks = [
  {
    id: "path", icon: Braces, title: "Алгоритмы",
    description: "Разбери паттерн, реши базовую задачу и проверь себя на вариации.",
  },
  {
    id: "data", icon: Database, title: "Анализ данных",
    description: "Практикуй Python и работу с данными на коротких задачах.",
  },
  {
    id: "math", icon: FunctionSquare, title: "Математика",
    description: "Решай задачи из спринта по линейным моделям и проверяй вычисления.",
  },
  {
    id: "due", icon: RotateCcw, title: "Повторение",
    description: "Вернись к задачам, для которых наступил срок повторения.",
  },
] as const;

export type PracticeTrack = typeof tracks[number]["id"];

export default function PracticeLab() {
  const search = new URLSearchParams(useSearch());
  const [, params] = useRoute("/algorithms/:track");
  const track = tracks.find(({ id }) => id === params?.track);
  const task = search.get("task");
  const preview = import.meta.env.DEV && search.has("preview");
  if (track || task) {
    return (
      <Suspense fallback={<p className="algorithm-room" role="status">Открываем практику…</p>}>
        <Trainer key={track?.id ?? "task"} initialTrack={track?.id} />
      </Suspense>
    );
  }

  return (
    <div className="algorithm-room practice-entry">
      <header className="trainer-hero"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(7,12,18,.97), rgba(7,12,18,.38)), url(${scene})` }}>
        <h1>Practice Lab</h1>
        <p>Выбери, что потренировать. Внутри будет список задач, условие и редактор Python.</p>
      </header>
      <section aria-labelledby="practice-map-title">
        <h2 id="practice-map-title">Карты практики</h2>
        <div className="practice-track-grid">
          {tracks.map(({ id, icon: Icon, title, description }) => (
            <Link className="practice-track" key={id}
              href={`/algorithms/${id}${preview ? "?preview" : ""}`}>
              <span className="practice-track-icon"><Icon size={22} aria-hidden="true" /></span>
              <span><strong>{title}</strong><span className="practice-track-description">{description}</span></span>
              <ArrowRight className="practice-track-arrow" size={19} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <p className="practice-entry-note">
        Хочешь сначала изучить тему по урокам?{" "}
        <Link href={`/reflections${preview ? "?preview#learning-sprints" : "#learning-sprints"}`}>
          Открой учебные спринты
        </Link>.
      </p>
    </div>
  );
}
