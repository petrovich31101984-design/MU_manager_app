import { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import * as gs from './services/googleSheets';

// Компонент экрана ошибки подключения
function ConnectionErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [newUrl, setNewUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateUrl = () => {
    if (!newUrl.trim()) {
      alert('Введите URL веб-приложения');
      return;
    }
    setIsUpdating(true);
    gs.saveConfig(newUrl.trim());
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDisconnect = () => {
    if (confirm('Вы уверены? Приложение перестанет работать с Google Sheets.')) {
      gs.clearConfig();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-lg max-w-lg w-full">
        <img src={LOGO_URL} alt="АлкоСпас" className="w-32 h-32 object-contain mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Ошибка подключения</h2>
        <p className="text-red-600 text-sm text-center mb-4">{error}</p>
        
        <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2 font-medium">Проверьте:</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>URL веб-приложения Apps Script</li>
            <li>Доступ к таблице (публичный)</li>
            <li>Структуру таблицы (должны быть все листы)</li>
            <li>Интернет-соединение</li>
          </ul>
        </div>

        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-slate-700">Изменить URL подключения:</label>
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={handleUpdateUrl}
            disabled={isUpdating || !newUrl.trim()}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 rounded-lg text-white font-medium shadow-lg shadow-blue-600/20 disabled:shadow-none"
          >
            {isUpdating ? '⏳ Обновление...' : '🔗 Обновить URL'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-medium shadow-lg shadow-red-600/20"
          >
            🔄 Повторить
          </button>
          <button
            onClick={handleDisconnect}
            className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium"
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ ЖУРНАЛ ============
function AuditPage({ data }: { data: ReturnType<typeof useData> }) {
  const { auditLog } = data;
  const [search, setSearch] = useState('');

  const searchLower = String(search || '').toLowerCase().trim();
  const filtered = auditLog.filter(log => {
    if (!searchLower) return true;
    const newValue = String(log.newValue ?? '').toLowerCase();
    const oldValue = String(log.oldValue ?? '').toLowerCase();
    const recordId = String(log.recordId ?? '').toLowerCase();
    return newValue.includes(searchLower) || oldValue.includes(searchLower) || recordId.includes(searchLower);
  });

  const handleClearLog = async () => {
    if (!confirm('Вы уверены, что хотите очистить весь журнал изменений?\n\nЭто действие нельзя отменить!')) {
      return;
    }

    try {
      await gs.clearAuditLog();
      await data.refresh();
      alert('✅ Журнал изменений успешно очищен');
    } catch (error) {
      console.error('Ошибка очистки журнала:', error);
      alert('❌ Ошибка при очистке журнала. Попробуйте ещё раз.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}.${minutes}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Журнал изменений</h2>
          <p className="text-slate-500 text-sm mt-1">История всех действий • Всего записей: {auditLog.length}</p>
        </div>
        <button
          onClick={handleClearLog}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm"
        >
          🗑️ Очистить журнал
        </button>
      </div>

      <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm" />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Дата</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Пользователь</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Лист</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Действие</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Было → Стало</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-700 whitespace-nowrap">
                  <div>{formatDate(log.date)}</div>
                  <div className="text-xs text-slate-500">{formatTime(log.date)}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="text-sm text-slate-800">{log.userName}</div>
                  <div className="text-xs text-slate-500">{log.role}</div>
                </td>
                <td className="px-5 py-3"><span className="text-xs text-slate-700">{log.sheet}</span></td>
                <td className="px-5 py-3">
                  <span className={`text-xs ${
                    log.action === 'Создание' ? 'text-emerald-700' :
                    log.action === 'Изменение' ? 'text-blue-700' : 'text-red-700'
                  }`}>{log.action}</span>
                </td>
                <td className="px-5 py-3 text-sm">
                  <div className="flex items-center gap-1">
                    {log.oldValue && <span className="text-red-600 line-through text-xs">{log.oldValue}</span>}
                    {log.oldValue && log.newValue && <span className="text-slate-500">→</span>}
                    {log.newValue && <span className="text-emerald-600 text-xs">{log.newValue}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500"><div className="text-3xl mb-2">📝</div><p>Журнал пуст</p></div>
        )}
      </div>
    </div>
  );
}

// ============ НАСТРОЙКИ ============
function SettingsPage({ data }: { data: ReturnType<typeof useData> }) {
  const config = gs.getCurrentConfig();

  const handleDisconnect = () => {
    if (confirm('Вы уверены? Приложение перестанет работать с Google Sheets.')) {
      gs.clearConfig(); window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Настройки</h2>
        <p className="text-slate-500 text-sm mt-1">Информация о системе и подключении</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">📊 Подключение к Google Sheets</h3>
          <button onClick={handleDisconnect} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 border border-red-200">Отключить</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span className="text-sm text-slate-800">Статус: Подключено</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">URL веб-приложения</div>
            <div className="text-sm text-slate-800 font-mono break-all">{config.scriptUrl.substring(0, 50)}...</div>
          </div>
          <p className="text-xs text-slate-500">Подключение через Google Apps Script Web App</p>
        </div>
      </div>



      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">ℹ️ О системе</h3>
        </div>
        <div className="p-5 space-y-2">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Приложение</span>
            <span className="text-sm text-slate-800 font-semibold">СМУ (система медицинского учета)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Версия</span>
            <span className="text-sm text-slate-800">0.5.2 (Apps Script Web App)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Хранилище</span>
            <span className="text-sm text-slate-800">Google Sheets</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-500">Дата</span>
            <span className="text-sm text-slate-800">{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============ ЧАТ ============
function ChatPage({ data }: { data: ReturnType<typeof useData> }) {
  const { chatMessages, employees, announcements } = data;
  
  // Фильтруем сотрудников: исключаем уволенных
  const activeEmployees = employees.filter(e => e.status !== 'Уволен');
  
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

  // Функция для форматирования ФИО в формате "Фамилия И.О."
  const formatFullName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    
    const lastName = parts[0]; // Фамилия полностью
    const initials = parts.slice(1).map(p => p[0] + '.').join(''); // И.О.
    return `${lastName} ${initials}`;
  };

  // Функция для получения статуса сотрудника
  const getEmployeeStatus = (emp: any) => {
    if (emp.status === 'Уволен') return { text: 'Уволен', color: 'bg-red-100 text-red-700' };
    if (emp.blocked) return { text: 'Заблокирован', color: 'bg-orange-100 text-orange-700' };
    if (emp.shiftOpen) return { text: 'Активен', color: 'bg-emerald-100 text-emerald-700' };
    return { text: 'Не активен', color: 'bg-slate-100 text-slate-700' };
  };

  const chatWith = chatMessages.filter(m =>
    (m.fromId === selectedChat && m.toId === 'MGR') || (m.fromId === 'MGR' && m.toId === selectedChat)
  ).sort((a, b) => a.date.localeCompare(b.date));

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const emp = activeEmployees.find(e => e.id === selectedChat);
    await gs.addChatMessage({
      id: `MSG-${Date.now()}`, fromId: 'MGR', fromName: 'Руководитель',
      toId: selectedChat, toName: emp?.fullName || '',
      role: 'Руководитель', text: newMessage, priority: 'Обычное',
    });
    setNewMessage(''); data.refresh();
  };

  const handleCreateAnnouncement = async (announcement: { title: string; text: string; recipients: string[] }) => {
    try {
      await gs.createAnnouncement(announcement);
      setShowCreateAnnouncement(false);
      alert('✅ Объявление успешно создано!');
    } catch (error) {
      console.error('Ошибка создания объявления:', error);
      alert('❌ Ошибка при создании объявления. Попробуйте ещё раз.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Сообщения</h2>
          <p className="text-slate-500 text-sm mt-1">Чат с сотрудниками</p>
        </div>
        <button
          onClick={() => setShowCreateAnnouncement(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white text-sm font-medium shadow-sm"
        >
          📢 СОЗДАТЬ ОБЪЯВЛЕНИЕ
        </button>
      </div>

      {/* Панель объявлений для руководителя */}
      <AnnouncementsPanel announcements={announcements} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex h-[600px] shadow-sm">
        <div className="w-80 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-sm">Диалоги</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeEmployees.map(emp => {
              const status = getEmployeeStatus(emp);
              return (
                <button key={emp.id} onClick={() => setSelectedChat(selectedChat === emp.id ? '' : emp.id)}
                  className={`w-full p-4 flex items-center gap-3 text-left border-b border-slate-100 ${
                    selectedChat === emp.id ? 'bg-red-50 border-l-4 border-l-red-500' : 'hover:bg-slate-50'
                  }`}>
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white">{emp.fullName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{formatFullName(emp.fullName)}</div>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center text-slate-500">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium">Выберите сотрудника для начала диалога</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {activeEmployees.find(e => e.id === selectedChat)?.fullName[0] || '?'}
                </div>
                <div>
                  <div className="font-medium text-slate-800">
                    {activeEmployees.find(e => e.id === selectedChat) ? formatFullName(activeEmployees.find(e => e.id === selectedChat)!.fullName) : ''}
                  </div>
                  <div className="text-xs text-slate-500">{activeEmployees.find(e => e.id === selectedChat)?.position}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {chatWith.length === 0 ? (
                  <div className="text-center text-slate-500 mt-8">
                    <div className="text-4xl mb-2">💬</div><p>Нет сообщений</p>
                  </div>
                ) : chatWith.map(msg => (
                  <div key={msg.id} className={`flex ${msg.fromId === 'MGR' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      msg.fromId === 'MGR' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <div className={`text-xs mt-1 ${msg.fromId === 'MGR' ? 'text-blue-100' : 'text-slate-500'}`}>{msg.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Введите сообщение..."
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
                  <button onClick={sendMessage} disabled={!newMessage.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 rounded-xl text-white font-medium">➤</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateAnnouncement && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateAnnouncement(false)}
          onCreate={handleCreateAnnouncement}
        />
      )}
    </div>
  );
}

// ============ ОТЧЁТЫ ============
function ReportsPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, arrivals, expenses, nomenclature, expenseSheets } = data;
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const reportData = employees.filter(e => e.status !== 'Уволен').map(emp => {
    const expenseSheetsCount = expenseSheets.filter(s => s.employeeId === emp.id && s.month === selectedMonth && !s.archived).length;
    const arrival = arrivals.filter(a => a.employeeId === emp.id && a.month === selectedMonth && !a.archived).reduce((s, a) => s + a.amount, 0);
    const expense = expenseSheets.filter(s => s.employeeId === emp.id && s.month === selectedMonth && !s.archived).reduce((s, sheet) => s + sheet.totalAmount, 0);
    return { emp, expenseSheetsCount, arrival, expense, balance: arrival - expense };
  });

  const totals = {
    expenseSheetsCount: reportData.reduce((s, r) => s + r.expenseSheetsCount, 0),
    arrival: reportData.reduce((s, r) => s + r.arrival, 0),
    expense: reportData.reduce((s, r) => s + r.expense, 0),
    balance: reportData.reduce((s, r) => s + r.balance, 0),
  };

  // Форматирование даты в ММ.ГГ
  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${month}.${year.slice(-2)}`;
  };

  const exportCSV = () => {
    const headers = ['ФИО', 'Должность', 'Приход (₽)', 'Расход (₽)', 'Остаток (₽)', 'Листы расхода'];
    const rows = reportData.map(r => [r.emp.fullName, r.emp.position, r.arrival, r.expense, r.balance, r.expenseSheetsCount]);
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Отчет_${selectedMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Отчёты</h2>
          <p className="text-slate-500 text-sm mt-1">Ежемесячные отчёты</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium shadow-sm">📊 Экспорт CSV</button>
      </div>

      <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Приход</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{totals.arrival.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Расход</div>
          <div className="text-xl font-bold text-red-600 mt-1">{totals.expense.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Остаток</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{totals.balance.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Листов расхода</div>
          <div className="text-xl font-bold text-orange-600 mt-1">{totals.expenseSheetsCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">📋 Отчёт за {formatMonthYear(selectedMonth)}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">№</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">ФИО</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Приход</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Расход</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Остаток</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Листы расхода</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, i) => (
              <tr key={row.emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-500">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="text-sm font-medium text-slate-800">{row.emp.fullName}</div>
                  <div className="text-xs text-slate-500">{row.emp.position}</div>
                </td>
                <td className="px-5 py-3 text-right text-sm text-emerald-600">{row.arrival.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-right text-sm text-red-600">{row.expense.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-blue-600">
                  {row.balance.toLocaleString('ru-RU')} ₽
                </td>
                <td className="px-5 py-3 text-right text-sm text-orange-600">{row.expenseSheetsCount}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td className="px-5 py-3" colSpan={2}><span className="text-sm text-slate-800">ИТОГО</span></td>
              <td className="px-5 py-3 text-right text-sm text-emerald-600">{totals.arrival.toLocaleString('ru-RU')} ₽</td>
              <td className="px-5 py-3 text-right text-sm text-red-600">{totals.expense.toLocaleString('ru-RU')} ₽</td>
              <td className="px-5 py-3 text-right text-sm font-semibold text-blue-600">
                {totals.balance.toLocaleString('ru-RU')} ₽
              </td>
              <td className="px-5 py-3 text-right text-sm text-orange-600">{totals.expenseSheetsCount}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArrivalCardModal({ 
  employees, 
  nomenclature,
  initialData,
  onClose, 
  onAdd 
}: { 
  employees: gs.Employee[]; 
  nomenclature: gs.Nomenclature[];
  initialData?: gs.Arrival;
  onClose: () => void; 
  onAdd: (form: any) => void 
}) {
  type ArrivalItem = { nomenclatureId: string; quantity: number; price: number; total: number };
  
  const [form, setForm] = useState({
    employeeId: initialData?.employeeId || employees[0]?.id || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    items: ((initialData as any)?.items || []) as ArrivalItem[]
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredNomenclature = nomenclature.filter(n => {
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      n.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addItem = (item: gs.Nomenclature) => {
    const existingItem = form.items.find((i: ArrivalItem) => i.nomenclatureId === item.id);
    if (existingItem) {
      setForm({
        ...form,
        items: form.items.map((i: ArrivalItem) => 
          i.nomenclatureId === item.id 
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
            : i
        )
      });
    } else {
      setForm({
        ...form,
        items: [...form.items, {
          nomenclatureId: item.id,
          quantity: 1,
          price: item.currentPrice,
          total: item.currentPrice
        }]
      });
    }
  };

  const updateQuantity = (nomenclatureId: string, quantity: number) => {
    if (quantity <= 0) {
      setForm({
        ...form,
        items: form.items.filter((i: ArrivalItem) => i.nomenclatureId !== nomenclatureId)
      });
    } else {
      setForm({
        ...form,
        items: form.items.map((i: ArrivalItem) => 
          i.nomenclatureId === nomenclatureId 
            ? { ...i, quantity, total: quantity * i.price }
            : i
        )
      });
    }
  };

  const totalAmount = form.items.reduce((sum: number, item: ArrivalItem) => sum + item.total, 0);

  const handleSubmit = () => {
    if (form.items.length === 0) {
      alert('Добавьте хотя бы одну позицию');
      return;
    }
    const selectedEmployee = employees.find(e => e.id === form.employeeId);
    onAdd({
      employeeId: form.employeeId,
      employeeName: selectedEmployee?.fullName || '',
      date: form.date,
      items: form.items,
      amount: totalAmount,
      shifts: 0,
      type: 'Плановый',
      comment: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">📥 Карта прихода</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Дата</label>
              <input 
                type="date" 
                value={form.date} 
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Сотрудник</label>
              <select 
                value={form.employeeId} 
                onChange={e => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>
          </div>

          {/* Выбор категории */}
          <div>
            <label className="text-sm text-slate-600 mb-2 block">Выберите категорию</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Все
              </button>
              <button 
                onClick={() => setSelectedCategory('ЛС ПКУ')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === 'ЛС ПКУ' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                💉 ЛС ПКУ
              </button>
              <button 
                onClick={() => setSelectedCategory('ЛС')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === 'ЛС' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                💊 ЛС
              </button>
              <button 
                onClick={() => setSelectedCategory('Расходный материал')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === 'Расходный материал' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🩹 Расходники
              </button>
              <button 
                onClick={() => setSelectedCategory('Оборудование')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === 'Оборудование' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🧰 Оборудование
              </button>