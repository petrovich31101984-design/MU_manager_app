/**
 * Google Sheets через Apps Script Web App
 */

const CONFIG_KEY = 'appsScriptConfig';

interface Config {
  scriptUrl: string;
}

function getConfig(): Config {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { return { scriptUrl: '' }; }
  }
  return { scriptUrl: '' };
}

export function saveConfig(scriptUrl: string): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ scriptUrl }));
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

export function isConnected(): boolean {
  return !!getConfig().scriptUrl;
}

export function getCurrentConfig(): Config {
  return getConfig();
}

export async function testConnection(): Promise<{ success: boolean; title?: string; sheets?: string[]; error?: string }> {
  const config = getConfig();
  if (!config.scriptUrl) return { success: false, error: 'URL не указан' };
  try {
    const response = await fetch(`${config.scriptUrl}?action=test`);
    if (!response.ok) return { success: false, error: `Ошибка ${response.status}` };
    const data = await response.json();
    console.log('🔍 Результат testConnection:', data);
    if (data.error) return { success: false, error: data.error };
    return { success: true, title: data.title, sheets: data.sheets };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Ошибка подключения' };
  }
}

async function fetchData(action: string): Promise<any[]> {
  const config = getConfig();
  if (!config.scriptUrl) throw new Error('Не настроено подключение');
  console.log(`🔗 Запрос к Apps Script: action=${action}`);
  const response = await fetch(`${config.scriptUrl}?action=${action}`);
  console.log(`📡 Ответ от Apps Script для ${action}:`, response.status);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  console.log(`📦 Данные от Apps Script для ${action}:`, data);
  if (data.error) throw new Error(data.error);
  return data;
}

async function postData(action: string, data: any): Promise<void> {
  const config = getConfig();
  if (!config.scriptUrl) throw new Error('Не настроено подключение');
  const response = await fetch(config.scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, data }),
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error(result.error);
}

// ==================== ТИПЫ ====================

export interface Employee {
  id: string; personalNumber: string; fullName: string; password: string;
  status: string; position: string; hireDate: string; blocked: boolean;
  phone: string; lastActivity: string; note: string; shiftOpen: boolean;
}

export interface Nomenclature {
  id: string; name: string; category: string; unit: string;
  manufacturer: string; active: boolean; currentPrice: number; packageQuantity: number;
}

export interface Arrival {
  id: string; employeeId: string; date: string; month: string; amount: number;
  shifts: number; addedBy: string; type: string; comment: string;
  items?: Array<{ nomenclatureId: string; quantity: number; price: number; total: number }>;
  archived?: boolean; employeeName?: string;
}

export interface Expense {
  id: string; employeeId: string; date: string; callDate: string; month: string;
  nomenclatureId: string; quantity: number; patientName: string; patientBirthDate: string; callId: string;
}

export interface ExpenseItem {
  nomenclatureId: string; name: string; category: string;
  quantity: number; pricePerUnit: number; total: number;
}

export interface ExpenseSheet {
  id: string; employeeId: string; employeeName: string; patientName: string;
  patientBirthDate: string; date: string; month: string; callCategory: string;
  therapyName: string; therapyCost: number; items: ExpenseItem[];
  totalAmount: number; archived: boolean;
}

export interface ReturnOperation {
  id: string; employeeId: string; date: string; nomenclatureId: string;
  quantity: number; status: string; correctedBy: string;
  correctedQuantity: number | null; comment: string; reason: string;
}

export interface ChatMessage {
  id: string; fromId: string; fromName: string; toId: string; toName: string;
  role: string; text: string; date: string; read: boolean; priority: string;
}

export interface Announcement {
  id: string; title: string; text: string; recipients: string[];
  createdBy: string; date: string; active: boolean;
}

export interface AuditEntry {
  id: string; date: string; userId: string; userName: string; role: string;
  sheet: string; recordId: string; action: string; field: string;
  oldValue: string; newValue: string;
}

// ==================== ЧТЕНИЕ ====================

export async function getEmployees(): Promise<Employee[]> {
  const data = await fetchData('getEmployees');
  return data.map((row: any) => ({
    id: row['ID'] || '', personalNumber: row['Персональный номер'] || '',
    fullName: row['ФИО'] || '', password: row['Пароль'] || '',
    status: row['Статус'] || 'Активен', position: row['Должность'] || '',
    hireDate: row['Дата найма'] || '', blocked: row['Заблокирован'] === 'ДА',
    phone: row['Телефон'] || '', lastActivity: row['Последний вход'] || '',
    note: row['Примечание'] || '', shiftOpen: row['Смена открыта'] === 'ДА',
  }));
}

export async function getNomenclature(): Promise<Nomenclature[]> {
  const data = await fetchData('getNomenclature');
  const prices = await fetchData('getPrices');
  return data.map((row: any) => {
    const priceRow = prices.find((p: any) =>
      p['Номенклатура_ID'] === row['ID'] && (!p['Дата окончания'] || p['Дата окончания'] === '')
    );
    return {
      id: row['ID'] || '', name: row['Название'] || '',
      category: row['Категория'] || 'Лекарство', unit: row['Ед. измерения'] || 'Штуки',
      manufacturer: row['Производитель'] || '', active: row['Актуальна'] === 'ДА',
      currentPrice: parseFloat(priceRow?.['Цена за ед. (₽)'] || '0'),
      packageQuantity: parseInt(row['Количество в упаковке'] || '1'),
    };
  });
}

export async function getArrivals(): Promise<Arrival[]> {
  const data = await fetchData('getArrivals');
  return data.map((row: any) => {
    let items = row.items || row['Позиции'] || row['Items'] || [];
    if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
    if (!Array.isArray(items)) items = [];
    return {
      id: row['ID'] || '', employeeId: row['Сотрудник_ID'] || '',
      date: row['Дата'] || '', month: row['Месяц'] || '',
      amount: parseFloat(row['Сумма (₽)'] || '0'), shifts: parseInt(row['Количество смен'] || '0'),
      addedBy: row['Кем внесено'] || '', type: row['Тип'] || 'Плановый',
      comment: row['Комментарий'] || '', items, archived: row['Архив'] === 'ДА',
      employeeName: row['Сотрудник'] || '',
    };
  });
}

export async function getExpenses(): Promise<Expense[]> {
  const data = await fetchData('getExpenses');
  return data.map((row: any) => ({
    id: row['ID'] || '', employeeId: row['Сотрудник_ID'] || '',
    date: row['Дата внесения'] || '', callDate: row['Дата вызова'] || '',
    month: row['Месяц'] || '', nomenclatureId: row['Номенклатура_ID'] || '',
    quantity: parseInt(row['Количество'] || '0'), patientName: row['Пациент ФИО'] || '',
    patientBirthDate: row['Пациент ДР'] || '', callId: row['Вызов_ID'] || '',
  }));
}

export async function getReturns(): Promise<ReturnOperation[]> {
  const data = await fetchData('getReturns');
  return data.map((row: any) => ({
    id: row['ID'] || '', employeeId: row['Сотрудник_ID'] || '',
    date: row['Дата создания'] || '', nomenclatureId: row['Номенклатура_ID'] || '',
    quantity: parseInt(row['Количество'] || '0'), status: row['Статус'] || 'Новый',
    correctedBy: row['Кем скорректировано'] || '',
    correctedQuantity: row['Скорректированное кол-во'] ? parseInt(row['Скорректированное кол-во']) : null,
    comment: row['Комментарий'] || '', reason: row['Причина'] || '',
  }));
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  console.log('📥 Загрузка сообщений из Google Sheets...');
  
  // Пробуем разные возможные названия листов
  const possibleSheetNames = ['Чат', 'Chat', 'Сообщения', 'Messages', 'Чаты', 'Chats'];
  
  for (const sheetName of possibleSheetNames) {
    console.log(`🔍 Пробуем прочитать из листа: "${sheetName}"`);
    try {
      const config = getConfig();
      const url = `${config.scriptUrl}?action=getChat&sheet=${sheetName}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`📊 Лист "${sheetName}" вернул:`, data.length, 'записей');
      
      if (data.length > 0) {
        console.log(`✅ Найдены сообщения в листе "${sheetName}"!`);
        return data.map((row: any) => ({
          id: row['ID'] || '', 
          fromId: row['От кого (ID)'] || '', 
          fromName: row['От кого (ФИО)'] || '',
          toId: row['Кому (ID)'] || '', 
          toName: row['Кому (ФИО)'] || '',
          role: row['Роль'] || 'Сотрудник', 
          text: row['Текст'] || '',
          date: row['Дата и время'] || '', 
          read: String(row['Прочитано'] || '').toUpperCase().trim() === 'ДА',
          priority: row['Приоритет'] || 'Обычное',
        }));
      }
    } catch (error) {
      console.log(`❌ Ошибка чтения из листа "${sheetName}":`, error);
    }
  }
  
  console.log('⚠️ Не найдено сообщений ни в одном из листов');
  return [];
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  const data = await fetchData('getAuditLog');
  return data.map((row: any) => ({
    id: row['ID'] || '', date: row['Дата и время'] || '',
    userId: row['Пользователь ID'] || '', userName: row['Пользователь ФИО'] || '',
    role: row['Роль'] || '', sheet: row['Лист'] || '',
    recordId: row['Запись_ID'] || '', action: row['Действие'] || '',
    field: row['Поле'] || '', oldValue: row['Было'] || '', newValue: row['Стало'] || '',
  }));
}

export async function getExpenseSheets(): Promise<ExpenseSheet[]> {
  const data = await fetchData('getExpenseSheets');
  return data.map((row: any) => ({
    id: row['ID'] || '', employeeId: row['Сотрудник_ID'] || '',
    employeeName: row['Сотрудник'] || '', patientName: row['Пациент'] || '',
    patientBirthDate: row['Дата рождения пациента'] || '',
    date: row['Дата'] || '', month: row['Месяц'] || '',
    callCategory: row['Категория выезда'] || '', therapyName: row['Название терапии'] || '',
    therapyCost: parseFloat(row['Стоимость терапии'] || '0'),
    items: row.items || [], totalAmount: parseFloat(row['Итого по препаратам'] || '0'),
    archived: row['Архив'] === 'ДА',
  }));
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const data = await fetchData('getAnnouncements');
  return data.map((row: any) => ({
    id: row['ID'] || '', title: row['Заголовок'] || '', text: row['Текст'] || '',
    recipients: row['Получатели'] ? row['Получатели'].split(',') : [],
    createdBy: row['Кем создано'] || '', date: row['Дата'] || '',
    active: row['Активно'] === 'ДА',
  }));
}

// ==================== ЗАПИСЬ ====================

export async function addEmployee(employee: Partial<Employee>): Promise<void> {
  await postData('addEmployee', employee);
}
export async function updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
  await postData('updateEmployee', { id, data });
}
export async function updateEmployeeShift(id: string, shiftOpen: boolean): Promise<void> {
  await postData('updateEmployeeShift', { id, shiftOpen });
}
export async function deleteEmployee(id: string): Promise<void> {
  await postData('deleteEmployee', { id });
}
export async function addArrival(arrival: Partial<Arrival>): Promise<void> {
  await postData('addArrival', arrival);
}
export async function updateArrival(id: string, data: Partial<Arrival>): Promise<void> {
  await postData('updateArrival', { id, data });
}
export async function deleteArrival(id: string): Promise<void> {
  await postData('deleteArrival', { id });
}
export async function archiveArrival(id: string): Promise<void> {
  await postData('archiveArrival', { id });
}
export async function restoreArrival(id: string): Promise<void> {
  await postData('restoreArrival', { id });
}
export async function addExpenseSheet(sheet: Partial<ExpenseSheet>): Promise<void> {
  await postData('addExpenseSheet', sheet);
}
export async function updateExpenseSheet(id: string, data: Partial<ExpenseSheet>): Promise<void> {
  await postData('updateExpenseSheet', { id, data });
}
export async function archiveExpenseSheet(id: string): Promise<void> {
  await postData('archiveExpenseSheet', { id });
}
export async function restoreExpenseSheet(id: string): Promise<void> {
  await postData('restoreExpenseSheet', { id });
}
export async function addExpense(expense: Partial<Expense>): Promise<void> {
  await postData('addExpense', expense);
}
export async function addReturn(returnOp: Partial<ReturnOperation>): Promise<void> {
  await postData('addReturn', returnOp);
}
export async function addChatMessage(message: Partial<ChatMessage>): Promise<void> {
  await postData('addChatMessage', message);
}

export async function updateChatMessage(id: string, updates: { read?: boolean; [key: string]: any }): Promise<void> {
  // Преобразуем поле read в формат для Google Sheets
  const sheetUpdates: any = { ...updates };
  if (updates.read !== undefined) {
    sheetUpdates['Прочитано'] = updates.read ? 'ДА' : 'НЕТ';
    delete sheetUpdates.read;
  }
  await postData('updateChatMessage', { id, ...sheetUpdates });
}
export async function createAnnouncement(announcement: { title: string; text: string; recipients: string[] }): Promise<void> {
  await postData('createAnnouncement', {
    'ID': `ANN-${Date.now()}`,
    'Заголовок': announcement.title,
    'Текст': announcement.text,
    'Получатели': announcement.recipients.join(','),
    'Кем создано': 'Руководитель',
    'Дата': new Date().toISOString(),
    'Активно': 'ДА',
  });
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  const sheetUpdates: any = { 'ID': id };
  if (updates.title !== undefined) sheetUpdates['Заголовок'] = updates.title;
  if (updates.text !== undefined) sheetUpdates['Текст'] = updates.text;
  if (updates.recipients !== undefined) sheetUpdates['Получатели'] = updates.recipients.join(',');
  if (updates.active !== undefined) sheetUpdates['Активно'] = updates.active ? 'ДА' : 'НЕТ';
  await postData('updateAnnouncement', sheetUpdates);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await postData('deleteAnnouncement', { 'ID': id });
}
export async function addAuditLog(log: Partial<AuditEntry>): Promise<void> {
  await postData('addAuditLog', log);
}
export async function clearAuditLog(): Promise<void> {
  await postData('clearAuditLog', {});
}
export async function updateNomenclature(id: string, data: any): Promise<void> {
  await postData('updateNomenclature', { id, ...data });
}
export async function addNomenclature(item: Partial<Nomenclature>): Promise<void> {
  await postData('addNomenclature', item);
}
export async function deleteNomenclature(id: string): Promise<void> {
  await postData('deleteNomenclature', { id });
}

export interface PriceHistory {
  id: string; nomenclatureId: string; price: number; date: string; changedBy: string;
}

export async function getPriceHistory(nomenclatureId: string): Promise<PriceHistory[]> {
  const data = await fetchData('getPriceHistory');
  return data
    .filter((row: any) => row['Номенклатура_ID'] === nomenclatureId)
    .map((row: any) => ({
      id: row['ID'] || '', nomenclatureId: row['Номенклатура_ID'] || '',
      price: parseFloat(row['Цена за ед. (₽)'] || '0'),
      date: row['Дата начала'] || '', changedBy: row['Кем изменено'] || '',
    }))
    .sort((a: PriceHistory, b: PriceHistory) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
