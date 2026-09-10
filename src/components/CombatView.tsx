import { AFFIXES, ITEMS, MONSTERS, REBIRTH_REQ_LEVEL, STYLES, ZONES, affixDesc } from '../game/data'
import { battleMonster, game, totalLevel, useGame } from '../game/engine'

export default function CombatView() {
  const state = useGame()
  const maxHp = game.maxHp()
  const atk = game.playerAtk()
  const def = game.playerDef()
  const battle = state.battle
  const monster = battle ? battleMonster(battle) : null
  const injured = state.playerHp <= maxHp * 0.2 && !battle

  const healItems = Object.values(ITEMS).filter(d => (d.heal || d.buff) && (state.inventory[d.id] ?? 0) > 0)

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <h2 className="mb-4 text-center font-brush text-3xl ink-text-red">⚔️ 闯荡江湖</h2>

      {/* 角色状态 */}
      <div className="ink-panel mx-auto mb-5 max-w-2xl rounded-md p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="ink-text-paper">xbei</span>
          <span className="text-xs ink-text-dim">⚔️ {atk}　🛡️ {def}　击杀 {state.kills}</span>
        </div>
        <div className="ink-progress h-3.5 overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all ${state.playerHp < maxHp * 0.3 ? 'bg-gradient-to-r from-[#722a26] to-[#d4504a]' : 'bg-gradient-to-r from-[#35573f] to-[#5a8a6a]'}`}
            style={{ width: `${(state.playerHp / maxHp) * 100}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[10px] ink-text-dim">气血 {Math.ceil(state.playerHp)} / {maxHp}</div>

        {/* 装备 */}
        <div className="mt-3 flex items-center gap-3">
          {(['weapon', 'armor', 'amulet'] as const).map(slot => {
            const eq = state.equipment[slot]
            const SLOT_META = {
              weapon: { icon: '🗡️', empty: '未装备武器' },
              armor: { icon: '🛡️', empty: '未装备防具' },
              amulet: { icon: '📿', empty: '未装备饰品' },
            }[slot]
            const amuletDesc = (id: string) => {
              const d = ITEMS[id]
              return [d.atk ? `ATK+${d.atk}` : '', d.def ? `DEF+${d.def}` : '', d.xpPct ? `经验+${d.xpPct}%` : '', d.coinPct ? `铜钱+${d.coinPct}%` : ''].filter(Boolean).join(' · ')
            }
            return (
              <div key={slot} className="ink-card flex flex-1 items-center gap-2 rounded-md px-3 py-2">
                <span className="text-xl">{eq ? ITEMS[eq.item].icon : SLOT_META.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs ink-text-paper">
                    {eq ? `${ITEMS[eq.item].name}${eq.plus > 0 ? ` +${eq.plus}` : ''}` : SLOT_META.empty}
                  </div>
                  {eq && (
                    <div className="text-[10px] ink-text-dim">
                      {slot === 'weapon' && `ATK +${(ITEMS[eq.item].atk ?? 0) + eq.plus * 2}`}
                      {slot === 'armor' && `DEF +${(ITEMS[eq.item].def ?? 0) + eq.plus}`}
                      {slot === 'amulet' && amuletDesc(eq.item)}
                    </div>
                  )}
                  {eq?.affixes && eq.affixes.length > 0 && (
                    <div className="mt-0.5 space-y-0">
                      {eq.affixes.map((a, i) => {
                        const cursed = AFFIXES.find(x => x.id === a.id)?.curse
                        return (
                          <div key={i} className={`text-[9px] leading-tight ${cursed ? 'ink-text-red' : 'ink-text-jade'}`}>
                            {cursed ? '💀' : '✦'} {affixDesc(a)}
                          </div>
                        )
                      })}
                      {(eq.fractures ?? 0) > 0 && (
                        <div className="text-[9px] leading-tight ink-text-red">🀫 裂痕 {eq.fractures}/3</div>
                      )}
                    </div>
                  )}
                </div>
                {eq && (
                  <>
                    {slot !== 'amulet' && (
                      <button
                        onClick={() => game.enhance(slot)}
                        className="ink-btn rounded px-2 py-0.5 text-[10px]"
                        title={eq.plus < 5 ? '消耗强化石 ×1' : eq.plus < 10 ? '消耗精锻石 ×1' : eq.plus < 15 ? '消耗天外陨晶 ×1' : '消耗乾坤灵晶 ×1'}
                      >
                        强化
                      </button>
                    )}
                    <button
                      onClick={() => game.rerollAffixes(slot)}
                      className="ink-btn rounded px-2 py-0.5 text-[10px]"
                      title="重铸词缀：🔮玄晶 ×2，15% 概率留裂痕，3 道裂痕后定型"
                    >
                      重铸
                    </button>
                    <button onClick={() => game.unequip(slot)} className="ink-btn-red rounded px-2 py-0.5 text-[10px]" title="卸下后词缀消散">
                      卸下
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* 药品 */}
        {healItems.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] ink-text-dim">丹药食物：</span>
            {healItems.map(d => (
              <button
                key={d.id}
                onClick={() => game.eatItem(d.id)}
                className="ink-card flex items-center gap-1 rounded px-2 py-1 text-xs ink-text-paper"
                title={d.buff ? `5 分钟${d.buff === 'atk' ? '攻击' : '防御'} +25%` : d.heal === -1 ? '全部恢复' : `回血 ${d.heal}`}
              >
                {d.icon} ×{state.inventory[d.id]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 当前战斗 */}
      {battle && monster && (
        <div className="mx-auto mb-5 max-w-2xl rounded-md border border-[#d4504a]/40 bg-[#2a1512]/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-lg">{monster.icon} <span className="ink-text-paper">{monster.name}</span></span>
            <button onClick={() => game.stopBattle()} className="ink-btn-red rounded px-4 py-1 text-sm">撤退</button>
          </div>
          <div className="ink-progress h-3.5 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-gradient-to-r from-[#722a26] to-[#d4504a] transition-all" style={{ width: `${Math.max(0, (battle.monsterHp / monster.hp) * 100)}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] ink-text-dim">
            <span>HP {Math.max(0, Math.ceil(battle.monsterHp))} / {monster.hp}</span>
            <span>流派：{STYLES.find(s => s.id === battle.style)?.name}</span>
          </div>
        </div>
      )}

      {injured && (
        <div className="mx-auto mb-5 max-w-2xl rounded-md border border-[#c9a063]/40 bg-[#2a2113]/80 p-3 text-center text-sm ink-text-gold">
          🧘 身受重伤，打坐回气中…（气血 2%/秒 回复）
        </div>
      )}

      {/* 武学招式 */}
      <div className="ink-panel mx-auto mb-6 max-w-2xl rounded-md p-4">
        <div className="mb-2 text-sm ink-text-gold">📖 武学招式</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STYLES.map(s => {
            const lv = state.skills[s.id].level
            return (
              <div key={s.id} className="rounded border border-[#c9a063]/15 p-2.5">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="ink-text-paper">{s.icon} {s.name} <span className="ink-text-gold">Lv.{lv}</span></span>
                  {(state.styleManuals[s.id] ?? 0) > 0 && (
                    <span className="text-[10px] ink-text-jade">📜 秘籍 {state.styleManuals[s.id]}/5</span>
                  )}
                </div>
                <div className="mb-1.5 text-[10px] ink-text-jade">{s.signature}</div>
                <div className="space-y-0.5">
                  {s.abilities.map(a => (
                    <div key={a.name} className={`text-[10px] ${lv >= a.level ? 'ink-text-gold' : 'ink-text-dim opacity-60'}`}>
                      {lv >= a.level ? '◆' : '◇'} {a.name}（Lv.{a.level}）{a.desc}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 怪物列表 */}
      {ZONES.map(zone => (
        <div key={zone} className="mx-auto mb-5 max-w-2xl">
          <div className="mb-2 font-brush text-lg ink-text-gold">📍 {zone}</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MONSTERS.filter(m => m.zone === zone).map(m => {
              const fighting = battle?.monsterId === m.id
              return (
                <div key={m.id} className={`ink-card rounded-md p-3 ${fighting ? 'active' : ''}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="ink-text-paper">{m.icon} {m.name}</span>
                    <span className="text-[10px] ink-text-dim">推荐 Lv.{m.levelReq}</span>
                  </div>
                  <div className="mb-1 text-[10px] ink-text-dim">HP {m.hp} · ATK {m.atk} · DEF {m.def}</div>
                  <div className="mb-2 text-[10px] ink-text-dim">
                    掉落 {m.drops.map(d => `${ITEMS[d.item].icon}${d.chance < 1 ? `${Math.round(d.chance * 100)}%` : ''}`).join(' ')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STYLES.map(s => (
                      <button
                        key={s.id}
                        disabled={!!battle || injured}
                        onClick={() => game.startBattle(m.id, s.id)}
                        className="ink-btn rounded px-2 py-0.5 text-[11px]"
                        title={`以${s.name}出战（Lv.${state.skills[s.id].level}）`}
                      >
                        {s.icon} {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* 轮回 */}
      {(() => {
        const tl = totalLevel(state)
        const can = game.canRebirth()
        const gain = game.rebirthGain()
        return (
          <div className="ink-panel mx-auto mb-6 max-w-2xl rounded-md p-4 text-center">
            <div className="font-brush text-xl ink-text-gold">♾️ 涅槃轮回</div>
            <div className="mt-1 text-[11px] ink-text-dim">
              总等级 {tl} / {REBIRTH_REQ_LEVEL} · 已轮回 {state.rebirths} 次 · 轮回点 {state.rebirthPoints}
              （每点：经验 +5%、铜钱 +3%，永久生效）
            </div>
            <div className="mt-1 text-[11px] ink-text-dim">
              轮回后技能、背包、装备、秘境进度重置；成就、轮回点、生涯纪录永存
            </div>
            <button
              disabled={!can}
              onClick={() => { if (confirm(`确定轮回？将获得 ${gain} 轮回点，当前周目进度清零！`)) game.rebirth() }}
              className={`mt-2 rounded px-6 py-1.5 text-sm ${can ? 'ink-btn' : 'ink-btn-red opacity-40'}`}
            >
              {can ? `🌀 涅槃轮回（+${gain} 轮回点）` : `总等级 ${REBIRTH_REQ_LEVEL} 方可轮回`}
            </button>
          </div>
        )
      })()}
    </div>
  )
}
