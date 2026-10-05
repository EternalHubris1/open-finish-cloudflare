import type { Problem } from "./catalog";
import type { PracticeRecord } from "../../../../../modules/algorithm-trainer/model";
import {
  blockProgress,
  learningBlocks,
  nextInBlock,
  type LearningBlock,
} from "./learning-path";
import {
  learningSource,
  learningSources,
  provenance,
  reviewedAt,
} from "./sources";

export function SourceNote({ problem }: { problem: Problem }) {
  const source = provenance(problem);
  return (
    <details className="trainer-provenance">
      <summary>{source.label} · происхождение</summary>
      <p>{source.detail}</p>
      {problem.id.startsWith("lc-") && problem.tests && (
        <p>
          Локальная учебная адаптация: русское условие и тесты написаны для
          нашего интерфейса. Это не официальный перевод; ограничения и порядок
          вывода могут отличаться. Тесты открыты и не доказывают заявленную
          сложность.
        </p>
      )}
      {source.sources.map((item) => (
        <p key={item.id}>
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {item.title} ↗
          </a>
          <br />
          {item.detail}
        </p>
      ))}
      {problem.url && (
        <a href={problem.url} target="_blank" rel="noopener noreferrer">
          Условие в оригинале ↗
        </a>
      )}
    </details>
  );
}
export function Sources() {
  return (
    <details className="trainer-sources">
      <summary>Источники и проверка · {learningSources.length}</summary>
      <p>
        Проверено {reviewedAt}. Официальные примеры, рекомендации и отчёты
        кандидатов — разные свидетельства. Частоты компаний не приписываем.
        Внешние условия и решения не импортированы; для части стандартных задач
        написаны локальные адаптации.
      </p>
      {learningSources.map((source) => (
        <div key={source.id}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.title} ↗
          </a>
          <p>{source.detail}</p>
        </div>
      ))}
    </details>
  );
}
export default function LearningGuide({
  block,
  saved,
  selected,
  onChoose,
  onOpen,
  onRepeat,
}: {
  block: LearningBlock;
  saved: Map<string, PracticeRecord>;
  selected: string;
  onChoose: (id: string) => void;
  onOpen: (id: string) => void;
  onRepeat: () => void;
}) {
  const progress = blockProgress(block, saved);
  const next = nextInBlock(block, saved);
  const missing = block.prerequisites
    .map((id) => learningBlocks.find((item) => item.id === id)!)
    .filter(
      (item) => blockProgress(item, saved).independent < item.core.length,
    );
  return (
    <section className="trainer-learning-guide" aria-label="Учебный маршрут">
      <div className="trainer-learning-head">
        <div>
          <p className="trainer-eyebrow">{block.phase}</p>
          <h2>{block.title}</h2>
        </div>
        <span className="trainer-learning-count">
          {progress.independent}/{progress.total} самостоятельно
        </span>
      </div>
      <p className="trainer-learning-outcome">{block.outcome}</p>
      <div className="trainer-learning-cycle" aria-label="Учебный цикл">
        <span>01 Разобрать паттерн</span>
        <span>02 Решить базу</span>
        <span>03 Перенести на вариацию</span>
        <span>04 Проверить без подсказок</span>
        <span>05 Повторить</span>
      </div>
      <div className="trainer-learning-actions">
        {next === selected ? (
          <p>Рекомендуемая задача открыта ниже.</p>
        ) : next ? (
          <button className="trainer-primary" onClick={() => onOpen(next)}>
            Рекомендуемая задача →
          </button>
        ) : (
          <p role="status">
            Основные задачи отмечены самостоятельными. Проверьте перенос в
            смешанной практике.
          </p>
        )}
        <button onClick={onRepeat}>Смешанная практика</button>
      </div>
      <details className="trainer-pattern-notes">
        <summary>Как распознать паттерн и проверить себя</summary>
        <dl>
          <dt>Сигнал в условии</dt>
          <dd>{block.cue}</dd>
          <dt>Инвариант</dt>
          <dd>{block.invariant}</dd>
          <dt>Проверка понимания</dt>
          <dd>{block.check}</dd>
        </dl>
        <p>
          Перед кодом уточните ограничения, придумайте примеры и назовите
          сложность. После решения запишите, почему подход работает. Последняя
          основная задача — попытка без подсказок; оценку фиксируете вы, не
          счётчик тестов.
        </p>
        {block.prerequisites.length > 0 && (
          <div className="trainer-prerequisites">
            <span>Перед этим:</span>
            {block.prerequisites.map((id) => {
              const prerequisite = learningBlocks.find(
                (item) => item.id === id,
              )!;
              return (
                <button key={id} onClick={() => onChoose(id)}>
                  {prerequisite.title}
                </button>
              );
            })}
          </div>
        )}
        {!!missing.length && (
          <p>
            В предшествующих блоках ещё есть задачи без самостоятельного
            результата. Это рекомендация, не блокировка доступа.
          </p>
        )}
        <div className="trainer-learning-references">
          {block.sources.map((id) => {
            const source = learningSource(id);
            return (
              <a
                key={id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.title} ↗
              </a>
            );
          })}
        </div>
        <small>
          Прогресс основан только на последней сохранённой оценке каждой
          основной задачи. Это не сертификат готовности к интервью.
        </small>
      </details>
    </section>
  );
}
