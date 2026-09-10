import { useState } from 'react'
import { ITEMS, fmt, type ItemCategory } from '../game/data'
import { game, useGame, marketValue } from '../game/engine'

const TABS = ['行囊', '装备', '招式', '宅邸', '配置'] as const

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  currency: '货币',
  food: '食物',
  pill: '丹药',
  material: '材料',
  weapon: '武器',
  armor: '防具',
  amulet: '饰品',
  stone: '强化材料',
  manual: '秘籍',
  special: '奇珍',
}

const CATEGORY_ORDER: ItemCategory[] = ['currency', 'food', 'pill', 'material', 'weapon', 'armor', 'amulet', 'stone', 'manual', 'special']

function ItemCell({ id, count }: { id: string; count: number }) {
  const def = ITEMS[id]
  if (!def) return null
  const usable = !!def.heal || !!def.buff || !!def.manual || id === 'chest'
  const equippable = def.category === 'weapon' || def.category === 'armor' || def.category === 'amulet'
  const title = `${def.name} · 🪙${def.price}${def.heal ? ` · 回血${def.heal === -1 ? '全部' : def.heal}` : ''}${def.buff ? ' · 战斗增益 5 分钟' : ''}${def.atk ? ` · ATK+${def.atk}` : ''}${def.def ? ` · DEF+${def.def}` : ''}${def.manual ? ' · 点击参悟：流派伤害 +3%（上限 5 层）' : ''}${id === 'chest' ? ' · 点击开箱' : ''}${usable && id !== 'chest' && !def.manual ? ' · 点击使用' : ''}${equippable ? ' · 点击装备' : ''}`
  return (
    <button
      onClick={() => {
        if (id === 'chest') game.openChest()
        else if (usable) game.eatItem(id)
        else if (equippable) game.equipItem(id)
      }}
      className={`ink-card relative flex h-14 w-14 flex-col items-center justify-center rounded-md ${usable || equippable ? '' : 'cursor-default'}`}
      title={title}
    >
      <span className="text-2xl">{def.icon}</span>
      <span className="absolute bottom-0.5 right-1 text-[10px] ink-text-paper">{fmt(count)}</span>
    </button>
  )
}

export default function Inventory() {
  const state = useGame()
  const [tab, setTab] = useState<(typeof TABS)[number]>('行囊')
  const [filter, setFilter] = useState('')

  const groups = CATEGORY_ORDER.map(cat => ({
    cat,
    items: Object.entries(state.inventory).filter(([id, n]) => {
      const def = ITEMS[id]
      return def && def.category === cat && n > 0 && (!filter || def.name.includes(filter))
    }),
  })).filter(g => g.items.length > 0)

  return (
    <div className="ink-panel flex h-full flex-col border-l">
      <div className="flex border-b ink-divider">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-1 py-2 text-[11px] ${tab === t ? 'bg-[#c9a063]/15 ink-text-gold' : 'ink-text-dim hover:bg-white/5'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== '行囊' ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-xs ink-text-dim">
          「{tab}」暂未开放
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="筛选物品"
              className="ink-input w-full rounded px-2 py-1 text-xs"
            />
            <span className="whitespace-nowrap text-[10px] ink-text-dim">总值 {fmt(marketValue(state))}</span>
          </div>
          {groups.map(g => (
            <div key={g.cat} className="mt-3">
              <div className="mb-1.5 text-xs ink-text-gold">{CATEGORY_LABEL[g.cat]}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map(([id, n]) => <ItemCell key={id} id={id} count={n} />)}
              </div>
            </div>
          ))}
          {groups.length === 0 && <div className="mt-8 text-center text-xs ink-text-dim">空空如也</div>}
        </div>
      )}
    </div>
  )
}
