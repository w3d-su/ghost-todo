import { DemoControls } from "./components/DemoControls";
import { PetPanel } from "./components/PetPanel";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import { Tombstone } from "./components/Tombstone";
import { Zombies } from "./components/Zombies";
import { STAGE_NAMES } from "./game/engine";
import { useGame } from "./useGame";

export default function App() {
  const g = useGame();
  const { pet, tasks, graveyard } = g.game;
  const overdue = tasks.filter((t) => t.status === "overdue");

  return (
    <>
      {pet.alive ? <Zombies overdue={overdue} /> : null}
      <main className="card">
        <header className="topbar">
          <div>
            <p className="kicker">HAUNTED PET</p>
            <h1>鬧鬼寵物待辦</h1>
          </div>
          <button className="btn" aria-pressed={!g.muted} onClick={g.toggleMuted}>
            {g.muted ? "🔇 靜音" : "🔊 音效"}
          </button>
        </header>

        <PetPanel pet={pet} tasks={tasks} now={g.now} />
        <TaskForm now={g.now} onAdd={g.addTask} />
        <TaskList tasks={tasks} now={g.now} onComplete={g.completeTask} onDelete={g.deleteTask} />

        {graveyard.length > 0 ? (
          <details className="graveyard">
            <summary>墓園（{graveyard.length}）</summary>
            <ul>
              {graveyard.slice(0, 20).map((stone) => (
                <li key={stone.id}>
                  <strong>{STAGE_NAMES[stone.stage]}</strong>
                  <span>{stone.epitaph}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <DemoControls offsetMs={g.game.clockOffsetMs} onForward={g.fastForward} onWipe={g.wipe} />
      </main>
      {!pet.alive ? <Tombstone pet={pet} onRebirth={g.rebirth} /> : null}
      <div className="crt" aria-hidden="true" />
    </>
  );
}
