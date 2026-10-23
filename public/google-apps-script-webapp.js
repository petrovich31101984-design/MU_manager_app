/**
 * СМУ - Система Медицинского Учёта
 * Google Apps Script Web App для руководителя
 * Версия 0.5.2
 */

// ==================== ГЛАВНЫЕ ФУНКЦИИ ====================

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'test':
        return jsonResponse({ 
          success: true, 
          title: SpreadsheetApp.getActiveSpreadsheet().getName(),
          sheets: SpreadsheetApp.getActiveSpreadsheet().getSheets().map(s => s.getName())
        });
      case 'getEmployees':
        return jsonResponse(getEmployeesData());
      case 'getNomenclature':
        return jsonResponse(getNomenclatureData());
      case 'getPrices':
        return jsonResponse(getPricesData());
      case 'getArrivals':
        return jsonResponse(getArrivalsData());
      case 'getExpenses':
        return jsonResponse(getExpensesData());
      case 'getExpenseSheets':
        return jsonResponse(getExpenseSheetsData());
      case 'getReturns':
        return jsonResponse(getReturnsData());
      case 'getChat':
        return jsonResponse(getChatData());
      case 'getAuditLog':
        return jsonResponse(getAuditLogData());
      case 'getAnnouncements':
        return jsonResponse(getAnnouncementsData());
      default:
        return jsonResponse({ error: 'Неизвестное действие: ' + action });
    }
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const data = body.data;
    
    switch(action) {
      // Сотрудники
      case 'addEmployee':
        addEmployeeData(data);
        return jsonResponse({ success: true });
      case 'updateEmployee':
        updateEmployeeData(data.id, data.data);
        return jsonResponse({ success: true });
      case 'updateEmployeeShift':
        updateEmployeeShiftData(data.id, data.shiftOpen);
        return jsonResponse({ success: true });
      case 'deleteEmployee':
        deleteEmployeeData(data.id);
        return jsonResponse({ success: true });
      
      // Номенклатура
      case 'addNomenclature':
        addNomenclatureData(data);
        return jsonResponse({ success: true });
      case 'updateNomenclature':
        updateNomenclatureData(data.id, data);
        return jsonResponse({ success: true });
      case 'deleteNomenclature':
        deleteNomenclatureData(data.id);
        return jsonResponse({ success: true });
      
      // Приход
      case 'addArrival':
        addArrivalData(data);
        return jsonResponse({ success: true });
      case 'updateArrival':
        updateArrivalData(data.id, data.data);
        return jsonResponse({ success: true });
      case 'deleteArrival':
        deleteArrivalData(data.id);
        return jsonResponse({ success: true });
      case 'archiveArrival':
        archiveArrivalData(data.id);
        return jsonResponse({ success: true });
      case 'restoreArrival':
        restoreArrivalData(data.id);
        return jsonResponse({ success: true });
      
      // Расход
      case 'addExpense':
        addExpenseData(data);
        return jsonResponse({ success: true });
      
      // Листы расхода
      case 'addExpenseSheet':
        addExpenseSheetData(data);
        return jsonResponse({ success: true });
      case 'updateExpenseSheet':
        updateExpenseSheetData(data.id, data.data);
        return jsonResponse({ success: true });
      case 'archiveExpenseSheet':
        archiveExpenseSheetData(data.id);
        return jsonResponse({ success: true });
      case 'restoreExpenseSheet':
        restoreExpenseSheetData(data.id);
        return jsonResponse({ success: true });
      
      // Возвраты
      case 'addReturn':
        addReturnData(data);
        return jsonResponse({ success: true });
      
      // Чат
      case 'addChatMessage':
        addChatMessageData(data);
        return jsonResponse({ success: true });
      case 'updateChatMessage':
        const { id, ...updates } = data;
        updateChatMessageData(id, updates);
        return jsonResponse({ success: true });
      
      // Объявления
      case 'createAnnouncement':
        createAnnouncementData(data);
        return jsonResponse({ success: true });
      
      // Журнал изменений
      case 'addAuditLog':
        addAuditLogData(data);
        return jsonResponse({ success: true });
      case 'clearAuditLog':
        clearAuditLogData();
        return jsonResponse({ success: true });
      
      default:
        return jsonResponse({ error: 'Неизвестное действие: ' + action });
    }
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  return data.slice(1).filter(row => row[0] !== '').map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const val = row[i];
      if (h === 'Месяц') {
        if (val instanceof Date) {
          const year = val.getFullYear();
          const month = String(val.getMonth() + 1).padStart(2, '0');
          obj[h] = `${year}-${month}`;
        } else {
          obj[h] = val || '';
        }
      } else if (val instanceof Date) {
        obj[h] = val.toISOString();
      } else {
        obj[h] = val || '';
      }
    });
    return obj;
  });
}

function appendRow(sheetName, rowData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Лист не найден: ' + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => rowData[h] !== undefined ? rowData[h] : '');
  sheet.appendRow(row);
}

function updateRow(sheetName, id, updates) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Лист не найден: ' + sheetName);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumn = headers.indexOf('ID');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idColumn] === id) {
      Object.keys(updates).forEach(key => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
        }
      });
      break;
    }
  }
}

function deleteRow(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Лист не найден: ' + sheetName);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumn = headers.indexOf('ID');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idColumn] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

// ==================== СОТРУДНИКИ ====================

function getEmployeesData() {
  return readSheetData('Сотрудники');
}

function addEmployeeData(data) {
  appendRow('Сотрудники', data);
}

function updateEmployeeData(id, updates) {
  updateRow('Сотрудники', id, updates);
}

function updateEmployeeShiftData(id, shiftOpen) {
  updateRow('Сотрудники', id, { 'Смена открыта': shiftOpen ? 'ДА' : 'НЕТ' });
}

function deleteEmployeeData(id) {
  deleteRow('Сотрудники', id);
}

// ==================== НОМЕНКЛАТУРА ====================

function getNomenclatureData() {
  return readSheetData('Номенклатура');
}

function addNomenclatureData(data) {
  appendRow('Номенклатура', data);
}

function updateNomenclatureData(id, updates) {
  updateRow('Номенклатура', id, updates);
}

function deleteNomenclatureData(id) {
  deleteRow('Номенклатура', id);
}

// ==================== ЦЕНЫ ====================

function getPricesData() {
  return readSheetData('Цены');
}

// ==================== ПРИХОД ====================

function getArrivalsData() {
  return readSheetData('Приход');
}

function addArrivalData(data) {
  if (data.items && Array.isArray(data.items)) {
    data.items = JSON.stringify(data.items);
  }
  appendRow('Приход', data);
}

function updateArrivalData(id, updates) {
  if (updates.items && Array.isArray(updates.items)) {
    updates.items = JSON.stringify(updates.items);
  }
  updateRow('Приход', id, updates);
}

function deleteArrivalData(id) {
  deleteRow('Приход', id);
}

function archiveArrivalData(id) {
  updateRow('Приход', id, { 'Архив': 'ДА' });
}

function restoreArrivalData(id) {
  updateRow('Приход', id, { 'Архив': 'НЕТ' });
}

// ==================== РАСХОД ====================

function getExpensesData() {
  return readSheetData('Расход');
}

function addExpenseData(data) {
  appendRow('Расход', data);
}

// ==================== ЛИСТЫ РАСХОДА ====================

function getExpenseSheetsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Листы расхода');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const val = row[i];
      if (h === 'items' || h === 'Позиции') {
        if (typeof val === 'string' && val) {
          try {
            obj[h] = JSON.parse(val);
          } catch (e) {
            obj[h] = [];
          }
        } else {
          obj[h] = [];
        }
      } else if (h === 'Месяц') {
        if (val instanceof Date) {
          const year = val.getFullYear();
          const month = String(val.getMonth() + 1).padStart(2, '0');
          obj[h] = `${year}-${month}`;
        } else {
          obj[h] = val || '';
        }
      } else if (val instanceof Date) {
        obj[h] = val.toISOString();
      } else {
        obj[h] = val || '';
      }
    });
    return obj;
  });
}

function addExpenseSheetData(data) {
  if (data.items && Array.isArray(data.items)) {
    data.items = JSON.stringify(data.items);
  }
  appendRow('Листы расхода', data);
}

function updateExpenseSheetData(id, updates) {
  if (updates.items && Array.isArray(updates.items)) {
    updates.items = JSON.stringify(updates.items);
  }
  updateRow('Листы расхода', id, updates);
}

function archiveExpenseSheetData(id) {
  updateRow('Листы расхода', id, { 'Архив': 'ДА' });
}

function restoreExpenseSheetData(id) {
  updateRow('Листы расхода', id, { 'Архив': 'НЕТ' });
}

// ==================== ВОЗВРАТЫ ====================

function getReturnsData() {
  return readSheetData('Возвраты');
}

function addReturnData(data) {
  appendRow('Возвраты', data);
}

// ==================== ЧАТ ====================

function getChatData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Чат');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  return data.slice(1).map((row, index) => {
    const obj = {};
    headers.forEach((h, i) => {
      const val = row[i];
      if (h === 'ID' && (val === '' || val === null || val === undefined)) {
        obj[h] = 'MSG-AUTO-' + (index + 1) + '-' + Date.now();
      } else if (val instanceof Date) {
        obj[h] = val.toISOString();
      } else {
        obj[h] = val || '';
      }
    });
    return obj;
  });
}

function addChatMessageData(data) {
  appendRow('Чат', data);
}

function updateChatMessageData(id, updates) {
  updateRow('Чат', id, updates);
}

// ==================== ОБЪЯВЛЕНИЯ ====================

function getAnnouncementsData() {
  return readSheetData('Объявления');
}

function createAnnouncementData(data) {
  appendRow('Объявления', data);
}

// ==================== ЖУРНАЛ ИЗМЕНЕНИЙ ====================

function getAuditLogData() {
  return readSheetData('Журнал изменений');
}

function addAuditLogData(data) {
  appendRow('Журнал изменений', data);
}

function clearAuditLogData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Журнал изменений');
  if (!sheet) return;
  
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

// ==================== НАСТРОЙКА БАЗЫ ДАННЫХ ====================

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const requiredSheets = [
    'Сотрудники',
    'Номенклатура',
    'Цены',
    'Приход',
    'Расход',
    'Листы расхода',
    'Возвраты',
    'Чат',
    'Объявления',
    'Журнал изменений',
    'Настройки',
    'Отчёты'
  ];
  
  const sheetHeaders = {
    'Сотрудники': ['ID', 'Персональный номер', 'ФИО', 'Пароль', 'Статус', 'Должность', 'Дата найма', 'Заблокирован', 'Телефон', 'Последний вход', 'Примечание', 'Смена открыта'],
    'Номенклатура': ['ID', 'Название', 'Категория', 'Ед. измерения', 'Производитель', 'Актуальна', 'Количество в упаковке'],
    'Цены': ['ID', 'Номенклатура_ID', 'Цена за ед. (₽)', 'Дата начала', 'Дата окончания', 'Кем изменено'],
    'Приход': ['ID', 'Сотрудник_ID', 'Сотрудник', 'Дата', 'Месяц', 'Сумма (₽)', 'Количество смен', 'Кем внесено', 'Тип', 'Комментарий', 'Позиции', 'Архив'],
    'Расход': ['ID', 'Сотрудник_ID', 'Дата внесения', 'Дата вызова', 'Месяц', 'Номенклатура_ID', 'Количество', 'Пациент ФИО', 'Пациент ДР', 'Вызов_ID'],
    'Листы расхода': ['ID', 'Сотрудник_ID', 'Сотрудник', 'Пациент', 'Дата рождения пациента', 'Дата', 'Месяц', 'Категория выезда', 'Название терапии', 'Стоимость терапии', 'Итого по препаратам', 'Позиции', 'Архив'],
    'Возвраты': ['ID', 'Сотрудник_ID', 'Дата создания', 'Номенклатура_ID', 'Количество', 'Статус', 'Кем скорректировано', 'Скорректированное кол-во', 'Комментарий', 'Причина'],
    'Чат': ['ID', 'От кого (ID)', 'От кого (ФИО)', 'Кому (ID)', 'Кому (ФИО)', 'Роль', 'Текст', 'Дата и время', 'Прочитано', 'Тип', 'Приоритет'],
    'Объявления': ['ID', 'Заголовок', 'Текст', 'Получатели', 'Кем создано', 'Дата', 'Активно'],
    'Журнал изменений': ['ID', 'Дата и время', 'Пользователь ID', 'Пользователь ФИО', 'Роль', 'Лист', 'Запись_ID', 'Действие', 'Поле', 'Было', 'Стало'],
    'Настройки': ['Ключ', 'Значение'],
    'Отчёты': ['ID', 'Тип', 'Период', 'Данные', 'Создано']
  };
  
  requiredSheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('Создан лист: ' + sheetName);
    }
    
    const headers = sheetHeaders[sheetName];
    if (headers && sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      Logger.log('Добавлены заголовки для листа: ' + sheetName);
    }
  });
  
  const defaultSheet = ss.getSheetByName('Лист1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
    Logger.log('Удалён стандартный лист "Лист1"');
  }
  
  Logger.log('База данных успешно настроена!');
  SpreadsheetApp.getUi().alert('База данных успешно настроена! Создано листов: ' + requiredSheets.length);
}

// ==================== ТЕСТОВЫЕ ФУНКЦИИ ====================

function testGetChatData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Чат');
  
  Logger.log('=== ТЕСТ getChatData ===');
  Logger.log('Все листы: ' + ss.getSheets().map(s => s.getName()).join(', '));
  Logger.log('Лист "Чат" найден: ' + (sheet ? 'ДА' : 'НЕТ'));
  
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    Logger.log('Количество строк: ' + data.length);
    Logger.log('Заголовки: ' + JSON.stringify(data[0]));
    if (data.length > 1) {
      Logger.log('Первая строка данных: ' + JSON.stringify(data[1]));
    }
  }
  
  const result = getChatData();
  Logger.log('Результат getChatData: ' + JSON.stringify(result));
}
