import { useState, useEffect, useCallback } from 'react';
import * as gs from './services/googleSheets';
import { LOGO_URL } from './logoData';

// ============ ХУК useData ============
function useData() {
  const [employees, setEmployees] = useState<gs.Employee[]>([]);
  const [nomenclature, setNomenclature] = useState<gs.Nomenclature[]>([]);
  const [arrivals, setArrivals] = useState<gs.Arrival[]>([]);
  const [expenses, setExpenses] = useState<gs.Expense[]>([]);
  const [expenseSheets, setExpenseSheets] = useState<gs.ExpenseSheet[]>([]);
  const [chatMessages, setChatMessages] = useState<gs.ChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<gs.Announcement[]>([]);
  const [auditLog, setAuditLog] = useState<gs.AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, nom, arr, exp, expSheets, chat, ann, audit] = await Promise.all([
        gs.getEmployees(),
        gs.getNomenclature(),
        gs.getArrivals(),
        gs.getExpenses(),
        gs.getExpenseSheets(),
        gs.getChatMessages(),
        gs.getAnnouncements(),
        gs.getAuditLog(),
      ]);
      setEmployees(emps);
      setNomenclature(nom);
      setArrivals(arr);
      setExpenses(exp);
      setExpenseSheets(expSheets);
      setChatMessages(chat);
      setAnnouncements(ann);
      setAuditLog(audit);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    employees, setEmployees,
    nomenclature, setNomenclature,
    arrivals, setArrivals,
    expenses, setExpenses,
    expenseSheets, setExpenseSheets,
    chatMessages, setChatMessages,
    announcements, setAnnouncements,
    auditLog, setAuditLog,
    loading, error, refresh,
  };
}

// ============ ЭКРАН ОШИБКИ ПОДКЛЮЧЕНИЯ ============
function ConnectionErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [newUrl, setNewUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateUrl = () => {
    if (!newUrl.trim()) { alert('Введите URL веб-приложения'); return; }
    setIsUpdating(true);
    gs.saveConfig(newUrl.trim());
    setTimeout(() => { window.location.reload(); }, 500);
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
        <img src={LOGO_URL} alt="СМУ" className="w-32 h-32 object-contain mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Ошибка подключения</h2>
        <p className="text-red-600 text-sm text-center mb-4">{error}</p>
        <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2 font-medium">Проверьте:</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>URL веб-приложения Apps Script</li>
            <li>Доступ к таблице (публичный)</li>
            <li>Структуру таблицы</li>
            <li>Интернет-соединение</li>
          </ul>
        </div>
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-slate-700">Изменить URL подключения:</label>
          <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          <button onClick={handleUpdateUrl} disabled={isUpdating || !newUrl.trim()}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 rounded-lg text-white font-medium shadow-lg shadow-blue-600/20 disabled:shadow-none">
            {isUpdating ? '⏳ Обновление...' : '🔗 Обновить URL'}
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={onRetry} className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-medium shadow-lg shadow-red-600/20">🔄 Повторить</button>
          <button onClick={handleDisconnect} className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium">⚙️ Настройки</button>
        </div>
      </div>
    </div>
  );
}

// ============ ЭКРАН ПОДКЛЮЧЕНИЯ ============
function ConnectScreen({ onConnect }: { onConnect: () => void }) {
  const [url, setUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!url.trim()) { setError('Введите URL'); return; }
    setConnecting(true);
    setError('');
    gs.saveConfig(url.trim());
    const result = await gs.testConnection();
    if (result.success) {
      onConnect();
    } else {
      setError(result.error || 'Ошибка подключения');
      gs.clearConfig();
    }
    setConnecting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 max-w-md w-full">
        <img src={LOGO_URL} alt="СМУ" className="w-24 h-24 object-contain mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">СМУ</h1>
        <p className="text-slate-500 text-center text-sm mb-6">Система медицинского учёта</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL веб-приложения Google Apps Script</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button onClick={handleConnect} disabled={connecting || !url.trim()}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 rounded-lg text-white font-medium shadow-lg shadow-blue-600/20 disabled:shadow-none transition-all">
            {connecting ? '⏳ Подключение...' : '🔗 Подключиться'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ НАВИГАЦИЯ ============
type Page = 'employees' | 'nomenclature' | 'arrival' | 'expense' | 'balance' | 'reports' | 'chat' | 'archive' | 'audit' | 'settings';

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'employees', label: 'Сотрудники', icon: '👥' },
  { id: 'nomenclature', label: 'Номенклатура', icon: '📋' },
  { id: 'arrival', label: 'Приход', icon: '📥' },
  { id: 'expense', label: 'Расход', icon: '📤' },
  { id: 'balance', label: 'Остатки', icon: '🧰' },
  { id: 'reports', label: 'Отчёты', icon: '📊' },
  { id: 'chat', label: 'Сообщения', icon: '💬' },
  { id: 'archive', label: 'Архив', icon: '🗄️' },
  { id: 'audit', label: 'Журнал', icon: '📝' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
];

// ============ СТРАНИЦА СОТРУДНИКИ ============
function EmployeesPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, setEmployees } = data;
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<gs.Employee | null>(null);

  const searchLower = search.toLowerCase().trim();
  const filtered = employees.filter(e => {
    if (!searchLower) return true;
    return e.fullName.toLowerCase().includes(searchLower) || e.position.toLowerCase().includes(searchLower);
  });

  const handleToggleShift = async (emp: gs.Employee) => {
    const newShiftOpen = !emp.shiftOpen;
    setEmployees(employees.map(e => e.id === emp.id ? { ...e, shiftOpen: newShiftOpen } : e));
    try { await gs.updateEmployeeShift(emp.id, newShiftOpen); } catch (err) { console.error(err); }
  };

  const handleToggleBlock = async (emp: gs.Employee) => {
    const newBlocked = !emp.blocked;
    setEmployees(employees.map(e => e.id === emp.id ? { ...e, blocked: newBlocked } : e));
    try { await gs.updateEmployee(emp.id, { blocked: newBlocked }); } catch (err) { console.error(err); }
  };

  const handleFire = async (emp: gs.Employee) => {
    if (!confirm(`Уволить сотрудника ${emp.fullName}?`)) return;
    setEmployees(employees.map(e => e.id === emp.id ? { ...e, status: 'Уволен' } : e));
    try { await gs.updateEmployee(emp.id, { status: 'Уволен' }); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Сотрудники</h2>
          <p className="text-slate-500 text-sm mt-1">Всего: {employees.length} • Активных: {employees.filter(e => e.status !== 'Уволен').length}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium shadow-sm">+ Добавить</button>
      </div>
      <input type="text" placeholder="Поиск по ФИО или должности..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => (
          <div key={emp.id} className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${emp.status === 'Уволен' ? 'border-red-200 opacity-60' : emp.blocked ? 'border-orange-200' : 'border-slate-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white ${emp.status === 'Уволен' ? 'bg-red-400' : emp.blocked ? 'bg-orange-400' : emp.shiftOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                {emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">{emp.fullName}</div>
                <div className="text-xs text-slate-500 mt-0.5">{emp.position}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {emp.status === 'Уволен' && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Уволен</span>}
                  {emp.blocked && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">Заблокирован</span>}
                  {emp.shiftOpen && emp.status !== 'Уволен' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">Смена</span>}
                </div>
              </div>
            </div>
            {emp.status !== 'Уволен' && (
              <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => handleToggleShift(emp)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${emp.shiftOpen ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                  {emp.shiftOpen ? '🔒 Закрыть' : '🔓 Открыть'}
                </button>
                <button onClick={() => handleToggleBlock(emp)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${emp.blocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                  {emp.blocked ? '✅ Разблок' : '🚫 Блок'}
                </button>
                <button onClick={() => setEditingEmployee(emp)} className="px-2 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">✍️</button>
                <button onClick={() => handleFire(emp)} className="px-2 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">❌</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200"><p>Сотрудники не найдены</p></div>
      )}
      {showAddModal && <AddEmployeeModal employees={employees} setEmployees={setEmployees} onClose={() => setShowAddModal(false)} />}
      {editingEmployee && <EditEmployeeModal employee={editingEmployee} employees={employees} setEmployees={setEmployees} onClose={() => setEditingEmployee(null)} />}
    </div>
  );
}

function AddEmployeeModal({ employees, setEmployees, onClose }: { employees: gs.Employee[]; setEmployees: (e: gs.Employee[]) => void; onClose: () => void }) {
  const [form, setForm] = useState({ fullName: '', position: '', phone: '', password: '' });
  const handleAdd = async () => {
    if (!form.fullName.trim()) { alert('Введите ФИО'); return; }
    const newEmp: gs.Employee = {
      id: `EMP-${Date.now()}`, personalNumber: String(employees.length + 1).padStart(4, '0'),
      fullName: form.fullName, password: form.password || '1234', status: 'Активен',
      position: form.position || 'Сотрудник', hireDate: new Date().toISOString().split('T')[0],
      blocked: false, phone: form.phone, lastActivity: '', note: '', shiftOpen: false,
    };
    setEmployees([...employees, newEmp]);
    try { await gs.addEmployee(newEmp); } catch (err) { console.error(err); }
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-800">Добавить сотрудника</h3></div>
        <div className="p-6 space-y-4">
          <div><label className="text-sm text-slate-600 mb-1 block">ФИО *</label>
            <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Иванов Иван Иванович"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="text-sm text-slate-600 mb-1 block">Должность</label>
            <input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="Фельдшер"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="text-sm text-slate-600 mb-1 block">Телефон</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+7 (999) 123-45-67"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="text-sm text-slate-600 mb-1 block">Пароль</label>
            <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="1234"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium">Добавить</button>
        </div>
      </div>
    </div>
  );
}

function EditEmployeeModal({ employee, employees, setEmployees, onClose }: { employee: gs.Employee; employees: gs.Employee[]; setEmployees: (e: gs.Employee[]) => void; onClose: () => void }) {
  const [form, setForm] = useState({ ...employee });
  const handleSave = async () => {
    setEmployees(employees.map(e => e.id === employee.id ? form : e));
    try { await gs.updateEmployee(employee.id, form); } catch (err) { console.error(err); }
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-800">Редактировать сотрудника</h3></div>
        <div className="p-6 space-y-4">
          <div><label className="text-sm text-slate-600 mb-1 block">ФИО</label>
            <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="text-sm text-slate-600 mb-1 block">Должность</label>
            <input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="text-sm text-slate-600 mb-1 block">Телефон</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="text-sm text-slate-600 mb-1 block">Примечание</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 resize-none" /></div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium">💾 Сохранить</button>
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

  const searchLower = search.toLowerCase().trim();
  const filtered = nomenclature.filter(n => {
    const matchSearch = !searchLower || n.name.toLowerCase().includes(searchLower);
    const matchCat = catFilter === 'all' || n.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту позицию?')) {
      setNomenclature(nomenclature.filter(n => n.id !== id));
      gs.deleteNomenclature(id).catch(console.error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Номенклатура</h2>
        <p className="text-slate-500 text-sm mt-1">Всего позиций: {nomenclature.length}</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { cat: 'ЛС ПКУ', color: 'text-red-600', icon: '💉' },
          { cat: 'ЛС', color: 'text-green-600', icon: '💊' },
          { cat: 'Расходный материал', color: 'text-blue-600', icon: '🩹' },
          { cat: 'Оборудование', color: 'text-purple-600', icon: '🧰' },
        ].map(({ cat, color, icon }) => (
          <div key={cat} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <div className={`text-2xl font-bold ${color}`}>{nomenclature.filter(n => n.category === cat).length}</div>
            <div className="text-xs text-slate-500">{icon} {cat}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm">
          <option value="all">Все категории</option>
          <option value="ЛС ПКУ">💉 ЛС ПКУ</option>
          <option value="ЛС">💊 ЛС</option>
          <option value="Расходный материал">🩹 Расходники</option>
          <option value="Оборудование">🧰 Оборудование</option>
        </select>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm">+ Добавить</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Название</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Категория</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Ед.</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Цена (₽)</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.category === 'ЛС ПКУ' ? 'bg-red-100 text-red-700' :
                    item.category === 'ЛС' ? 'bg-green-100 text-green-700' :
                    item.category === 'Расходный материал' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>{item.category}</span>
                </td>
                <td className="px-5 py-3 text-sm text-slate-700">{item.unit}</td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-blue-600">{item.currentPrice.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-center">
                  <button onClick={() => setEditingItem(item)} className="text-blue-600 hover:text-blue-800 mr-2">✍️</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500"><p>Номенклатура пуста</p></div>}
      </div>
      {showAddModal && <AddNomenclatureModal nomenclature={nomenclature} setNomenclature={setNomenclature} onClose={() => setShowAddModal(false)} />}
      {editingItem && <EditNomenclatureModal item={editingItem} nomenclature={nomenclature} setNomenclature={setNomenclature} onClose={() => setEditingItem(null)} />}
    </div>
  );
}

function AddNomenclatureModal({ nomenclature, setNomenclature, onClose }: { nomenclature: gs.Nomenclature[]; setNomenclature: (n: gs.Nomenclature[]) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', category: 'ЛС', unit: 'Штуки', manufacturer: '', currentPrice: 0, packageQuantity: 1 });
  const handleAdd = async () => {
    if (!form.name.trim()) { alert('Введите название'); return; }
    const newItem: gs.Nomenclature = { id: `NOM-${Date.now()}`, ...form, active: true };
    setNomenclature([...nomenclature, newItem]);
    try { await gs.addNomenclature(newItem); } catch (err) { console.error(err); }
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-800">Добавить позицию</h3></div>
        <div className="p-6 space-y-4">
          <div><label className="text-sm text-slate-600 mb-1 block">Название *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="text-sm text-slate-600 mb-1 block">Категория</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500">
              <option value="ЛС ПКУ">💉 ЛС ПКУ</option><option value="ЛС">💊 ЛС</option>
              <option value="Расходный материал">🩹 Расходный материал</option><option value="Оборудование">🧰 Оборудование</option>
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-slate-600 mb-1 block">Ед. измерения</label>
              <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
            <div><label className="text-sm text-slate-600 mb-1 block">Цена за ед. (₽)</label>
              <input type="number" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          </div>
          <div><label className="text-sm text-slate-600 mb-1 block">Производитель</label>
            <input type="text" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium">Добавить</button>
        </div>
      </div>
    </div>
  );
}

function EditNomenclatureModal({ item, nomenclature, setNomenclature, onClose }: { item: gs.Nomenclature; nomenclature: gs.Nomenclature[]; setNomenclature: (n: gs.Nomenclature[]) => void; onClose: () => void }) {
  const [form, setForm] = useState({ ...item });
  const handleSave = async () => {
    setNomenclature(nomenclature.map(n => n.id === item.id ? form : n));
    try { await gs.updateNomenclature(item.id, form); } catch (err) { console.error(err); }
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-800">Редактировать позицию</h3></div>
        <div className="p-6 space-y-4">
          <div><label className="text-sm text-slate-600 mb-1 block">Название</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-slate-600 mb-1 block">Ед. измерения</label>
              <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
            <div><label className="text-sm text-slate-600 mb-1 block">Цена за ед. (₽)</label>
              <input type="number" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
          </div>
          <div><label className="text-sm text-slate-600 mb-1 block">Производитель</label>
            <input type="text" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" /></div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium">💾 Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ============ ПРИХОД ============
function ArrivalPage({ data }: { data: ReturnType<typeof useData> }) {
  const { arrivals, setArrivals, refresh } = data;
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const filteredArrivals = arrivals.filter(a => a.month === selectedMonth && !a.archived);
  const totalAmount = filteredArrivals.reduce((s, a) => s + a.amount, 0);
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить карту прихода?')) return;
    setArrivals(arrivals.filter(a => a.id !== id));
    gs.deleteArrival(id).catch(() => refresh());
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📥 Приход к сотруднику</h2>
          <p className="text-slate-500 text-sm mt-1">За {new Date(selectedMonth + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}: <span className="text-emerald-600 font-bold">{totalAmount.toLocaleString('ru-RU')} ₽</span></p>
        </div>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500" />
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
            {filteredArrivals.sort((a, b) => b.date.localeCompare(a.date)).map(arr => (
              <tr key={arr.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-700">{new Date(arr.date).toLocaleDateString('ru-RU')}</td>
                <td className="px-5 py-3 text-sm text-slate-800">{arr.employeeName || arr.employeeId}</td>
                <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs ${arr.type === 'Плановый' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{arr.type}</span></td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-emerald-600">{arr.amount.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-center">
                  <button onClick={() => handleDelete(arr.id)} className="text-red-600 hover:text-red-800">❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredArrivals.length === 0 && <div className="p-8 text-center text-slate-500"><p>Нет записей</p></div>}
      </div>
    </div>
  );
}

// ============ РАСХОД ============
function ExpensePage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, expenseSheets } = data;
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  });
  const filteredSheets = expenseSheets.filter(s => s.month === selectedMonth && !s.archived);
  const totalExpense = filteredSheets.reduce((sum, s) => sum + s.totalAmount, 0);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📤 Расход у сотрудника</h2>
          <p className="text-slate-500 text-sm mt-1">За {new Date(selectedMonth + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}: <span className="text-emerald-600 font-bold">{totalExpense.toLocaleString('ru-RU')} ₽</span></p>
        </div>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500" />
      </div>
      <div className="space-y-4">
        {filteredSheets.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200"><p>Нет листов расхода</p></div>
        ) : (
          filteredSheets.map(sheet => {
            const emp = employees.find(e => e.id === sheet.employeeId);
            return (
              <div key={sheet.id} className="bg-white border border-slate-300 rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Лист расхода</h3>
                    <p className="text-sm text-slate-500">{new Date(sheet.date).toLocaleDateString('ru-RU')} • {emp?.fullName || sheet.employeeName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{sheet.totalAmount.toLocaleString('ru-RU')} ₽</div>
                    <div className="text-xs text-slate-500">Пациент: {sheet.patientName}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600">Позиций: {sheet.items.length} • Категория: {sheet.callCategory}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============ ОСТАТКИ ============
function BalancePage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, nomenclature, arrivals, expenseSheets } = data;
  const activeEmployees = employees.filter(e => e.status !== 'Уволен');
  const calculateBalance = (employeeId: string, nomenclatureId: string): number => {
    let totalArrival = 0;
    arrivals.forEach(arrival => {
      if (arrival.employeeId === employeeId && arrival.archived !== true) {
        const items = Array.isArray(arrival.items) ? arrival.items : [];
        items.forEach((item: any) => {
          if (item.nomenclatureId === nomenclatureId) totalArrival += Number(item.quantity) || 0;
        });
      }
    });
    let totalExpense = 0;
    expenseSheets.forEach(sheet => {
      if (sheet.employeeId === employeeId && sheet.archived !== true) {
        const items = Array.isArray(sheet.items) ? sheet.items : [];
        items.forEach((item: any) => {
          if (item.nomenclatureId === nomenclatureId) totalExpense += Number(item.quantity) || 0;
        });
      }
    });
    return totalArrival - totalExpense;
  };
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-800">🧰 Остаток у сотрудника</h2>
        <p className="text-slate-600 mt-1">Просмотр остатков номенклатуры</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <table className="border-collapse w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300 sticky left-0 bg-slate-100 z-20" style={{ minWidth: '200px' }}>Номенклатура</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300" style={{ minWidth: '80px' }}>Ед.</th>
                <th className="px-3 py-2 text-right text-sm font-semibold text-slate-700 border border-slate-300" style={{ minWidth: '100px' }}>Цена</th>
                {activeEmployees.map(emp => (
                  <th key={emp.id} className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border border-slate-300" style={{ minWidth: '120px' }}>
                    {emp.fullName.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nomenclature.map(item => (
                <tr key={item.id} className="hover:bg-blue-50">
                  <td className="px-3 py-2 text-sm text-slate-800 border border-slate-300 sticky left-0 bg-white">{item.name}</td>
                  <td className="px-3 py-2 text-sm text-slate-700 border border-slate-300">{item.unit}</td>
                  <td className="px-3 py-2 text-sm text-right text-slate-700 border border-slate-300">{item.currentPrice.toLocaleString('ru-RU')} ₽</td>
                  {activeEmployees.map(emp => {
                    const balance = calculateBalance(emp.id, item.id);
                    return (
                      <td key={emp.id} className={`px-3 py-2 text-sm text-left border border-slate-300 ${balance > 0 ? 'text-slate-800 font-medium' : balance < 0 ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        {balance}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {nomenclature.length === 0 && (
            <tr><td colSpan={3 + activeEmployees.length} className="px-3 py-8 text-center text-sm text-slate-400">Нет данных</td></tr>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ ОТЧЁТЫ ============
function ReportsPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, arrivals, expenseSheets } = data;
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const reportData = employees.filter(e => e.status !== 'Уволен').map(emp => {
    const arrival = arrivals.filter(a => a.employeeId === emp.id && a.month === selectedMonth && !a.archived).reduce((s, a) => s + a.amount, 0);
    const expense = expenseSheets.filter(s => s.employeeId === emp.id && s.month === selectedMonth && !s.archived).reduce((s, sh) => s + sh.totalAmount, 0);
    return { emp, arrival, expense, balance: arrival - expense };
  });
  const totals = {
    arrival: reportData.reduce((s, r) => s + r.arrival, 0),
    expense: reportData.reduce((s, r) => s + r.expense, 0),
    balance: reportData.reduce((s, r) => s + r.balance, 0),
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Отчёты</h2>
        <p className="text-slate-500 text-sm mt-1">Ежемесячные отчёты</p>
      </div>
      <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm" />
      <div className="grid grid-cols-3 gap-4">
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
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">ФИО</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Приход</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Расход</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Остаток</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map(row => (
              <tr key={row.emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm font-medium text-slate-800">{row.emp.fullName}</td>
                <td className="px-5 py-3 text-right text-sm text-emerald-600">{row.arrival.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-right text-sm text-red-600">{row.expense.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-blue-600">{row.balance.toLocaleString('ru-RU')} ₽</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ ЧАТ ============
function ChatPage({ data }: { data: ReturnType<typeof useData> }) {
  const { chatMessages, employees } = data;
  const activeEmployees = employees.filter(e => e.status !== 'Уволен');
  const [selectedChat, setSelectedChat] = useState('');
  const [newMessage, setNewMessage] = useState('');
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
    setNewMessage('');
    data.refresh();
  };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">💬 Сообщения</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex h-[500px] shadow-sm">
        <div className="w-64 border-r border-slate-200 overflow-y-auto">
          {activeEmployees.map(emp => (
            <button key={emp.id} onClick={() => setSelectedChat(emp.id)}
              className={`w-full p-3 flex items-center gap-2 text-left border-b border-slate-100 ${selectedChat === emp.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-white">{emp.fullName[0]}</div>
              <span className="text-sm text-slate-800 truncate">{emp.fullName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center"><div className="text-4xl mb-2">💬</div><p>Выберите сотрудника</p></div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-slate-200 font-medium text-slate-800">
                {activeEmployees.find(e => e.id === selectedChat)?.fullName}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
                {chatWith.map(msg => (
                  <div key={msg.id} className={`flex ${msg.fromId === 'MGR' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 ${msg.fromId === 'MGR' ? 'bg-blue-500 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-200 flex gap-2">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Сообщение..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" />
                <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg">➤</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ АРХИВ ============
function ArchivePage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, expenseSheets, arrivals } = data;
  const archivedSheets = expenseSheets.filter(s => s.archived);
  const archivedArrivals = arrivals.filter(a => a.archived);
  const firedEmployees = employees.filter(e => e.status === 'Уволен');
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">🗄️ Архив</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase mb-2">Листов расхода</div>
          <div className="text-2xl font-bold text-slate-600">{archivedSheets.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase mb-2">Карт прихода</div>
          <div className="text-2xl font-bold text-green-600">{archivedArrivals.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase mb-2">Уволено</div>
          <div className="text-2xl font-bold text-red-600">{firedEmployees.length}</div>
        </div>
      </div>
    </div>
  );
}

// ============ ЖУРНАЛ ============
function AuditPage({ data }: { data: ReturnType<typeof useData> }) {
  const { auditLog } = data;
  const [search, setSearch] = useState('');
  const searchLower = search.toLowerCase().trim();
  const filtered = auditLog.filter(log => {
    if (!searchLower) return true;
    return String(log.newValue ?? '').toLowerCase().includes(searchLower) ||
           String(log.oldValue ?? '').toLowerCase().includes(searchLower);
  });
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Журнал изменений</h2>
          <p className="text-slate-500 text-sm mt-1">Всего записей: {auditLog.length}</p>
        </div>
      </div>
      <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Дата</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Пользователь</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Действие</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Было → Стало</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map(log => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-700">{new Date(log.date).toLocaleDateString('ru-RU')}</td>
                <td className="px-5 py-3 text-sm text-slate-800">{log.userName}</td>
                <td className="px-5 py-3 text-sm text-blue-700">{log.action}</td>
                <td className="px-5 py-3 text-sm">
                  {log.oldValue && <span className="text-red-600 line-through text-xs mr-1">{log.oldValue}</span>}
                  {log.newValue && <span className="text-emerald-600 text-xs">{log.newValue}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500"><p>Журнал пуст</p></div>}
      </div>
    </div>
  );
}

// ============ НАСТРОЙКИ ============
function SettingsPage() {
  const config = gs.getCurrentConfig();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Настройки</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">📊 Подключение к Google Sheets</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span className="text-sm text-slate-800">Статус: Подключено</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">URL веб-приложения</div>
            <div className="text-sm text-slate-800 font-mono break-all">{config.scriptUrl.substring(0, 60)}...</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">ℹ️ О системе</h3>
        </div>
        <div className="p-5 space-y-2">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Приложение</span>
            <span className="text-sm text-slate-800 font-semibold">СМУ</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Версия</span>
            <span className="text-sm text-slate-800">0.5.2</span>
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

// ============ ГЛАВНЫЙ КОМПОНЕНТ ============
export default function App() {
  const [connected, setConnected] = useState(gs.isConnected());
  const [page, setPage] = useState<Page>('employees');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const data = useData();

  if (!connected) {
    if (gs.isConnected()) {
      if (data.error) {
        return <ConnectionErrorScreen error={data.error} onRetry={() => data.refresh()} />;
      }
    }
    return <ConnectScreen onConnect={() => { setConnected(true); data.refresh(); }} />;
  }

  if (data.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-slate-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'employees': return <EmployeesPage data={data} />;
      case 'nomenclature': return <NomenclaturePage data={data} />;
      case 'arrival': return <ArrivalPage data={data} />;
      case 'expense': return <ExpensePage data={data} />;
      case 'balance': return <BalancePage data={data} />;
      case 'reports': return <ReportsPage data={data} />;
      case 'chat': return <ChatPage data={data} />;
      case 'archive': return <ArchivePage data={data} />;
      case 'audit': return <AuditPage data={data} />;
      case 'settings': return <SettingsPage />;
      default: return <EmployeesPage data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <img src={LOGO_URL} alt="СМУ" className="w-8 h-8 object-contain flex-shrink-0" />
          {sidebarOpen && <span className="font-bold text-slate-800 text-sm">СМУ v0.5.2</span>}
        </div>
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                page === item.id ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg text-center">
            {sidebarOpen ? '◀ Свернуть' : '▶'}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
