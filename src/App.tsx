import { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import * as gs from './services/googleSheets';

const LOGO_URL = '/logo.png';

// Placeholder for useData - will be defined later
function useData() {
  return {} as any;
}

// Placeholder components - will be defined later
function AddNomenclatureModal(props: any) {
  return null;
}

function EditNomenclatureModal(props: any) {
  return null;
}

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
            </div>
          </div>

          {/* Поиск и список номенклатуры */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Доступные позиции</h4>
            <input
              type="text"
              placeholder="Поиск по наименованию..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 mb-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {filteredNomenclature.map(item => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.currentPrice.toLocaleString('ru-RU')} ₽ / {item.unit}</div>
                  </div>
                  <span className="text-blue-600 text-lg">+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Выбранные позиции */}
          {form.items.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700">Выбранные позиции</h4>
              </div>
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '50%' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '150px' }} />
                  <col style={{ width: '150px' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Наименование</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase">Кол-во</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase">Цена за ед.</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item: ArrivalItem) => {
                    const nom = nomenclature.find(n => n.id === item.nomenclatureId);
                    return (
                      <tr key={item.nomenclatureId} className="border-b border-slate-100">
                        <td className="px-4 py-3 text-sm text-slate-800 truncate">{nom?.name}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateQuantity(item.nomenclatureId, parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full px-2 py-1 text-center border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">{item.price.toLocaleString('ru-RU')} ₽</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">{item.total.toLocaleString('ru-RU')} ₽</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm text-slate-800">ИТОГО:</td>
                    <td className="px-4 py-3 text-right text-lg text-emerald-600">{totalAmount.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button 
            onClick={handleSubmit} 
            disabled={form.items.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 rounded-lg text-white font-medium"
          >
            💾 Сохранить карту прихода
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ КОМПОНЕНТ ОТОБРАЖЕНИЯ ОБЪЯВЛЕНИЙ ============
function AnnouncementsPanel({ announcements }: { announcements: gs.Announcement[] }) {
  const activeAnnouncements = announcements.filter(a => a.active);
  
  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
        📢 Объявления
      </h3>
      <div className="space-y-3">
        {activeAnnouncements.map(announcement => (
          <div key={announcement.id} className="bg-white rounded-lg p-4 border border-yellow-200">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-slate-800">{announcement.title}</h4>
              <span className="text-xs text-slate-500">
                {new Date(announcement.date).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{announcement.text}</p>
            <div className="mt-2 text-xs text-slate-500">
              От: {announcement.createdBy}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ОБЪЯВЛЕНИЯ ============
function CreateAnnouncementModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (announcement: { title: string; text: string; recipients: string[] }) => void;
}) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [recipients, setRecipients] = useState<string[]>(['employees', 'warehouse']);

  const handleSubmit = () => {
    if (!title.trim() || !text.trim()) {
      alert('Заполните заголовок и текст объявления');
      return;
    }
    onCreate({ title, text, recipients });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">📢 Создать объявление</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Заголовок *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Введите заголовок объявления"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Текст объявления *</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Введите текст объявления"
              rows={6}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-2 block">Получатели</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recipients.includes('employees')}
                  onChange={e => {
                    if (e.target.checked) {
                      setRecipients([...recipients, 'employees']);
                    } else {
                      setRecipients(recipients.filter(r => r !== 'employees'));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Сотрудники</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recipients.includes('warehouse')}
                  onChange={e => {
                    if (e.target.checked) {
                      setRecipients([...recipients, 'warehouse']);
                    } else {
                      setRecipients(recipients.filter(r => r !== 'warehouse'));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Кладовщик</span>
              </label>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !text.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 rounded-lg text-white font-medium"
          >
            📢 Опубликовать
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ КОМПОНЕНТ ЛИСТА РАСХОДА ============
function ExpenseSheetView({
  sheet,
  employees,
  onArchive,
  onEdit,
  onRestore,
  isArchived = false
}: {
  sheet: gs.ExpenseSheet;
  employees: gs.Employee[];
  onArchive: (id: string) => void;
  onEdit: (sheet: gs.ExpenseSheet) => void;
  onRestore?: (id: string) => void;
  isArchived?: boolean;
}) {
  const emp = employees.find(e => e.id === sheet.employeeId);
  const limit = sheet.therapyCost > 0 ? (sheet.totalAmount * 100) / sheet.therapyCost : 0;
  const limitAmount = sheet.therapyCost * 0.05;
  const isExceeded = limit > 5;
  const isLow = limit < 2.5;

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  // Функция для форматирования ФИО в "Фамилия И.О."
  const formatFullName = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    
    const lastName = parts[0]; // Фамилия полностью
    const initials = parts.slice(1).map(part => part[0] + '.').join(''); // И.О.
    return `${lastName} ${initials}`;
  };

  const employeeFormatted = formatFullName(emp?.fullName || sheet.employeeName);
  const patientFormatted = formatFullName(sheet.patientName);

  const handleExportToExcel = () => {
    // Создаём CSV только с нужными полями
    let csv = 'Лист расхода\n\n';
    csv += `Дата составления:,${formatDateShort(sheet.date)}\n`;
    csv += `Сотрудник:,${employeeFormatted}\n`;
    csv += `Пациент:,${patientFormatted}\n`;
    csv += `Дата рождения:,${sheet.patientBirthDate ? formatDateShort(sheet.patientBirthDate) : '-'}\n\n`;
    
    csv += 'Препараты и расходники\n';
    csv += 'Название,Тип,Количество,Цена за единицу,Сумма\n';
    
    // Сортируем: ЛС ПКУ всегда первые
    const sortedItems = [...sheet.items].sort((a, b) => {
      if (a.category === 'ЛС ПКУ' && b.category !== 'ЛС ПКУ') return -1;
      if (a.category !== 'ЛС ПКУ' && b.category === 'ЛС ПКУ') return 1;
      return 0;
    });
    
    sortedItems.forEach(item => {
      csv += `${item.name},${item.category},${item.quantity},${item.pricePerUnit},${item.total}\n`;
    });
    
    csv += `\nИТОГО,,,,${sheet.totalAmount}\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Лист_расхода_${patientFormatted}_${formatDateShort(sheet.date)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
      {/* Шапка - светло-серый цвет */}
      <div className="bg-slate-100 px-6 py-4 border-b border-slate-300">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-slate-800">Лист расхода</h2>
        <div className="flex gap-2">
          {isArchived && onRestore && (
            <button 
              onClick={() => onRestore(sheet.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors min-w-[120px]"
              title="Восстановить из архива"
            >
              ♻️ Восстановить
            </button>
          )}
          <button 
            onClick={() => onEdit(sheet)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors min-w-[120px]"
            title="Редактировать"
          >
            ✍️ Редактировать
          </button>
          {!isArchived && (
            <button 
              onClick={() => onArchive(sheet.id)}
              className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm rounded transition-colors min-w-[120px]"
              title="Отправить в архив"
            >
              📦 В архив
            </button>
          )}
          <button 
            onClick={handleExportToExcel}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors min-w-[120px]"
            title="Импорт в Excel"
          >
            📊 Импорт в Excel
          </button>
        </div>        </div>
        
        {/* Информация в шапке */}
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <span className="text-slate-600">Дата составления:</span>{' '}
              <span className="font-semibold">{formatDateShort(sheet.date)}</span>
            </div>
            <div>
              <span className="text-slate-600">Сотрудник:</span>{' '}
              <span className="font-semibold">{employeeFormatted}</span>
            </div>
            <div>
              <span className="text-slate-600">Пациент:</span>{' '}
              <span className="font-semibold">{patientFormatted}</span>
            </div>
            <div>
              <span className="text-slate-600">Дата рождения:</span>{' '}
              <span className="font-semibold">{sheet.patientBirthDate ? formatDateShort(sheet.patientBirthDate) : '-'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-2">
            <div>
              <span className="text-slate-600">Категория выезда:</span>{' '}
              <span className="font-semibold">{sheet.callCategory}</span>
            </div>
            <div>
              <span className="text-slate-600">Название терапии:</span>{' '}
              <span className="font-semibold">{sheet.therapyName || '-'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <span className="text-slate-600">Стоимость терапии:</span>{' '}
              <span className="font-semibold">
                {sheet.therapyCost.toLocaleString('ru-RU')} ₽
                {sheet.therapyCost > 0 && (
                  <span className="text-slate-500 ml-2">(лимит: {limitAmount.toLocaleString('ru-RU')} ₽)</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-600">Итого по препаратам:</span>{' '}
              <span className="font-semibold">{sheet.totalAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          {/* Использование лимита */}
          {sheet.therapyCost > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-700">Использование лимита</span>
                <span className={`text-sm ${isExceeded ? 'text-red-600' : isLow ? 'text-slate-500' : 'text-emerald-600'}`}>
                  {limit.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isExceeded ? 'bg-red-500' : isLow ? 'bg-slate-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(limit, 100)}%` }}
                ></div>
              </div>
              {isExceeded && <div className="text-xs text-red-600 mt-1">⚠️ Превышение лимита 5%</div>}
              {isLow && <div className="text-xs text-slate-500 mt-1">ℹ️ Лимит ниже 2.5%</div>}
            </div>
          )}
        </div>
      </div>

      {/* Тело - белый цвет */}
      <div className="bg-white p-6">
        {/* Препараты и расходники */}
        <div className="mb-2">
          <h3 className="text-base font-semibold text-slate-800">Препараты и расходники</h3>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
          <table className="w-full border-collapse">
            <colgroup>
              <col style={{ width: '40%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300">Название</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300">Тип</th>
                <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border border-slate-300">Количество</th>
                <th className="px-3 py-2 text-right text-sm font-semibold text-slate-700 border border-slate-300">Цена за единицу</th>
                <th className="px-3 py-2 text-right text-sm font-semibold text-slate-700 border border-slate-300">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {sheet.items.length > 0 ? (
                [...sheet.items]
                  .sort((a, b) => {
                    // ЛС ПКУ всегда первые
                    if (a.category === 'ЛС ПКУ' && b.category !== 'ЛС ПКУ') return -1;
                    if (a.category !== 'ЛС ПКУ' && b.category === 'ЛС ПКУ') return 1;
                    return 0;
                  })
                  .map(item => (
                    <tr key={item.nomenclatureId} className="border-b border-slate-200">
                      <td className="px-3 py-2 text-sm text-slate-800 border border-slate-300">{item.name}</td>
                      <td className="px-3 py-2 text-sm text-slate-700 border border-slate-300">{item.category}</td>
                      <td className="px-3 py-2 text-center text-sm text-slate-800 border border-slate-300">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-sm text-slate-700 border border-slate-300">{item.pricePerUnit.toLocaleString('ru-RU')} ₽</td>
                      <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800 border border-slate-300">{item.total.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-sm text-slate-400 border border-slate-300">Нет данных</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50">
                <td className="px-3 py-2 text-left text-sm font-semibold text-slate-800 border border-slate-300">ИТОГО</td>
                <td colSpan={3} className="border border-slate-300"></td>
                <td className="px-3 py-2 text-right text-sm font-semibold text-blue-600 border border-slate-300">{sheet.totalAmount.toLocaleString('ru-RU')} ₽</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ РАСХОД У СОТРУДНИКА ============
// ============ АРХИВ ============
function ArchivePage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, expenseSheets, setExpenseSheets, arrivals, setArrivals } = data;
  const [filterType, setFilterType] = useState<'month' | 'quarter' | 'halfyear' | 'year' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showArchiveList, setShowArchiveList] = useState(false);
  const [showFiredEmployees, setShowFiredEmployees] = useState(false);
  const [showArrivalsArchive, setShowArrivalsArchive] = useState(false);
  
  // Получение уволенных сотрудников
  const firedEmployees = employees.filter(e => e.status === 'Уволен');

  // Функция для определения периода
  const getPeriodMonths = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    switch (filterType) {
      case 'month':
        return [selectedMonth];
      case 'quarter': {
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        const months = [];
        for (let i = 0; i < 3; i++) {
          const month = quarterStart + i;
          months.push(`${currentYear}-${String(month + 1).padStart(2, '0')}`);
        }
        return months;
      }
      case 'halfyear': {
        const halfyearStart = Math.floor(currentMonth / 6) * 6;
        const months = [];
        for (let i = 0; i < 6; i++) {
          const month = halfyearStart + i;
          months.push(`${currentYear}-${String(month + 1).padStart(2, '0')}`);
        }
        return months;
      }
      case 'year': {
        const months = [];
        for (let i = 0; i < 12; i++) {
          months.push(`${currentYear}-${String(i + 1).padStart(2, '0')}`);
        }
        return months;
      }
      case 'all':
        return []; // Пустой массив означает все месяцы
      default:
        return [selectedMonth];
    }
  };

  // Фильтрация по выбранному периоду (только архивированные)
  const archivedSheets = expenseSheets.filter(s => {
    if (!s.archived) return false;
    if (filterType === 'all') return true;
    const periodMonths = getPeriodMonths();
    return periodMonths.includes(s.month);
  });

  // Фильтрация архивированных карт прихода
  const archivedArrivals = arrivals.filter(a => {
    if (!a.archived) return false;
    if (filterType === 'all') return true;
    const periodMonths = getPeriodMonths();
    return periodMonths.includes(a.month);
  });

  // Расчёт статистики
  const totalExpense = archivedSheets.reduce((sum, s) => sum + s.totalAmount, 0);
  const sheetsCount = archivedSheets.length;
  const totalArrivalAmount = archivedArrivals.reduce((sum, a) => sum + a.amount, 0);
  const arrivalsCount = archivedArrivals.length;

  // Генерация списка месяцев
  const generateMonthOptions = () => {
    const months = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthName });
    }
    return months;
  };

  // Получение текста для отображения периода
  const getPeriodLabel = () => {
    const now = new Date();
    switch (filterType) {
      case 'month':
        return new Date(selectedMonth + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `${quarter} квартал ${now.getFullYear()}`;
      }
      case 'halfyear': {
        const halfyear = Math.floor(now.getMonth() / 6) + 1;
        return `${halfyear} полугодие ${now.getFullYear()}`;
      }
      case 'year':
        return `${now.getFullYear()} год`;
      case 'all':
        return 'Всё время';
      default:
        return '';
    }
  };

  // Восстановление из архива
  const handleRestoreSheet = async (id: string) => {
    if (!confirm('Восстановить лист расхода из архива?')) return;
    setExpenseSheets(expenseSheets.map(s => s.id === id ? { ...s, archived: false } : s));
    try {
      await gs.restoreExpenseSheet(id);
    } catch (err) {
      console.error('Ошибка восстановления:', err);
      alert('Ошибка при восстановлении. Попробуйте ещё раз.');
    }
  };

  // Восстановление карты прихода из архива
  const handleRestoreArrival = async (id: string) => {
    if (!confirm('Восстановить карту прихода из архива?')) return;
    setArrivals(arrivals.map(a => a.id === id ? { ...a, archived: false } : a));
    try {
      await gs.restoreArrival(id);
    } catch (err) {
      console.error('Ошибка восстановления:', err);
      alert('Ошибка при восстановлении. Попробуйте ещё раз.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">🗄️ Архив</h2>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="halfyear">Полгода</option>
            <option value="year">Год</option>
            <option value="all">Всё время</option>
          </select>
          {filterType === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {generateMonthOptions().map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-3 gap-4">
        <div 
          onClick={() => setShowArchiveList(true)}
          className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="text-xs text-slate-500 uppercase mb-2">ЛИСТОВ РАСХОДА В АРХИВЕ</div>
          <div className="text-2xl font-bold text-slate-600">{sheetsCount}</div>
          <div className="text-xs text-slate-500 mt-2 uppercase">{getPeriodLabel()}</div>
        </div>

        <div 
          onClick={() => setShowArrivalsArchive(true)}
          className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-green-500 hover:shadow-md transition-all"
        >
          <div className="text-xs text-slate-500 uppercase mb-2">КАРТ ПРИХОДА В АРХИВЕ</div>
          <div className="text-2xl font-bold text-green-600">{arrivalsCount}</div>
          <div className="text-xs text-slate-500 mt-2 uppercase">{getPeriodLabel()}</div>
        </div>
        
        <div 
          onClick={() => setShowFiredEmployees(true)}
          className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-red-500 hover:shadow-md transition-all"
        >
          <div className="text-xs text-slate-500 uppercase mb-2">СОТРУДНИКИ</div>
          <div className="text-2xl font-bold text-red-600">{firedEmployees.length}</div>
          <div className="text-xs text-slate-500 mt-2 uppercase">Уволено</div>
        </div>
      </div>

      {/* Модальное окно со списком архивированных листов */}
      {showArchiveList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-300">
              <h2 className="text-xl font-bold text-slate-800">🗄️ Архивированные листы расхода</h2>
              <button 
                onClick={() => setShowArchiveList(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {archivedSheets.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
                  <p>Нет архивированных листов расхода за {getPeriodLabel()}</p>
                </div>
              ) : (
                archivedSheets.map(sheet => (
                  <ExpenseSheetView
                    key={sheet.id}
                    sheet={sheet}
                    employees={employees}
                    onArchive={() => {}}
                    onEdit={() => {}}
                    onRestore={handleRestoreSheet}
                    isArchived={true}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно со списком уволенных сотрудников */}
      {showFiredEmployees && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-300">
              <h2 className="text-xl font-bold text-slate-800">👥 Уволенные сотрудники</h2>
              <button 
                onClick={() => setShowFiredEmployees(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {firedEmployees.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
                  <p>Нет уволенных сотрудников</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {firedEmployees.map(emp => (
                    <div key={emp.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-lg">
                          {emp.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{emp.fullName}</div>
                          <div className="text-sm text-slate-500 mt-1">{emp.position}</div>
                          {emp.phone && (
                            <div className="text-xs text-slate-400 mt-2">
                              Телефон: {emp.phone}
                            </div>
                          )}
                          {emp.hireDate && (
                            <div className="text-xs text-blue-600 mt-1">
                              Дата найма: {new Date(emp.hireDate).toLocaleDateString('ru-RU')}
                            </div>
                          )}
                          <div className="text-xs text-red-600 mt-1">
                            Дата увольнения: {new Date().toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно со списком архивированных карт прихода */}
      {showArrivalsArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-300">
              <h2 className="text-xl font-bold text-slate-800">📥 Архивированные карты прихода</h2>
              <button 
                onClick={() => setShowArrivalsArchive(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {archivedArrivals.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
                  <p>Нет архивированных карт прихода за {getPeriodLabel()}</p>
                </div>
              ) : (
                archivedArrivals.map(arrival => (
                  <div key={arrival.id} className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-slate-100 px-6 py-4 border-b border-slate-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Карта прихода</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {new Date(arrival.date).toLocaleDateString('ru-RU')} • {arrival.employeeName || 'Сотрудник'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestoreArrival(arrival.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors"
                        >
                          ♻️ Восстановить
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-slate-600">Сумма:</span>
                          <span className="ml-2 text-lg font-bold text-emerald-600">{arrival.amount.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Тип:</span>
                          <span className="ml-2 text-sm font-semibold">{arrival.type}</span>
                        </div>
                      </div>
                      {arrival.items && arrival.items.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Позиции:</h4>
                          <div className="space-y-2">
                            {arrival.items.map((item, idx) => {
                              const nomenclatureItem = data.nomenclature.find(n => n.id === item.nomenclatureId);
                              return (
                                <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                  <span className="text-sm text-slate-700">{nomenclatureItem?.name || 'Номенклатура'}</span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽ = {item.total.toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpensePage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, expenseSheets, setExpenseSheets, nomenclature } = data;
  const [editingSheet, setEditingSheet] = useState<gs.ExpenseSheet | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // По умолчанию показываем предыдущий месяц
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
  });

  // Фильтрация по месяцу (для отображения)
  const filteredSheets = expenseSheets.filter(s => s.month === selectedMonth && !s.archived);

  // Все листы за месяц (включая архивированные) для расчёта статистики
  const allSheetsForMonth = expenseSheets.filter(s => s.month === selectedMonth);

  // Расчёт статистики за выбранный месяц (включая архивированные)
  const totalExpense = allSheetsForMonth.reduce((sum, s) => sum + s.totalAmount, 0);
  const sheetsCount = allSheetsForMonth.length;
  const exceededLimit = allSheetsForMonth.filter(s => {
    if (s.therapyCost === 0) return false;
    const limit = (s.totalAmount * 100) / s.therapyCost;
    return limit > 5 || limit < 2.5; // Лимит вне диапазона 2.5% - 5%
  }).length;

  // Генерация списка месяцев
  const generateMonthOptions = () => {
    const months = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthName });
    }
    return months;
  };

  // Архивирование листа расхода
  const handleArchiveSheet = async (id: string) => {
    if (!confirm('Отправить лист расхода в архив?')) return;
    setExpenseSheets(expenseSheets.map(s => s.id === id ? { ...s, archived: true } : s));
    try {
      await gs.archiveExpenseSheet(id);
    } catch (err) {
      console.error('Ошибка архивирования:', err);
      alert('Ошибка при архивировании. Попробуйте ещё раз.');
    }
  };

  // Редактирование листа расхода
  const handleEditSheet = (sheet: gs.ExpenseSheet) => {
    setEditingSheet(sheet);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📤 Расход у сотрудника</h2>
          <p className="text-slate-500 text-sm mt-1">Листы расхода</p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {generateMonthOptions().map(month => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="text-xs text-slate-500 uppercase mb-2">ОБЩАЯ СУММА РАСХОДА ЗА МЕСЯЦ</div>
          <div className="text-2xl font-bold text-emerald-600 min-h-[40px] flex items-center">{totalExpense.toLocaleString('ru-RU')} ₽</div>
          <div className="text-xs text-slate-500 mt-2 uppercase">{new Date(selectedMonth + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="text-xs text-slate-500 uppercase mb-2">ЛИСТОВ РАСХОДА ЗА МЕСЯЦ</div>
          <div className="text-2xl font-bold text-blue-600 min-h-[40px] flex items-center">{sheetsCount}</div>
          <div className="text-xs text-slate-500 mt-2 uppercase">{new Date(selectedMonth + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="text-xs text-slate-500 uppercase mb-2">ЛИСТОВ С ОТКЛОНЕНИЕМ ОТ ЛИМИТА</div>
          <div className="text-2xl font-bold text-red-600 min-h-[40px] flex items-center">{exceededLimit}</div>
          <div className="text-xs text-slate-500 mt-2 uppercase">{new Date(selectedMonth + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Листы расхода */}
      <div className="space-y-6">
        {filteredSheets.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
            <p>Нет листов расхода за выбранный месяц</p>
          </div>
        ) : (
          filteredSheets.map(sheet => (
            <ExpenseSheetView 
              key={sheet.id} 
              sheet={sheet} 
              employees={employees}
              onArchive={handleArchiveSheet}
              onEdit={handleEditSheet}
            />
          ))
        )}
      </div>

      {/* Модальное окно редактирования */}
      {editingSheet && (
        <EditExpenseSheetModal
          sheet={editingSheet}
          employees={employees}
          nomenclature={nomenclature}
          onClose={() => setEditingSheet(null)}
          onSave={(updatedSheet) => {
            setExpenseSheets(expenseSheets.map(s => s.id === updatedSheet.id ? updatedSheet : s));
            gs.updateExpenseSheet(updatedSheet.id, updatedSheet).catch(err => {
              console.error('Ошибка обновления листа расхода:', err);
              alert('Ошибка при обновлении листа расхода. Попробуйте ещё раз.');
            });
            setEditingSheet(null);
          }}
        />
      )}
    </div>
  );
}

// ============ ОСТАТОК У СОТРУДНИКА ============
function BalancePage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, nomenclature, arrivals, expenseSheets } = data;
  
  // Получаем всех сотрудников, кроме уволенных (включая Неактивен, Отпуск и т.д.)
  // Убираем дубликаты по ФИО — оставляем только первую запись с таким ФИО
  const seenNames = new Set<string>();
  const allEmployees = employees.filter(e => {
    if (e.status === 'Уволен') return false;
    const fullName = String(e.fullName ?? '').trim().toLowerCase();
    if (seenNames.has(fullName)) {
      return false;
    }
    seenNames.add(fullName);
    return true;
  });
  
  // Отладка: выводим всех сотрудников и их статусы
  console.log('👥 ВСЕ СОТРУДНИКИ (включая уволенных):', employees.map(e => ({
    id: e.id,
    fullName: e.fullName,
    status: e.status,
    blocked: e.blocked,
    shiftOpen: e.shiftOpen
  })));
  
  console.log('✅ СОТРУДНИКИ ДЛЯ ОСТАТКОВ (без дубликатов и уволенных):', allEmployees.map(e => ({
    id: e.id,
    fullName: e.fullName,
    status: e.status
  })));
  
  // Проверяем, есть ли Григорьева в списке
  const grigorieva = employees.find(e => e.fullName.includes('Григорьева'));
  if (grigorieva) {
    console.log('🔍 ГРИГОРЬЕВА найдена:', {
      id: grigorieva.id,
      fullName: grigorieva.fullName,
      status: grigorieva.status,
      isInAllEmployees: allEmployees.some(e => e.id === grigorieva.id)
    });
    
    // Проверяем приходы Григорьевой
    const grigorievaArrivals = arrivals.filter(a => a.employeeId === grigorieva.id);
    console.log('📥 Приходы Григорьевой:', grigorievaArrivals.length, grigorievaArrivals.map(a => ({
      id: a.id,
      employeeId: a.employeeId,
      amount: a.amount,
      archived: a.archived,
      itemsCount: Array.isArray(a.items) ? a.items.length : 'N/A'
    })));
  } else {
    console.warn('⚠️ ГРИГОРЬЕВА НЕ НАЙДЕНА в списке сотрудников!');
  }

  // Отладочная информация - выводим все приходы
  console.log('📊 ВСЕ ПРИХОДЫ:', arrivals.map(a => ({
    id: a.id,
    employeeId: a.employeeId,
    employeeName: a.employeeName,
    amount: a.amount,
    archived: a.archived,
    items: a.items,
    itemsType: typeof a.items,
    isArray: Array.isArray(a.items),
    itemsLength: Array.isArray(a.items) ? a.items.length : 'N/A'
  })));
  
  console.log('👥 ВСЕ СОТРУДНИКИ:', allEmployees.map(e => ({
    id: e.id,
    fullName: e.fullName,
    status: e.status
  })));
  
  // Проверяем приходы для каждого сотрудника
  allEmployees.forEach((emp: gs.Employee) => {
    const empArrivals = arrivals.filter(a => a.employeeId === emp.id && a.archived !== true);
    console.log(`📥 Приходы для ${emp.fullName} (${emp.id}):`, empArrivals.length, empArrivals.map(a => ({
      id: a.id,
      amount: a.amount,
      items: a.items,
      itemsType: typeof a.items,
      isArray: Array.isArray(a.items)
    })));
  });

  // Функция для расчёта остатка по сотруднику и номенклатуре
  const calculateBalance = (employeeId: string, nomenclatureId: string): number => {
    // Считаем приходы (только неархивированные и существующие)
    let totalArrival = 0;
    arrivals.forEach(arrival => {
      // Проверяем, что запись не архивирована и существует в базе
      if (arrival.employeeId === employeeId && 
          arrival.archived !== true && 
          arrival.id) {
        // Проверяем, что items существует и является массивом
        let items = arrival.items;
        
        // Если items - строка, пытаемся распарсить
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            console.warn('Не удалось распарсить items для прихода:', arrival.id, items);
            items = [];
          }
        }
        
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((item: any) => {
            if (item.nomenclatureId === nomenclatureId) {
              totalArrival += Number(item.quantity) || 0;
            }
          });
        }
      }
    });

    // Считаем расходы (только неархивированные и существующие)
    let totalExpense = 0;
    expenseSheets.forEach(sheet => {
      if (sheet.employeeId === employeeId && 
          sheet.archived !== true && 
          sheet.id) {
        // Проверяем, что items существует и является массивом
        let items = sheet.items;
        
        // Если items - строка, пытаемся распарсить
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            console.warn('Не удалось распарсить items для расхода:', sheet.id, items);
            items = [];
          }
        }
        
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((item: any) => {
            if (item.nomenclatureId === nomenclatureId) {
              totalExpense += Number(item.quantity) || 0;
            }
          });
        }
      }
    });

    return totalArrival - totalExpense;
  };

  // Функция для расчёта общего количества по номенклатуре
  const calculateTotalQuantity = (nomenclatureId: string): number => {
    let total = 0;
    allEmployees.forEach((emp: gs.Employee) => {
      total += calculateBalance(emp.id, nomenclatureId);
    });
    return total;
  };

  // Функция для расчёта общей стоимости по сотруднику
  const calculateEmployeeTotal = (employeeId: string): number => {
    let total = 0;
    nomenclature.forEach(item => {
      const balance = calculateBalance(employeeId, item.id);
      total += balance * item.currentPrice;
    });
    return total;
  };

  // Функция для расчёта общего итога
  const calculateGrandTotal = (): number => {
    let total = 0;
    allEmployees.forEach((emp: gs.Employee) => {
      total += calculateEmployeeTotal(emp.id);
    });
    return total;
  };

  return (
    <div className="space-y-4">
      {/* Блок 1: Шапка */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-800">🧰 Остаток у сотрудника</h2>
        <p className="text-slate-600 mt-1">Просмотр остатков номенклатуры у сотрудников</p>
      </div>

      {/* Блок 2: Таблица остатков */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-w-full">
        <div className="overflow-x-auto overflow-y-auto max-w-full" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <table className="border-collapse bg-white" style={{ borderSpacing: 0 }}>
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300 sticky left-0 bg-slate-100 z-30" style={{ minWidth: '220px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>Номенклатура</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300 sticky left-[220px] bg-slate-100 z-31" style={{ minWidth: '100px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, inset 1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>Ед. изм.</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300 sticky left-[320px] bg-slate-100 z-32" style={{ minWidth: '110px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, inset 1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>Цена за ед.</th>
                {allEmployees.map((emp: gs.Employee) => {
                  const parts = emp.fullName.trim().split(' ');
                  const lastName = parts[0] || '';
                  const initials = parts.slice(1).map((p: string) => p[0] + '.').join('');
                  const formattedName = initials ? `${lastName} ${initials}` : lastName;
                  return (
                    <th key={emp.id} className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300 bg-slate-100" style={{ minWidth: '130px' }}>
                      {formattedName}
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300 bg-slate-200 sticky right-[130px] z-31" style={{ minWidth: '110px', boxShadow: 'inset 1px 0 0 0 #cbd5e1, inset -1px 0 0 0 #cbd5e1, -2px 0 4px -1px rgba(0,0,0,0.2)' }}>Итого кол-во</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300 bg-slate-200 sticky right-0 z-32" style={{ minWidth: '130px', boxShadow: 'inset 1px 0 0 0 #cbd5e1, -2px 0 4px -1px rgba(0,0,0,0.2)' }}>Итого сумма</th>
              </tr>
            </thead>
            <tbody>
              {nomenclature.length === 0 ? (
                <tr>
                  <td colSpan={3 + allEmployees.length + 2} className="px-3 py-8 text-center text-sm text-slate-400 border border-slate-300">
                    Нет данных
                  </td>
                </tr>
              ) : (
                <>
                  {nomenclature.map((item) => {
                    const totalQty = calculateTotalQuantity(item.id);
                    const totalSum = totalQty * item.currentPrice;

                    return (
                      <tr key={item.id} className="group bg-white hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-sm text-slate-800 border border-slate-300 sticky left-0 bg-white group-hover:bg-blue-50 z-10" style={{ minWidth: '220px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>{item.name}</td>
                        <td className="px-3 py-2 text-sm text-slate-700 border border-slate-300 sticky left-[220px] bg-white group-hover:bg-blue-50 z-11" style={{ minWidth: '100px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, inset 1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>{item.unit}</td>
                        <td className="px-3 py-2 text-sm text-left text-slate-700 border border-slate-300 sticky left-[320px] bg-white group-hover:bg-blue-50 z-12" style={{ minWidth: '110px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, inset 1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>{item.currentPrice.toLocaleString('ru-RU')} ₽</td>
                        {allEmployees.map((emp: gs.Employee) => {
                          const balance = calculateBalance(emp.id, item.id);
                          return (
                            <td key={emp.id} className={`px-3 py-2 text-sm text-left border border-slate-300 group-hover:bg-blue-50 ${balance > 0 ? 'text-slate-800 font-medium bg-white' : balance < 0 ? 'text-red-600 font-medium bg-white' : 'text-slate-400 bg-white'}`} style={{ minWidth: '130px' }}>
                              {balance}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-2 text-sm text-left font-semibold border border-slate-300 bg-slate-50 group-hover:bg-blue-100 sticky right-[130px] z-11 ${totalQty > 0 ? 'text-slate-800' : totalQty < 0 ? 'text-red-600' : 'text-slate-400'}`} style={{ minWidth: '110px', boxShadow: 'inset 1px 0 0 0 #cbd5e1, inset -1px 0 0 0 #cbd5e1, -2px 0 4px -1px rgba(0,0,0,0.2)' }}>
                          {totalQty}
                        </td>
                        <td className={`px-3 py-2 text-sm text-left font-semibold border border-slate-300 bg-slate-50 group-hover:bg-blue-100 sticky right-0 z-12 ${totalSum > 0 ? 'text-emerald-600' : totalSum < 0 ? 'text-red-600' : 'text-slate-400'}`} style={{ minWidth: '130px', boxShadow: 'inset 1px 0 0 0 #cbd5e1, -2px 0 4px -1px rgba(0,0,0,0.2)' }}>
                          {totalSum.toLocaleString('ru-RU')} ₽
                        </td>
                      </tr>
                    );
                  })}

                  {/* Итоговая строка */}
                  <tr className="bg-slate-100 font-bold">
                    <td className="px-3 py-3 text-sm text-slate-800 border border-slate-300 sticky left-0 bg-slate-100 z-10" style={{ minWidth: '220px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>ИТОГО</td>
                    <td className="px-3 py-3 text-sm text-slate-800 border border-slate-300 sticky left-[220px] bg-slate-100 z-11" style={{ minWidth: '100px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, inset 1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>—</td>
                    <td className="px-3 py-3 text-sm text-slate-800 border border-slate-300 sticky left-[320px] bg-slate-100 z-12" style={{ minWidth: '110px', boxShadow: 'inset -1px 0 0 0 #cbd5e1, inset 1px 0 0 0 #cbd5e1, 2px 0 4px -1px rgba(0,0,0,0.2)' }}>—</td>
                    {allEmployees.map((emp: gs.Employee) => {
                      const empTotal = calculateEmployeeTotal(emp.id);
                      return (
                        <td key={emp.id} className={`px-3 py-3 text-sm text-left border border-slate-300 bg-slate-100 ${empTotal > 0 ? 'text-emerald-600' : empTotal < 0 ? 'text-red-600' : 'text-slate-400'}`} style={{ minWidth: '130px' }}>
                          {empTotal.toLocaleString('ru-RU')} ₽
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-sm text-left border border-slate-300 bg-slate-200 text-slate-800 sticky right-[130px] z-11" style={{ minWidth: '110px', boxShadow: 'inset 1px 0 0 0 #cbd5e1, inset -1px 0 0 0 #cbd5e1, -2px 0 4px -1px rgba(0,0,0,0.2)' }}>
                      {nomenclature.reduce((sum, item) => sum + calculateTotalQuantity(item.id), 0)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-left border border-slate-300 bg-slate-200 sticky right-0 z-12 ${calculateGrandTotal() > 0 ? 'text-emerald-600' : calculateGrandTotal() < 0 ? 'text-red-600' : 'text-slate-400'}`} style={{ minWidth: '130px', boxShadow: 'inset 1px 0 0 0 #cbd5e1, -2px 0 4px -1px rgba(0,0,0,0.2)' }}>
                      {calculateGrandTotal().toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ МОДАЛЬНОЕ ОКНО ПРОСМОТРА КАРТЫ ПРИХОДА ============
function ViewArrivalModal({
  arrival,
  employees,
  nomenclature,
  onClose
}: {
  arrival: gs.Arrival;
  employees: gs.Employee[];
  nomenclature: gs.Nomenclature[];
  onClose: () => void;
}) {
  const items = (arrival as any).items || [];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">📋 Карта прихода</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Дата</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                {new Date(arrival.date).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Сотрудник</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                {(() => {
                  const employee = employees.find(e => e.id === arrival.employeeId);
                  return employee ? employee.fullName : (arrival.employeeName || arrival.employeeId);
                })()}
              </div>
            </div>
          </div>

          {/* Позиции */}
          {items.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700">Позиции прихода</h4>
              </div>
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '50%' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '150px' }} />
                  <col style={{ width: '150px' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Наименование</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase">Кол-во</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase">Цена за ед.</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => {
                    const nom = nomenclature.find(n => n.id === item.nomenclatureId);
                    return (
                      <tr key={item.nomenclatureId} className="border-b border-slate-100">
                        <td className="px-4 py-3 text-sm text-slate-800 truncate">{nom?.name}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">{item.price.toLocaleString('ru-RU')} ₽</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">{item.total.toLocaleString('ru-RU')} ₽</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm text-slate-800">ИТОГО:</td>
                    <td className="px-4 py-3 text-right text-lg text-emerald-600">{arrival.amount.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <p>Нет данных о позициях</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-medium">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ НОМЕНКЛАТУРА ============
function NomenclaturePage({ data }: { data: ReturnType<typeof useData> }) {
  const { nomenclature, setNomenclature } = data;
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<gs.Nomenclature | null>(null);
  const [viewingItem, setViewingItem] = useState<gs.Nomenclature | null>(null);

  const handleEdit = (item: gs.Nomenclature) => {
    setEditingItem(item);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту позицию из номенклатуры?')) {
      // Удаляем из локального состояния
      setNomenclature(nomenclature.filter(n => n.id !== id));
      
      // Отправляем в Google Sheets в фоне
      gs.deleteNomenclature(id).catch((err: Error) => {
        console.error('Ошибка удаления номенклатуры:', err);
        alert('Ошибка при удалении. Попробуйте ещё раз.');
      });
    }
  };

  const searchLower = String(search || '').toLowerCase().trim();
  const filtered = nomenclature.filter(n => {
    const name = String(n.name ?? '').toLowerCase();
    const matchSearch = !searchLower || name.includes(searchLower);
    const matchCat = catFilter === 'all' || n.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Номенклатура</h2>
        <p className="text-slate-500 text-sm mt-1">Всего позиций: {nomenclature.length}</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{nomenclature.filter(n => n.category === 'ЛС ПКУ').length}</div>
          <div className="text-xs text-slate-500">ЛС ПКУ</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{nomenclature.filter(n => n.category === 'ЛС').length}</div>
          <div className="text-xs text-slate-500">ЛС</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{nomenclature.filter(n => n.category === 'Расходный материал').length}</div>
          <div className="text-xs text-slate-500 uppercase">Расходных материалов</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{nomenclature.filter(n => n.category === 'Оборудование').length}</div>
          <div className="text-xs text-slate-500 uppercase">Оборудования</div>
        </div>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm">
          <option value="all">Все категории</option>
          <option value="ЛС ПКУ">💉 ЛС ПКУ</option>
          <option value="ЛС">💊 ЛС</option>
          <option value="Расходный материал">🩹 Расходных материалов</option>
          <option value="Оборудование">🩺 Оборудования</option>
        </select>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-colors">
          + Добавить
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Название</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Категория</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Ед. изм.</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Производитель</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Кол-во в упаковке</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Цена за упаковку (₽)</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Цена за единицу (₽)</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div 
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                    onClick={() => setViewingItem(item)}
                  >
                    {item.name}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.category === 'ЛС ПКУ' ? 'bg-red-100 text-red-700' :
                    item.category === 'ЛС' ? 'bg-green-100 text-green-700' :
                    item.category === 'Расходный материал' ? 'bg-blue-100 text-blue-700' :
                    item.category === 'Оборудование' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>{item.category}</span>
                </td>
                <td className="px-5 py-3 text-sm text-slate-700">{item.unit}</td>
                <td className="px-5 py-3 text-sm text-slate-700">{item.manufacturer || '-'}</td>
                <td className="px-5 py-3 text-sm font-semibold text-slate-800">{item.packageQuantity || 1}</td>
                <td className="px-5 py-3 text-sm font-semibold text-emerald-600">
                  {(item.currentPrice * (item.packageQuantity || 1)).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                </td>
                <td className="px-5 py-3 text-sm font-semibold text-blue-600">
                  {item.currentPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 text-lg"
                      title="✍️ Редактировать"
                    >
                      ✍️
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 text-lg"
                      title="❌ Удалить"
                    >
                      ❌
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <p>Номенклатура пуста</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddNomenclatureModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (item: gs.Nomenclature) => {
            setShowAddModal(false);
            setNomenclature([...nomenclature, item]);
            gs.addNomenclature(item).catch(err => {
              console.error('Ошибка добавления номенклатуры:', err);
              alert('Ошибка при добавлении номенклатуры. Попробуйте ещё раз.');
            });
          }}
        />
      )}

      {editingItem && (
        <EditNomenclatureModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async (updatedItem: gs.Nomenclature) => {
            setEditingItem(null);
            setNomenclature(nomenclature.map(n => n.id === updatedItem.id ? updatedItem : n));
            gs.updateNomenclature(updatedItem.id, updatedItem).catch((err: Error) => {
              console.error('Ошибка обновления номенклатуры:', err);
              alert('Ошибка при сохранении изменений. Попробуйте ещё раз.');
            });
          }}
        />
      )}

      {viewingItem && (
        <ViewNomenclatureCardModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}
    </div>
  );
}

// ============ МОДАЛЬНОЕ ОКНО ПРОСМОТРА КАРТОЧКИ НОМЕНКЛАТУРЫ ============
function ViewNomenclatureCardModal({
  item,
  onClose
}: {
  item: gs.Nomenclature;
  onClose: () => void;
}) {
  const [priceHistory, setPriceHistory] = useState<gs.PriceHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const loadPriceHistory = async () => {
      setLoadingHistory(true);
      try {
        const history = await gs.getPriceHistory(item.id);
        setPriceHistory(history);
      } catch (err) {
        console.error('Ошибка загрузки истории цен:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadPriceHistory();
  }, [item.id]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">📋 Карточка позиции</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Наименование</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold">
                  {item.name}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Категория</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.category === 'ЛС ПКУ' ? 'bg-red-100 text-red-700' :
                      item.category === 'ЛС' ? 'bg-green-100 text-green-700' :
                      item.category === 'Расходный материал' ? 'bg-blue-100 text-blue-700' :
                      item.category === 'Оборудование' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{item.category}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Единица измерения</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                    {item.unit}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Производитель</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                  {item.manufacturer || 'Не указан'}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Количество в упаковке</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold">
                  {item.packageQuantity || 1}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Цена за упаковку</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-emerald-600 font-semibold">
                    {(item.currentPrice * (item.packageQuantity || 1)).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Цена за единицу</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-blue-600 font-semibold">
                    {item.currentPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </div>
                </div>
              </div>

              {/* История изменений цен */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">📊 Изменение цены</h4>
                {loadingHistory ? (
                  <div className="text-center py-4 text-slate-500">Загрузка истории...</div>
                ) : priceHistory.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-sm">История изменений отсутствует</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {priceHistory.map((record, index) => (
                      <div key={record.id || index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-800">
                            {record.price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(record.date).toLocaleDateString('ru-RU')} • {record.changedBy}
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">
                            Текущая
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-medium">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      );
}

// ============ ПРИХОД К СОТРУДНИКУ ============
function ArrivalPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, nomenclature, arrivals, setArrivals, refresh } = data;
  const [showAddArrival, setShowAddArrival] = useState(false);
  const [editingArrival, setEditingArrival] = useState<gs.Arrival | null>(null);
  const [viewingArrival, setViewingArrival] = useState<gs.Arrival | null>(null);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const handleAddArrival = async (form: any) => {
    setShowAddArrival(false);
    const newArrival = {
      id: `ARR-${Date.now()}`,
      ...form,
      date: form.date,
      month: selectedMonth,
      addedBy: 'Руководитель',
      employeeName: form.employeeName || '',
    };
    setArrivals([...arrivals, newArrival]);
    gs.addArrival(newArrival).catch(err => {
      console.error('Ошибка добавления прихода:', err);
      alert('Ошибка при добавлении прихода. Попробуйте ещё раз.');
    });
  };

  const generateMonthOptions = () => {
    const months = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthName });
    }
    return months;
  };

  const filteredArrivals = arrivals.filter(a => a.month === selectedMonth);
  const totalAmount = filteredArrivals.reduce((s, a) => s + a.amount, 0);
  const selectedMonthName = new Date(selectedMonth + '-01').toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  const handleEditArrival = async (form: any) => {
    if (!editingArrival) return;
    setEditingArrival(null);
    
    const updatedArrival = {
      ...editingArrival,
      ...form,
      employeeName: form.employeeName || editingArrival.employeeName || '',
    };
    
    setArrivals(arrivals.map(a => a.id === editingArrival.id ? updatedArrival : a));
    gs.updateArrival(editingArrival.id, updatedArrival).catch(err => {
      console.error('Ошибка обновления прихода:', err);
      alert('Ошибка при обновлении прихода. Попробуйте ещё раз.');
    });
  };

  const handleDeleteArrival = async (id: string) => {
    if (!confirm('Удалить эту карту прихода?')) return;
    setArrivals(arrivals.filter(a => a.id !== id));
    gs.deleteArrival(id).catch(err => {
      console.error('Ошибка удаления прихода:', err);
      alert('Ошибка при удалении прихода. Попробуйте ещё раз.');
      refresh();
    });
  };

  const handleArchiveArrival = async (id: string) => {
    if (!confirm('Отправить карту прихода в архив?')) return;
    setArrivals(arrivals.map(a => a.id === id ? { ...a, archived: true } : a));
    gs.archiveArrival(id).catch(err => {
      console.error('Ошибка архивирования прихода:', err);
      alert('Ошибка при архивировании прихода. Попробуйте ещё раз.');
      refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📥 Приход к сотруднику</h2>
          <p className="text-slate-500 text-sm mt-1">Управление поступлениями</p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {generateMonthOptions().map(month => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600 py-2">
          ПРИХОД ЗА {selectedMonthName.toUpperCase()}: <span className="text-emerald-600 font-bold">
            {totalAmount.toLocaleString('ru-RU')} ₽
          </span>
        </div>
        <button onClick={() => setShowAddArrival(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium shadow-sm">+ Создать карту прихода</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Дата</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Сотрудник</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Тип</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Сумма (₽)</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredArrivals.sort((a, b) => b.date.localeCompare(a.date)).map(arr => {
              return (
                <tr key={arr.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm text-slate-700">
                    {new Date(arr.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td 
                    className="px-5 py-3 text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                    onClick={() => setViewingArrival(arr)}
                  >
                    {(() => {
                      const employee = employees.find(e => e.id === arr.employeeId);
                      return employee ? employee.fullName : (arr.employeeName || arr.employeeId);
                    })()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${arr.type === 'Плановый' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{arr.type}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-emerald-600">{arr.amount.toLocaleString('ru-RU')} ₽</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setEditingArrival(arr)}
                        className="text-blue-600 hover:text-blue-800 text-lg"
                        title="Редактировать"
                      >
                        ✍️
                      </button>
                      <button 
                        onClick={() => handleArchiveArrival(arr.id)}
                        className="text-orange-600 hover:text-orange-800 text-lg"
                        title="Отправить в архив"
                      >
                        📦
                      </button>
                      <button 
                        onClick={() => handleDeleteArrival(arr.id)}
                        className="text-red-600 hover:text-red-800 text-lg"
                        title="Удалить"
                      >
                        ❌
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredArrivals.length === 0 && (
          <div className="p-8 text-center text-slate-500"><p>Нет записей о приходе за {selectedMonthName}</p></div>
        )}
      </div>

      {showAddArrival && <ArrivalCardModal 
        employees={employees.filter(e => e.status !== 'Уволен')} 
        nomenclature={nomenclature}
        onClose={() => setShowAddArrival(false)} 
        onAdd={handleAddArrival} 
      />}

      {editingArrival && <ArrivalCardModal 
        employees={employees.filter(e => e.status !== 'Уволен')} 
        nomenclature={nomenclature}
        initialData={editingArrival}
        onClose={() => setEditingArrival(null)} 
        onAdd={handleEditArrival} 
      />}

      {viewingArrival && <ViewArrivalModal
        arrival={viewingArrival}
        employees={employees}
        nomenclature={nomenclature}
        onClose={() => setViewingArrival(null)}
      />}
    </div>
  );
}

// ============ МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ЛИСТА РАСХОДА ============
function EditExpenseSheetModal({
  sheet,
  employees,
  nomenclature,
  onClose,
  onSave
}: {
  sheet: gs.ExpenseSheet;
  employees: gs.Employee[];
  nomenclature: gs.Nomenclature[];
  onClose: () => void;
  onSave: (sheet: gs.ExpenseSheet) => void;
}) {
  const [formData, setFormData] = useState({
    date: sheet.date,
    employeeId: sheet.employeeId,
    patientName: sheet.patientName,
    patientBirthDate: sheet.patientBirthDate,
    callCategory: sheet.callCategory,
    therapyName: sheet.therapyName,
    therapyCost: sheet.therapyCost,
    items: [...sheet.items]
  });

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        nomenclatureId: '',
        name: '',
        category: 'ЛС',
        quantity: 1,
        pricePerUnit: 0,
        total: 0
      }]
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Пересчитываем сумму
    if (field === 'quantity' || field === 'pricePerUnit') {
      newItems[index].total = newItems[index].quantity * newItems[index].pricePerUnit;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    const updatedSheet: gs.ExpenseSheet = {
      ...sheet,
      date: formData.date,
      employeeId: formData.employeeId,
      employeeName: employees.find(e => e.id === formData.employeeId)?.fullName || '',
      patientName: formData.patientName,
      patientBirthDate: formData.patientBirthDate,
      callCategory: formData.callCategory,
      therapyName: formData.therapyName,
      therapyCost: formData.therapyCost,
      items: formData.items,
      totalAmount: totalAmount
    };
    onSave(updatedSheet);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-300">
          <h2 className="text-xl font-bold text-slate-800">Редактирование листа расхода</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата составления</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Сотрудник</label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Пациент (ФИО)</label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата рождения пациента</label>
              <input
                type="date"
                value={formData.patientBirthDate}
                onChange={(e) => setFormData({ ...formData, patientBirthDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Категория выезда</label>
              <select
                value={formData.callCategory}
                onChange={(e) => setFormData({ ...formData, callCategory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Первичный">Первичный</option>
                <option value="Повторный">Повторный</option>
                <option value="Экстренный">Экстренный</option>
                <option value="Плановый">Плановый</option>
                <option value="Курс">Курс</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Название терапии</label>
              <input
                type="text"
                value={formData.therapyName}
                onChange={(e) => setFormData({ ...formData, therapyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Стоимость терапии (₽)</label>
              <input
                type="number"
                value={formData.therapyCost}
                onChange={(e) => setFormData({ ...formData, therapyCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Препараты и расходники */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-slate-800">Препараты и расходники</h3>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
              >
                + Добавить позицию
              </button>
            </div>
            
            <table className="w-full border-collapse">
              <colgroup>
                <col style={{ width: '35%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300">Название</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300">Тип</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border border-slate-300">Количество</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-slate-700 border border-slate-300">Цена за единицу</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-slate-700 border border-slate-300">Сумма</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border border-slate-300">Действия</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200">
                    <td className="px-3 py-2 border border-slate-300">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 border border-slate-300">
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(index, 'category', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                      >
                        <option value="ЛС ПКУ">ЛС ПКУ</option>
                        <option value="ЛС">ЛС</option>
                        <option value="Расходный материал">Расходный материал</option>
                        <option value="Оборудование">Оборудование</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-slate-300">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center"
                        min="1"
                      />
                    </td>
                    <td className="px-3 py-2 border border-slate-300">
                      <input
                        type="number"
                        value={item.pricePerUnit}
                        onChange={(e) => handleUpdateItem(index, 'pricePerUnit', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right"
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800 border border-slate-300">
                      {item.total.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-3 py-2 text-center border border-slate-300">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300">
                  <td className="px-3 py-2 text-left text-sm font-semibold text-slate-800">ИТОГО</td>
                  <td colSpan={3}></td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-blue-600">
                    {totalAmount.toLocaleString('ru-RU')} ₽
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 flex justify-end gap-3 border-t border-slate-300">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm rounded"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// Default export
export default function App() {
  return <div>App component - to be implemented</div>;
}