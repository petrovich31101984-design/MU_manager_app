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
    if (data.error) return { success: false, error: data.error };
    return { success: true, title: data.title, sheets: data.sheets };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Ошибка подключения' };
  }
}

async function fetchData(action: string): Promise<any[]> {
  const config = getConfig();
  if (!config.scriptUrl) throw new Error('Не настроено подключение');
  const response = await fetch(`${config.scriptUrl}?action=${action}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// Учёт записей в таблицу: фоновое обновление не должно затирать изменения руководителя,
// которые уже показаны на экране, но ещё не записаны в таблицу.
let pendingWrites = 0;
let writeVersion = 0;

/** Снимок состояния записей: если он изменился за время загрузки — результат устарел */
export function getWriteState(): { pending: number; version: number } {
  return { pending: pendingWrites, version: writeVersion };
}

async function postData(action: string, data: any): Promise<void> {
  const config = getConfig();
  if (!config.scriptUrl) throw new Error('Не настроено подключение');
  pendingWrites++;
  writeVersion++;
  try {
    const response = await fetch(config.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data }),
      redirect: 'follow'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.error) throw new Error(result.error);
  } finally {
    pendingWrites--;
    writeVersion++;
  }
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

export interface InitialStock {
  id: string; employeeId: string; nomenclatureId: string; quantity: number;
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
  employeeName?: string; name?: string; unit?: string; month?: string; processedAt?: string;
}

// Статусы возврата
export const RETURN_STATUS = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждён',
  rejected: 'Отклонён',
} as const;

/** Возврат ещё ждёт решения руководителя */
export const isReturnPending = (r: ReturnOperation) =>
  r.status === RETURN_STATUS.pending || r.status === 'Новый' || !r.status;

/** Сколько фактически возвращено (уменьшает остаток сотрудника): только подтверждённые */
export const returnedQuantity = (r: ReturnOperation) =>
  r.status === RETURN_STATUS.confirmed ? (r.correctedQuantity ?? r.quantity) : 0;

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
      // Неактуальна только при явном «НЕТ» (пустое поле — актуальна)
      manufacturer: row['Производитель'] || '', active: String(row['Актуальна'] ?? '').trim().toUpperCase() !== 'НЕТ',
      currentPrice: parseFloat(priceRow?.['Цена за ед. (₽)'] || '0'),
      packageQuantity: parseInt(row['Количество в упаковке'] || '1'),
    };
  });
}

export async function getArrivals(): Promise<Arrival[]> {
  const data = await fetchData('getArrivals');
  return data.map((row: any) => {
    let items = row.items || row['Позиции'] || row['Позиции (JSON)'] || row['Items'] || [];
    if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
    if (!Array.isArray(items)) items = [];
    return {
      id: row['ID'] || '', employeeId: row['Сотрудник_ID'] || '',
      date: row['Дата'] || '', month: row['Месяц'] || '',
      amount: parseFloat(row['Сумма (₽)'] || '0'), shifts: parseInt(row['Количество смен'] || '0'),
      addedBy: row['Кем внесено'] || '', type: row['Тип'] || 'Плановый',
      comment: row['Комментарий'] || '', items, archived: row['Архив'] === 'ДА',
      employeeName: row['ФИО сотрудника'] || row['Сотрудник'] || '',
    };
  });
}

export async function getInitialStock(): Promise<InitialStock[]> {
  const data = await fetchData('getInitialStock');
  return data.map((row: any) => ({
    id: row['ID'] || '',
    employeeId: String(row['Сотрудник_ID'] || '').trim(),
    nomenclatureId: String(row['Номенклатура_ID'] || '').trim(),
    quantity: Number(row['Количество']) || 0,
  }));
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
  return data.map((row: any) => {
    // В таблице колонки могут называться коротко («Скорр. кол-во», «Кем скорр.») или полностью
    const corrected = row['Скорр. кол-во'] ?? row['Скорректированное кол-во'];
    return {
      id: row['ID'] || '', employeeId: String(row['Сотрудник_ID'] || '').trim(),
      date: row['Дата создания'] || '', nomenclatureId: String(row['Номенклатура_ID'] || '').trim(),
      quantity: Number(row['Количество']) || 0, status: row['Статус'] || RETURN_STATUS.pending,
      correctedBy: row['Кем скорр.'] || row['Кем скорректировано'] || '',
      correctedQuantity: corrected !== undefined && corrected !== '' ? Number(corrected) : null,
      comment: row['Комментарий'] || '', reason: row['Причина'] || '',
      employeeName: row['ФИО сотрудника'] || '', name: row['Название'] || '',
      unit: row['Ед. изм.'] || row['Ед. измерения'] || '', month: row['Месяц'] || '',
      processedAt: row['Дата обработки'] || '',
    };
  });
}

/** Решение руководителя по возврату: подтвердить (с корректировкой количества) или отклонить */
export async function updateReturn(id: string, decision: {
  status: string; correctedQuantity?: number | null; comment?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const data: Record<string, any> = {
    'Статус': decision.status,
    'Кем скорр.': 'Руководитель', 'Кем скорректировано': 'Руководитель',
    'Дата обработки': now,
  };
  if (decision.correctedQuantity !== undefined) {
    const value = decision.correctedQuantity ?? '';
    data['Скорр. кол-во'] = value; data['Скорректированное кол-во'] = value;
  }
  if (decision.comment !== undefined) data['Комментарий'] = decision.comment;
  await postData('updateReturn', { id, data });
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  // Один запрос: скрипт всегда читает лист «Чат». Раньше при пустом чате приложение
  // каждые 5 секунд делало 6 одинаковых запросов, перебирая названия листа.
  const data = await fetchData('getChat');
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
  const [data, nomenclature] = await Promise.all([
    fetchData('getExpenseSheets'),
    getNomenclature()
  ]);
  return data.map((row: any) => {
    let rawItems = row.items || row['Позиции'] || row['Позиции (JSON)'] || [];
    if (typeof rawItems === 'string') { try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; } }
    if (!Array.isArray(rawItems)) rawItems = [];
    const items = rawItems.map((item: any): ExpenseItem => {
      const quantity = Number(item.quantity ?? item['Количество']) || 0;
      const nomenclatureId = String(item.nomenclatureId ?? item.id ?? item['Номенклатура_ID'] ?? '');
      const itemName = String(item.name ?? item['Название'] ?? '');
      const nomenclatureItem = nomenclature.find(item => item.id === nomenclatureId)
        || nomenclature.find(item => itemName && item.name === itemName);
      const storedPrice = Number(item.pricePerUnit ?? item.price ?? item['Цена за единицу'] ?? item['Цена за ед. (₽)']) || 0;
      const storedTotal = Number(item.total ?? item.totalAmount ?? item['Сумма']) || 0;
      const pricePerUnit = storedPrice || nomenclatureItem?.currentPrice || (quantity > 0 && storedTotal > 0 ? storedTotal / quantity : 0);
      return {
        nomenclatureId: nomenclatureItem?.id || nomenclatureId,
        name: itemName || nomenclatureItem?.name || '',
        category: String(item.category ?? item['Категория'] ?? nomenclatureItem?.category ?? ''),
        quantity,
        pricePerUnit,
        total: quantity * pricePerUnit
      };
    });
    const calculatedTotal = items.reduce((sum, item) => sum + item.total, 0);
    return {
      id: row['ID'] || '', employeeId: row['Сотрудник_ID'] || '',
      employeeName: row['Сотрудник'] || '', patientName: row['Пациент'] || '',
      patientBirthDate: row['Дата рождения пациента'] || '',
      date: row['Дата'] || '', month: row['Месяц'] || '',
      callCategory: row['Категория выезда'] || '', therapyName: row['Название терапии'] || '',
      therapyCost: parseFloat(row['Стоимость терапии'] || '0'),
      items, totalAmount: calculatedTotal > 0 ? calculatedTotal : parseFloat(row['Итого по препаратам'] || '0'),
      archived: row['Архив'] === 'ДА',
    };
  });
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

function employeeToSheetData(data: Partial<Employee>): Record<string, any> {
  const fieldNames: Partial<Record<keyof Employee, string>> = {
    id: 'ID',
    personalNumber: 'Персональный номер',
    fullName: 'ФИО',
    status: 'Статус',
    position: 'Должность',
    hireDate: 'Дата найма',
    phone: 'Телефон',
    lastActivity: 'Последний вход',
    note: 'Примечание',
  };
  const sheetData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    if (key === 'blocked' || key === 'shiftOpen') {
      sheetData[key === 'blocked' ? 'Заблокирован' : 'Смена открыта'] = value ? 'ДА' : 'НЕТ';
    } else if (key === 'password') {
      sheetData['Пароль'] = value;
      sheetData['Пароль (хэш)'] = value;
    } else {
      sheetData[fieldNames[key as keyof Employee] || key] = value;
    }
  });
  return sheetData;
}

export async function addEmployee(employee: Partial<Employee>): Promise<void> {
  await postData('addEmployee', employeeToSheetData(employee));
}
export async function updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
  await postData('updateEmployee', { id, data: employeeToSheetData(data) });
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
/** Месяц ('ГГГГ-ММ') по дате — в местном времени (не UTC, иначе ночью получается вчерашний день) */
export function monthOf(date: string | Date): string {
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00`)
    : new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Дата для поля ввода даты ('ГГГГ-ММ-ДД', местное время) — из таблицы она приходит как ISO с временем */
export function toDateInput(value: string | undefined): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // «ДД.ММ.ГГГГ» — так дату рождения пациента пишет приложение сотрудника
  const ru = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Сегодняшняя дата 'ГГГГ-ММ-ДД' в местном времени */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function updateExpenseSheet(id: string, sheet: Partial<ExpenseSheet>): Promise<void> {
  // Скрипт пишет только поля с названиями колонок таблицы — раньше уходили английские
  // названия, и сохранялся лишь список препаратов, остальные правки терялись.
  const data: Record<string, any> = {};
  if (sheet.employeeId !== undefined) data['Сотрудник_ID'] = sheet.employeeId;
  if (sheet.employeeName !== undefined) data['Сотрудник'] = sheet.employeeName;
  if (sheet.patientName !== undefined) data['Пациент'] = sheet.patientName;
  if (sheet.patientBirthDate !== undefined) data['Дата рождения пациента'] = sheet.patientBirthDate;
  if (sheet.date !== undefined) {
    data['Дата'] = sheet.date;
    const month = monthOf(sheet.date);
    if (month) data['Месяц'] = month;
  }
  if (sheet.callCategory !== undefined) data['Категория выезда'] = sheet.callCategory;
  if (sheet.therapyName !== undefined) data['Название терапии'] = sheet.therapyName;
  if (sheet.therapyCost !== undefined) data['Стоимость терапии'] = sheet.therapyCost;
  if (sheet.totalAmount !== undefined) data['Итого по препаратам'] = sheet.totalAmount;
  if (sheet.items !== undefined) data.items = sheet.items;
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
export async function createAnnouncement(announcement: { id: string; title: string; text: string; recipients: string[] }): Promise<void> {
  await postData('createAnnouncement', {
    'ID': announcement.id,
    'Заголовок': announcement.title,
    'Текст': announcement.text,
    'Получатели': announcement.recipients.join(','),
    'Кем создано': 'Руководитель',
    'Дата': new Date().toISOString(),
    'Активно': 'ДА',
  });
}

// ==================== ДЕКОРИРОВАНИЕ ПРИЛОЖЕНИЙ ====================
// Настройки декора (гирлянда, снег) хранятся служебной записью на листе «Объявления» с ID DECOR_RECORD_ID:
// в «Тексте» — JSON {"garland":true,"snow":false}, «Активно» = НЕТ (поэтому как объявление её не показывает
// ни одна версия приложений). Руководитель её меняет, кладовщик и сотрудники только читают.
// Так обходимся без изменения Apps Script.
export const DECOR_RECORD_ID = 'smu-decor';
export type DecorSettings = { garland: boolean; snow: boolean };
export const isDecorRecord = (a: { id?: unknown }) => String(a.id ?? '').trim() === DECOR_RECORD_ID;
export function readDecor(announcements: Announcement[]): DecorSettings {
  const record = announcements.find(isDecorRecord);
  try {
    const value = JSON.parse(record?.text || '{}');
    return { garland: value.garland === true, snow: value.snow === true };
  } catch {
    return { garland: false, snow: false };
  }
}
/** Сохранить настройки декора; recordExists — есть ли уже служебная запись в таблице */
export async function saveDecor(decor: DecorSettings, recordExists: boolean): Promise<void> {
  const text = JSON.stringify(decor);
  if (recordExists) {
    await postData('updateAnnouncement', { 'ID': DECOR_RECORD_ID, 'Текст': text, 'Активно': 'НЕТ' });
  } else {
    await postData('createAnnouncement', {
      'ID': DECOR_RECORD_ID,
      'Заголовок': 'Служебная запись: декорирование приложений (не удалять)',
      'Текст': text,
      'Получатели': 'служебное',
      'Кем создано': 'Руководитель',
      'Дата': new Date().toISOString(),
      'Активно': 'НЕТ',
    });
  }
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
  // Скрипт пишет строку по названиям колонок листа «Журнал изменений»
  await postData('addAuditLog', {
    'ID': log.id || `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    'Дата и время': log.date || new Date().toISOString(),
    'Пользователь ID': log.userId ?? 'MGR',
    'Пользователь ФИО': log.userName ?? 'Руководитель',
    'Роль': log.role ?? 'Руководитель',
    'Лист': log.sheet ?? '',
    'Запись_ID': log.recordId ?? '',
    'Действие': log.action ?? '',
    'Поле': log.field ?? '',
    'Было': log.oldValue ?? '',
    'Стало': log.newValue ?? '',
    'Устройство': 'Приложение руководителя',
  });
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
  const data = await fetchData('getPrices');
  return data
    .filter((row: any) => row['Номенклатура_ID'] === nomenclatureId)
    .map((row: any) => ({
      id: row['ID'] || '', nomenclatureId: row['Номенклатура_ID'] || '',
      price: parseFloat(row['Цена за ед. (₽)'] || '0'),
      date: row['Дата начала'] || '', changedBy: row['Кем изменено'] || '',
    }))
    .sort((a: PriceHistory, b: PriceHistory) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
