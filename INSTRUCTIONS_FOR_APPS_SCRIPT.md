# ПОШАГОВАЯ ИНСТРУКЦИЯ ДЛЯ GOOGLE APPS SCRIPT

## Шаг 1: Откройте Google Apps Script

1. Откройте вашу Google таблицу
2. В меню выберите **Расширения → Apps Script**
3. Откроется редактор кода

## Шаг 2: Найдите функцию doPost

В редакторе кода найдите функцию `doPost(e)`. Она выглядит так:

```javascript
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const data = body.data;
    
    switch(action) {
      // ... существующие case ...
    }
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}
```

## Шаг 3: Добавьте case для удаления и обновления объявлений

Внутри switch statement найдите раздел "// Объявления" и добавьте/обновите эти case:

```javascript
      // Объявления
      case 'createAnnouncement':
        createAnnouncementData(data);
        return jsonResponse({ success: true });
      case 'updateAnnouncement':
        updateAnnouncementData(data['ID'], data);
        return jsonResponse({ success: true });
      case 'deleteAnnouncement':
        Logger.log('🗑️ Получен запрос на удаление объявления с ID: ' + data['ID']);
        const deleteResult = deleteAnnouncementData(data['ID']);
        Logger.log('✅ Результат удаления: ' + JSON.stringify(deleteResult));
        return jsonResponse({ success: true, deleted: deleteResult });
```

**Куда вставлять:** После case 'createAnnouncement' и перед case 'addAuditLog'

## Шаг 4: Добавьте функции для работы с объявлениями

Прокрутите вниз до раздела "// ==================== ОБЪЯВЛЕНИЯ ===================="

Найдите функции:
- `function getAnnouncementsData()`
- `function createAnnouncementData(data)`

**После** функции `createAnnouncementData` добавьте эти две функции:

```javascript
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

function deleteAnnouncementData(id) {
  Logger.log('🔍 Поиск объявления с ID: ' + id);
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
  
  let found = false;
  for (let i = 1; i < data.length; i++) {
    Logger.log('🔎 Проверка строки ' + i + ': ID = ' + data[i][idColumn]);
    if (String(data[i][idColumn]) === String(id)) {
      Logger.log('✅ Найдена строка для удаления: ' + i);
      sheet.deleteRow(i + 1);
      found = true;
      break;
    }
  }
  
  if (!found) {
    Logger.log('❌ Строка с ID ' + id + ' не найдена');
    throw new Error('Объявление с ID ' + id + ' не найдено');
  }
  
  Logger.log('✅ Объявление успешно удалено');
  return { success: true, deletedId: id };
}
```

## Шаг 5: Сохраните код

Нажмите **Ctrl+S** или кнопку 💾 (Save)

## Шаг 6: Создайте новое развёртывание

1. Нажмите **Развернуть → Управление развертываниями**
2. Нажмите на карандаш (✏️) рядом с текущим развертыванием
3. В поле "Версия" выберите **Новая версия**
4. Нажмите **Развернуть**
5. Скопируйте новый URL

## Шаг 7: Обновите URL в приложении

1. Откройте ваше приложение
2. Перейдите в **Настройки**
3. Вставьте новый URL
4. Нажмите **Сохранить**

## Шаг 8: Проверьте работу

1. Откройте консоль браузера (F12)
2. Перейдите в раздел "Сообщения"
3. Нажмите на кнопку удаления 🗑️
4. В консоли должны появиться сообщения:
   - `🗑️ Нажата кнопка удаления для объявления:`
   - `🆔 ID объявления:`
   - `🗑️ Попытка удаления объявления с ID:`
   - `📤 Удаление объявления ID:`
   - `📦 Отправляемые данные:`

## Проверка структуры листа "Объявления"

Убедитесь, что в листе "Объявления" есть следующие столбцы в первой строке:
- **ID** (уникальный идентификатор, например: ANN-1234567890)
- **Заголовок**
- **Текст**
- **Получатели**
- **Кем создано**
- **Дата**
- **Активно** (значения: "ДА" или "НЕТ")

## Если не работает

1. Проверьте логи в Apps Script:
   - Откройте Apps Script
   - Нажмите **Выполнение → Журнал выполнения**
   - Посмотрите ошибки

2. Проверьте консоль браузера (F12):
   - Вкладка Console
   - Посмотрите ошибки JavaScript

3. Проверьте, что URL веб-приложения правильный и актуальный

## Тестовые функции для отладки

Добавьте эти функции в конец файла Apps Script для тестирования:

```javascript
function testDeleteAnnouncement() {
  // Замените на реальный ID из вашей таблицы
  const testId = 'ANN-1234567890';
  
  try {
    const result = deleteAnnouncementData(testId);
    Logger.log('✅ Удаление успешно: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('❌ Ошибка удаления: ' + error.toString());
  }
}

function testUpdateAnnouncement() {
  // Замените на реальный ID из вашей таблицы
  const testId = 'ANN-1234567890';
  const updates = {
    'Заголовок': 'Тестовый заголовок',
    'Текст': 'Тестовый текст'
  };
  
  try {
    const result = updateAnnouncementData(testId, updates);
    Logger.log('✅ Обновление успешно: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('❌ Ошибка обновления: ' + error.toString());
  }
}
```

Запустите эти функции через Apps Script для проверки работы.
