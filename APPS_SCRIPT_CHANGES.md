# ИНСТРУКЦИЯ: ЧТО ДОБАВИТЬ В APPS SCRIPT

## 1. В ФУНКЦИИ doPost НАЙДИТЕ switch(action) И ДОБАВЬТЕ ЭТИ CASE:

Найдите в функции `doPost` блок `switch(action)` и добавьте эти case перед `default:`:

```javascript
      // Объявления
      case 'createAnnouncement':
        createAnnouncementData(data);
        return jsonResponse({ success: true });
      case 'updateAnnouncement':
        updateAnnouncementData(data['ID'], data);
        return jsonResponse({ success: true });
      case 'deleteAnnouncement':
        deleteAnnouncementData(data['ID']);
        return jsonResponse({ success: true });
```

## 2. В КОНЦЕ ФАЙЛА ДОБАВЬТЕ ЭТИ ФУНКЦИИ:

Добавьте в конец файла (после всех существующих функций):

```javascript
// ==================== ОБЪЯВЛЕНИЯ ====================

function getAnnouncementsData() {
  return readSheetData('Объявления');
}

function createAnnouncementData(data) {
  appendRow('Объявления', data);
}

function updateAnnouncementData(id, updates) {
  updateRow('Объявления', id, updates);
}

function deleteAnnouncementData(id) {
  return deleteRow('Объявления', id);
}
```

## 3. ПРОВЕРЬТЕ ЧТО ЕСТЬ ФУНКЦИИ readSheetData, appendRow, updateRow, deleteRow

Эти функции должны быть в вашем коде. Если их нет, добавьте:

```javascript
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
  if (!sheet) {
    throw new Error('Лист не найден: ' + sheetName);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumn = headers.indexOf('ID');
  
  if (idColumn === -1) {
    throw new Error('Столбец "ID" не найден в листе "' + sheetName + '"');
  }
  
  const searchId = String(id).trim();
  
  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][idColumn]).trim();
    if (rowId === searchId) {
      sheet.deleteRow(i + 1);
      return { success: true, deletedId: id };
    }
  }
  
  throw new Error('Запись с ID ' + id + ' не найдена');
}
```

## 4. ПОСЛЕ ДОБАВЛЕНИЯ:

1. Сохраните код (Ctrl+S)
2. Создайте новое развёртывание:
   - Развернуть → Управление развертываниями
   - Нажмите на карандаш (✏️)
   - Выберите "Новая версия"
   - Нажмите "Развернуть"
3. Скопируйте новый URL
4. Вставьте URL в настройках приложения

## 5. ПРОВЕРЬТЕ ЛИСТ "Объявления" В GOOGLE SHEETS:

Убедитесь, что в листе "Объявления" есть столбцы:
- ID
- Заголовок
- Текст
- Получатели
- Кем создано
- Дата
- Активно
