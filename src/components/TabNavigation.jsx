export function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'summary', label: 'Summary', icon: '◈' },
    { id: 'daily', label: 'Daily', icon: '◐' },
    { id: 'positions', label: 'Active Positions', icon: '◇' },
    { id: 'closed', label: 'Closed Positions', icon: '✓' },
    { id: 'focus', label: 'Stock in Focus', icon: '🔍' },
    { id: 'dividends', label: 'Dividends', icon: '💰' }
  ]

  return (
    <nav className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

