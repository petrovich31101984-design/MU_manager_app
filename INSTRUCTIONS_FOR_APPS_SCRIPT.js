// ============================================================================
// ИНСТРУКЦИЯ ДЛЯ GOOGLE APPS SCRIPT
// ============================================================================
// 
// ВАЖНО: Откройте ваш Google Apps Script и добавьте/обновите следующие функции
// 
// ============================================================================
// 1. ФУНКЦИЯ УДАЛЕНИЯ ОБЪЯВЛЕНИЯ (добавить в Apps Script)
// ============================================================================

function deleteAnnouncementData(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Объявления');
  if (!sheet) {
    throw new Error('Лист "Объявления" не найден');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumn = headers.indexOf('ID');
  
  if (idColumn === -1) {
    throw new Error('Столбец "ID" не найден в листе "Объявления"');
  }
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColumn]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, deletedId: id };
    }
  }
  
  throw new Error('Объявление с ID ' + id + ' не найдено');
}

// ============================================================================
// 2. ОБРАБОТЧИК POST-ЗАПРОСОВ (обновить функцию doPost в Apps Script)
// ============================================================================

function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = JSON.parse(e.postData.contents);
    
    // ... существующий код ...
    
    // ДОБАВИТЬ ЭТИ CASE В SWITCH:
    case 'deleteAnnouncement':
      const deleteResult = deleteAnnouncementData(data.id);
      return ContentService.createTextOutput(JSON.stringify(deleteResult))
        .setMimeType(ContentService.MimeType.JSON);
    
    case 'updateAnnouncement':
      const updateResult = updateAnnouncementData(data.id, data.updates);
      return ContentService.createTextOutput(JSON.stringify(updateResult))
        .setMimeType(ContentService.MimeType.JSON);
    
    // ... остальные case ...
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// 3. ФУНКЦИЯ ОБНОВЛЕНИЯ ОБЪЯВЛЕНИЯ (добавить в Apps Script)
// ============================================================================

function updateAnnouncementData(id, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Объявления');
  if (!sheet) {
    throw new Error('Лист "Объявления" не найден');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumn = headers.indexOf('ID');
  
  if (idColumn === -1) {
    throw new Error('Столбец "ID" не найден в листе "Объявления"');
  }
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColumn]) === String(id)) {
      // Обновляем только указанные поля
      Object.keys(updates).forEach(key => {
        const columnIndex = headers.indexOf(key);
        if (columnIndex !== -1) {
          sheet.getRange(i + 1, columnIndex + 1).setValue(updates[key]);
        }
      });
      return { success: true, updatedId: id };
    }
  }
  
  throw new Error('Объявление с ID ' + id + ' не найдено');
}

// ============================================================================
// 4. ПРОВЕРКА СТРУКТУРЫ ЛИСТА "Объявления"
// ============================================================================
// Убедитесь, что в листе "Объявления" есть следующие столбцы:
// - ID (уникальный идентификатор)
// - Заголовок
// - Текст
// - Получатели
// - Кем создано
// - Дата
// - Активно (значения: "ДА" или "НЕТ")
//
// Пример создания объявления:
// ID: ANN-1234567890
// Заголовок: Тестовое объявление
// Текст: Текст объявления
// Получатели: all
// Кем создано: Руководитель
// Дата: 2024-01-15T10:30:00Z
// Активно: ДА

// ============================================================================
// 5. ТЕСТИРОВАНИЕ ФУНКЦИЙ (добавить для отладки)
// ============================================================================

function testDeleteAnnouncement() {
  // Замените на реальный ID объявления из вашей таблицы
  const testId = 'ANN-1234567890';
  
  try {
    const result = deleteAnnouncementData(testId);
    Logger.log('Удаление успешно: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('Ошибка удаления: ' + error.toString());
  }
}

function testUpdateAnnouncement() {
  // Замените на реальный ID объявления из вашей таблицы
  const testId = 'ANN-1234567890';
  const updates = {
    'Заголовок': 'Обновленный заголовок',
    'Текст': 'Обновленный текст'
  };
  
  try {
    const result = updateAnnouncementData(testId, updates);
    Logger.log('Обновление успешно: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('Ошибка обновления: ' + error.toString());
  }
}

// ============================================================================
// ИНСТРУКЦИЯ ПО УСТАНОВКЕ:
// ============================================================================
// 1. Откройте ваш Google Apps Script
// 2. Добавьте функции deleteAnnouncementData и updateAnnouncementData
// 3. Обновите функцию doPost, добавив case для deleteAnnouncement и updateAnnouncement
// 4. Сохраните проект (Ctrl+S)
// 5. Разверните как веб-приложение (если еще не развернуто)
// 6. Скопируйте URL веб-приложения
// 7. Вставьте URL в настройках приложения
// ============================================================================
