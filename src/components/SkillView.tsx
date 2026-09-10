import { ITEMS, SKILLS, actionsBySkill, type SkillId } from '../game/data'
import { game, useGame } from '../game/engine'

export default function SkillView({ skill }: { skill: SkillId }) {
  const state = useGame()
  const def = SKILLS.find(s => s.id === skill)!
  const actions = actionsBySkill(skill)
  const st = state.skills[skill]

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <h2 className="mb-1 text-center font-brush text-3xl ink-text-gold">{def.icon} {def.name}</h2>
      <div className="mb-6 text-center text-xs ink-text-dim">当前境界 Lv.{st.level} · 点击卡片开工，再点停止</div>

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {actions.map(a => {
          const locked = st.level < a.levelReq
          const active = state.active?.actionId === a.id
          const affordable = !a.inputs || a.inputs.every(i => (state.inventory[i.item] ?? 0) >= i.count)
          return (
            <button
              key={a.id}
              disabled={locked}
              onClick={() => (active ? game.stopAction() : game.startAction(a.id))}
              className={`ink-card relative flex flex-col items-center gap-1.5 rounded-md p-4 ${active ? 'active' : ''}`}
            >
              {active && <span className="absolute left-2 top-2 animate-spin text-xs ink-text-gold">⚙️</span>}
              <span className="text-4xl" style={locked ? { filter: 'grayscale(1)' } : undefined}>{a.icon}</span>
              <span className="text-sm ink-text-paper">{a.name}</span>
              {locked ? (
                <span className="text-[10px] ink-text-red">需要{def.name} Lv.{a.levelReq}</span>
              ) : (
                <span className="text-[10px] ink-text-dim">{a.timeSec}s · {a.xp} 经验</span>
              )}
              {a.inputs && (
                <span className={`text-[10px] ${affordable ? 'ink-text-dim' : 'ink-text-red'}`}>
                  耗 {a.inputs.map(i => `${ITEMS[i.item].icon}×${i.count}`).join(' ')}
                </span>
              )}
              <span className="text-[10px] ink-text-jade">
                得 {a.outputs.map(o => `${ITEMS[o.item].icon}×${o.count}${o.chance !== undefined ? `(${Math.round(o.chance * 100)}%)` : ''}`).join(' ')}
              </span>
            </button>
          )
        })}
      </div>

      {/* 消耗品 */}
      <div className="mt-10">
        <div className="mb-2 text-center text-xs ink-text-dim">— 消耗品 —</div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => game.drinkTea()}
            disabled={(state.inventory.tea ?? 0) < 1}
            className="ink-card flex h-16 w-16 flex-col items-center justify-center rounded-md text-xs ink-text-paper"
            title="悟道茶：10 分钟内全部经验 ×2"
          >
            <span className="text-xl">🍵</span>
            <span>×{state.inventory.tea ?? 0}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
