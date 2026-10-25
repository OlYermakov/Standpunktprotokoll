// App-owned text only. Protocol values and saved combinations never enter this catalog.
export const LANGUAGES = ["de", "en", "es", "it", "uk"] as const;
export type Language = typeof LANGUAGES[number];
export const LANGUAGE_NAMES: Record<Language, string> = { de: "Deutsch", en: "English", es: "Español", it: "Italiano", uk: "Українська" };
export const LOCALES: Record<Language, string> = { de: "de-DE", en: "en-GB", es: "es-ES", it: "it-IT", uk: "uk-UA" };
export const LANGUAGE_STORAGE_KEY = "standpunktprotokoll-ui-language";
type TranslationRow = readonly [string, string, string, string, string];

// Column order: German, English, Spanish, Italian, Ukrainian.
export const MESSAGES = {
  stationTime: ["Standpunktzeit", "Station time", "Hora de la estación", "Ora della stazione", "Час станції"],
  pageWeather: ["Wetter je Folgeblatt", "Weather for subsequent sheets", "Tiempo para las hojas siguientes", "Meteo per i fogli successivi", "Погода для наступних аркушів"],
  pageWeatherHint: ["Zeit des ersten Standpunkts prüfen und Temperatur und Luftdruck für jedes Folgeblatt aktualisieren. Ohne Änderung gelten die vorherigen Wetterwerte. Bei älteren Standpunkten die fehlende Zeit ergänzen.", "Check the first station’s time and update temperature and pressure for each subsequent sheet. Unchanged weather values carry over from the previous sheet. Enter missing times for older stations.", "Comprueba la hora de la primera estación y actualiza la temperatura y la presión de cada hoja siguiente. Sin cambios, se mantienen los valores meteorológicos anteriores. Completa las horas que falten en estaciones antiguas.", "Controlla l’ora della prima stazione e aggiorna temperatura e pressione per ogni foglio successivo. Senza modifiche, si mantengono i valori meteo precedenti. Inserisci gli orari mancanti delle stazioni precedenti.", "Перевірте час першої станції та оновіть температуру й тиск для кожного наступного аркуша. Без змін зберігаються попередні погодні значення. Для старих станцій заповніть відсутній час."],
  language: ["Sprache", "Language", "Idioma", "Lingua", "Мова"],
  appTitle: ["Standpunktprotokoll", "Station record", "Registro de estaciones", "Registro delle stazioni", "Протокол станцій"],
  appDescription: ["Offline-Feldprotokoll für Vermessungsarbeiten.", "Offline field records for surveying.", "Registro de campo sin conexión para topografía.", "Registro di campagna offline per il rilievo topografico.", "Офлайн-польовий протокол для геодезичного знімання."],
  fieldLog: ["Feldprotokoll", "Field log", "Registro de campo", "Registro di campagna", "Польовий журнал"],
  loading: ["Protokoll wird vorbereitet…", "Preparing record…", "Preparando registro…", "Preparazione del registro…", "Протокол готується…"],
  aboutAria: ["Über die App und Urheberrecht", "About the app and copyright", "Acerca de la aplicación y derechos de autor", "Informazioni sull’app e copyright", "Про застосунок та авторські права"],
  offlineReady: ["Offline bereit", "Ready offline", "Disponible sin conexión", "Pronto offline", "Офлайн готовий"],
  offlinePreparing: ["Offline wird vorbereitet", "Preparing offline mode", "Preparando modo sin conexión", "Preparazione modalità offline", "Підготовка офлайн"],
  offline: ["Keine Verbindung", "No connection", "Sin conexión", "Nessuna connessione", "Без мережі"],
  enableLight: ["Hellen Feldmodus aktivieren", "Enable daylight mode", "Activar modo claro", "Attiva modalità chiara", "Увімкнути світлий польовий режим"],
  enableDark: ["Dunklen Modus aktivieren", "Enable dark mode", "Activar modo oscuro", "Attiva modalità scura", "Увімкнути темний режим"],
  light: ["Heller Feldmodus", "Daylight mode", "Modo claro", "Modalità chiara", "Світлий польовий режим"],
  dark: ["Dunkler Modus", "Dark mode", "Modo oscuro", "Modalità scura", "Темний режим"],
  values: ["Werte", "Saved values", "Valores", "Valori", "Довідник"],
  protocols: ["Protokolle", "Records", "Registros", "Registri", "Протоколи"],
  protocol: ["Protokoll", "Record", "Registro", "Registro", "Протокол"],
  new: ["+ Neu", "+ New", "+ Nuevo", "+ Nuovo", "+ Новий"],
  offlineSetup: ["Für die Offline-Nutzung vorbereiten", "Prepare for offline use", "Preparar para uso sin conexión", "Prepara per l’uso offline", "Підготувати для роботи без інтернету"],
  homeScreen: ["App zum iPhone-Home-Bildschirm hinzufügen", "Add the app to your iPhone Home Screen", "Añade la aplicación a la pantalla de inicio del iPhone", "Aggiungi l’app alla schermata Home dell’iPhone", "Додай застосунок на початковий екран iPhone"],
  backupReminder: ["Externe Sicherungskopie erstellen", "Create an external backup", "Crear una copia de seguridad externa", "Crea una copia di sicurezza esterna", "Створи зовнішню резервну копію"],
  backupReminderDetail: ["Zusätzlich zu lokalen Sicherungen eine Kopie in „Dateien“ oder iCloud speichern.", "Keep a copy in Files or iCloud in addition to local snapshots.", "Guarda una copia en Archivos o iCloud además de las copias locales.", "Salva una copia in File o iCloud oltre alle istantanee locali.", "Окрім локальних автознімків, збережи копію у «Файли» або iCloud."],
  currentProtocol: ["Aktuelles Protokoll", "Current record", "Registro actual", "Registro attuale", "Поточний протокол"],
  autosave: ["✓ Sicheres Autospeichern", "✓ Local autosave", "✓ Guardado automático local", "✓ Salvataggio automatico locale", "✓ Локальне автозбереження"],
  projectData: ["Projektdaten", "Project details", "Datos del proyecto", "Dati del progetto", "Дані проєкту"],
  fillProject: ["Projektdaten ergänzen", "Enter project details", "Completa los datos del proyecto", "Compila i dati del progetto", "Заповни дані проєкту"],
  project: ["Projekt", "Project", "Proyecto", "Progetto", "Проєкт"],
  projectNumber: ["Projekt-Nr.", "Project no.", "N.º de proyecto", "N. progetto", "№ проєкту"],
  date: ["Datum", "Date", "Fecha", "Data", "Дата"],
  start: ["Beginn", "Start time", "Hora de inicio", "Ora di inizio", "Початок"],
  time: ["Uhrzeit", "Time", "Hora", "Ora", "Час"],
  instrument: ["Instrument", "Instrument", "Instrumento", "Strumento", "Прилад"],
  crew: ["Messtrupp", "Survey crew", "Equipo topográfico", "Squadra di rilievo", "Геодезична бригада"],
  temperature: ["Temperatur", "Temperature", "Temperatura", "Temperatura", "Температура"],
  pressure: ["Luftdruck", "Air pressure", "Presión atmosférica", "Pressione atmosferica", "Атмосферний тиск"],
  fpStatus: ["FP-Netz aktuell abgestimmt", "Control network checked", "Red de apoyo verificada", "Rete di appoggio verificata", "Актуальність опорної мережі узгоджено"],
  fpFile: ["FP-Netz-Datei / Stand", "Control network file / revision", "Archivo de red / revisión", "File della rete / revisione", "Файл опорної мережі / версія"],
  namesPlaceholder: ["Namen / Kürzel", "Names / initials", "Nombres / iniciales", "Nomi / iniziali", "Імена / скорочення"],
  statusPlaceholder: ["Datum / Stand", "Date / revision", "Fecha / revisión", "Data / revisione", "Дата / версія"],
  filePlaceholder: ["Dateiname / Datum", "File name / date", "Nombre de archivo / fecha", "Nome del file / data", "Назва файлу / дата"],
  exampleProject: ["z. B. RK", "e.g. RK", "p. ej. RK", "es. RK", "напр. RK"],
  exampleNumber: ["z. B. 2024-121", "e.g. 2024-121", "p. ej. 2024-121", "es. 2024-121", "напр. 2024-121"],
  exampleInstrument: ["z. B. MS60", "e.g. MS60", "p. ej. MS60", "es. MS60", "напр. MS60"],
  exampleHeight: ["z. B. 0,100", "e.g. 0.100", "p. ej. 0,100", "es. 0,100", "напр. 0,100"],
  datePlaceholder: ["TT.MM.JJJJ", "DD/MM/YYYY", "DD/MM/AAAA", "GG/MM/AAAA", "ДД.ММ.РРРР"],
  timePlaceholder: ["HH:MM", "HH:MM", "HH:MM", "HH:MM", "ГГ:ХХ"],
  heightPlaceholder: ["0,000", "0.000", "0,000", "0,000", "0,000"],
  showLogo: ["Firmenlogo im PDF anzeigen", "Show company logo in PDF", "Mostrar el logotipo de la empresa en el PDF", "Mostra il logo aziendale nel PDF", "Показувати логотип компанії у PDF"],
  logoDetail: ["AIT-Logo und Firmenzusatz ein- oder ausblenden", "Show or hide the AIT logo and company caption", "Mostrar u ocultar el logotipo AIT y su leyenda", "Mostra o nascondi il logo AIT e la dicitura aziendale", "Показує або приховує логотип AIT і підпис компанії"],
  companyCaption: ["Ingenieure im Bauwesen", "Civil engineering", "Ingeniería civil", "Ingegneria civile", "Інженери в будівництві"],
  station: ["Standpunkt", "Station", "Estación", "Stazione", "Станція"],
  stations: ["Standpunkte", "Stations", "Estaciones", "Stazioni", "Станції"],
  stationDetail: ["Jeder Standpunkt wird als eigener Block gespeichert", "Each station is stored as a separate block", "Cada estación se guarda en un bloque independiente", "Ogni stazione viene salvata in un blocco separato", "Кожна станція зберігається окремим блоком"],
  newStation: ["+ Neuer Standpunkt", "+ New station", "+ Nueva estación", "+ Nuova stazione", "+ Нова станція"],
  pointNumber: ["Punktnummer", "Point number", "Número de punto", "Numero del punto", "Номер пункту"],
  instrumentHeight: ["Instrumentenhöhe i [m]", "Instrument height i [m]", "Altura del instrumento i [m]", "Altezza strumentale i [m]", "Висота приладу i [м]"],
  target: ["Zielpunkt", "Target point", "Punto visado", "Punto collimato", "Цільовий пункт"],
  targets: ["Zielpunkte", "Target points", "Puntos visados", "Punti collimati", "Цільові пункти"],
  targetHeight: ["Zielhöhe", "Target height", "Altura del prisma", "Altezza del prisma", "Висота цілі"],
  targetHeightUnit: ["Zielhöhe [m]", "Target height [m]", "Altura del prisma [m]", "Altezza del prisma [m]", "Висота цілі [м]"],
  targetColumns: ["Zielpunkt · RB · AP · Zielhöhe · Bemerkung", "Target point · BS · CP · Height · Remark", "Punto visado · VE · PA · Altura · Observación", "Punto collimato · MI · PA · Altezza · Nota", "Цільовий пункт · ЗН · ПП · Висота · Примітка"],
  add: ["+ Hinzufügen", "+ Add", "+ Añadir", "+ Aggiungi", "+ Додати"],
  edit: ["Bearbeiten", "Edit", "Editar", "Modifica", "Змінити"],
  noRemark: ["ohne Bemerkung", "no remark", "sin observación", "nessuna nota", "без примітки"],
  firstTarget: ["Ersten Zielpunkt hinzufügen", "Add the first target point", "Añadir el primer punto visado", "Aggiungi il primo punto collimato", "Додати перший цільовий пункт"],
  firstTargetDetail: ["Gespeicherte Werte erscheinen im Werteverzeichnis", "Saved values appear in the value list", "Los valores guardados aparecen en la lista", "I valori salvati compaiono nell’elenco", "Після збереження значення з’явиться у довіднику"],
  noTargets: ["Noch keine Zielpunkte", "No target points yet", "Aún no hay puntos visados", "Nessun punto collimato", "Цільові пункти ще не додані"],
  bottomTargetHint: ["Die Zielpunkt-Schaltfläche in der unteren Leiste verwenden", "Use the Target point button in the bottom bar", "Usa el botón Punto visado de la barra inferior", "Usa il pulsante Punto collimato nella barra inferiore", "Використайте кнопку «Цільовий пункт» у нижній панелі"],
  deleteStation: ["Standpunkt löschen", "Delete station", "Eliminar estación", "Elimina stazione", "Видалити станцію"],
  changesSaved: ["Änderungen gespeichert", "Changes saved", "Cambios guardados", "Modifiche salvate", "Зміни збережено"],
  officeReady: ["Bereit fürs Büro", "Ready for the office", "Listo para la oficina", "Pronto per l’ufficio", "Готово для офісу"],
  pdfDetail: ["Querformat mit drei fortlaufenden Spalten. Lange Standpunkte werden automatisch fortgesetzt.", "Landscape layout with three sequential columns. Long stations continue automatically.", "Formato horizontal con tres columnas consecutivas. Las estaciones largas continúan automáticamente.", "Formato orizzontale con tre colonne consecutive. Le stazioni lunghe proseguono automaticamente.", "Альбомна форма з послідовним заповненням трьох стовпців. Довгі станції продовжуються автоматично."],
  quickActions: ["Schnellaktionen", "Quick actions", "Acciones rápidas", "Azioni rapide", "Швидкі дії"],
  pdfRecord: ["PDF-Protokoll", "PDF record", "Registro PDF", "Registro PDF", "PDF-протокол"],
  viewPrint: ["Ansehen und drucken", "View and print", "Ver e imprimir", "Visualizza e stampa", "Перегляд і друк"],
  viewPrintDetail: ["PDF in der Systemansicht öffnen", "Open PDF in the system viewer", "Abrir el PDF en el visor del sistema", "Apri il PDF nel visualizzatore di sistema", "Відкрити стандартний системний перегляд PDF"],
  saveShare: ["Speichern oder teilen", "Save or share", "Guardar o compartir", "Salva o condividi", "Зберегти або переслати"],
  saveShareDetail: ["Datei mit Projektname und Datum weitergeben", "Share the file with its project name and date", "Compartir el archivo con el nombre del proyecto y la fecha", "Condividi il file con nome del progetto e data", "Передати файл із правильною назвою та датою"],
  pdfError: ["PDF konnte nicht erstellt werden. Bitte erneut versuchen.", "Could not create the PDF. Please try again.", "No se pudo crear el PDF. Inténtalo de nuevo.", "Impossibile creare il PDF. Riprova.", "Не вдалося створити PDF. Спробуйте ще раз."],
  editTarget: ["Zielpunkt bearbeiten", "Edit target point", "Editar punto visado", "Modifica punto collimato", "Змінити цільовий пункт"],
  newTarget: ["Neuer Zielpunkt", "New target point", "Nuevo punto visado", "Nuovo punto collimato", "Новий цільовий пункт"],
  recent: ["Letzte Kombinationen", "Recent combinations", "Combinaciones recientes", "Combinazioni recenti", "Останні комбінації"],
  pointPlaceholder: ["Punkt eingeben oder auswählen", "Enter or select a point", "Introduce o selecciona un punto", "Inserisci o seleziona un punto", "Введи або вибери пункт"],
  pointType: ["Punktart", "Point type", "Tipo de punto", "Tipo di punto", "Тип пункту"],
  noPointType: ["Keine Punktart", "No point type", "Sin tipo de punto", "Nessun tipo di punto", "Без типу пункту"],
  backsight: ["Rückblick", "Backsight", "Visual de espalda", "Mira indietro", "Зворотний напрямок"],
  connection: ["Anschlusspunkt", "Control point", "Punto de apoyo", "Punto di appoggio", "Пункт прив’язки"],
  rbHint: ["Diesen Zielpunkt als Rückblick markieren", "Mark this target point as a backsight", "Marcar este punto como visual de espalda", "Segna questo punto come mira indietro", "Позначити цей цільовий пункт як зворотний напрямок"],
  apHint: ["Diesen Zielpunkt als Anschlusspunkt markieren", "Mark this target as a control point", "Marcar este punto como punto de apoyo", "Segna questo punto come punto di appoggio", "Позначити цей цільовий пункт як пункт прив’язки"],
  prismSelection: ["Prismenauswahl", "Prism selection", "Selección de prisma", "Selezione del prisma", "Вибір призми"],
  customRemark: ["Eigene Bemerkung", "Custom remark", "Observación personalizada", "Nota personalizzata", "Власна примітка"],
  remark: ["Bemerkung", "Remark", "Observación", "Nota", "Примітка"],
  remarkPlaceholder: ["Eigene Abkürzung / Bemerkung", "Custom abbreviation / remark", "Abreviatura / observación propia", "Abbreviazione / nota personale", "Власне скорочення / примітка"],
  select: ["Auswählen", "Select", "Seleccionar", "Seleziona", "Вибрати"],
  previous: ["Früher verwendet", "Previously used", "Usado anteriormente", "Usato in precedenza", "Використано раніше"],
  other: ["Andere…", "Other…", "Otro…", "Altro…", "Інше…"],
  enterRemark: ["Eigene Bemerkung eingeben", "Enter a custom remark", "Introduce una observación", "Inserisci una nota personale", "Ввести власну примітку"],
  cancel: ["Abbrechen", "Cancel", "Cancelar", "Annulla", "Скасувати"],
  save: ["Speichern", "Save", "Guardar", "Salva", "Зберегти"],
  saveTarget: ["Zielpunkt speichern", "Save target point", "Guardar punto visado", "Salva punto collimato", "Зберегти цільовий пункт"],
  delete: ["Löschen", "Delete", "Eliminar", "Elimina", "Видалити"],
  deleteItem: ["{name} löschen", "Delete {name}", "Eliminar {name}", "Elimina {name}", "Видалити {name}"],
  deleteStationTitle: ["Standpunkt löschen?", "Delete station?", "¿Eliminar estación?", "Eliminare la stazione?", "Видалити станцію?"],
  deleteTargetTitle: ["Zielpunkt löschen?", "Delete target point?", "¿Eliminar punto visado?", "Eliminare il punto collimato?", "Видалити цільовий пункт?"],
  deleteProtocolTitle: ["Protokoll löschen?", "Delete record?", "¿Eliminar registro?", "Eliminare il registro?", "Видалити протокол?"],
  deleteStationBody: ["Der Standpunkt einschließlich aller Zielpunkte ({count}) wird aus dem Protokoll gelöscht.", "The station and all its target points ({count}) will be deleted from this record.", "Se eliminará del registro la estación y todos sus puntos visados ({count}).", "La stazione e tutti i suoi punti collimati ({count}) saranno eliminati dal registro.", "Станцію та всі її цільові пункти ({count}) буде видалено з протоколу."],
  deleteTargetBody: ["Der Punkt wird aus dem Standpunkt {name} gelöscht.", "The point will be removed from station {name}.", "Se eliminará el punto de la estación {name}.", "Il punto sarà eliminato dalla stazione {name}.", "Пункт буде видалено зі станції {name}."],
  deleteProtocolBody: ["Das Protokoll mit {stations} Standpunkten und {targets} Zielpunkten wird gelöscht.", "The record containing {stations} stations and {targets} target points will be deleted.", "Se eliminará el registro con {stations} estaciones y {targets} puntos visados.", "Sarà eliminato il registro con {stations} stazioni e {targets} punti collimati.", "Буде видалено протокол: станцій — {stations}, цільових пунктів — {targets}."],
  beforeDelete: ["Vor dem Löschen wird der aktuelle Stand automatisch gesichert.", "A snapshot is saved automatically before deletion.", "Antes de eliminar se guarda una copia automática.", "Prima dell’eliminazione viene salvata un’istantanea automatica.", "Перед видаленням поточний стан автоматично збережеться у знімках."],
  deleteProtocol: ["Protokoll löschen", "Delete record", "Eliminar registro", "Elimina registro", "Видалити протокол"],
  dataProtection: ["Datensicherung", "Data protection", "Protección de datos", "Protezione dei dati", "Захист даних"],
  backupSummary: ["Kopien, Sicherungsstände und Wiederherstellung", "Backups, snapshots and recovery", "Copias de seguridad, instantáneas y restauración", "Copie, istantanee e ripristino", "Копії, автознімки та відновлення"],
  newProtocol: ["Neues Protokoll", "New record", "Nuevo registro", "Nuovo registro", "Новий протокол"],
  carryHint: ["Projekt und Instrument werden übernommen", "Project and instrument are carried over", "Se conservan el proyecto y el instrumento", "Progetto e strumento vengono mantenuti", "Проєкт та інструмент будуть перенесені"],
  active: ["Geöffnet", "Open", "Abierto", "Aperto", "Відкрито"],
  localStorageTitle: ["Daten werden in zwei lokalen Speichern gesichert", "Data is saved in two local stores", "Los datos se guardan en dos almacenamientos locales", "I dati sono salvati in due archivi locali", "Дані зберігаються у двох локальних сховищах"],
  localStorageDetail: ["IndexedDB ist der Hauptspeicher, localStorage eine zusätzliche lokale Kopie. Beide funktionieren offline.", "IndexedDB is the main store; localStorage is an additional local copy. Both work offline.", "IndexedDB es el almacenamiento principal; localStorage guarda una copia local adicional. Ambos funcionan sin conexión.", "IndexedDB è l’archivio principale; localStorage contiene una copia locale aggiuntiva. Entrambi funzionano offline.", "IndexedDB — основне сховище, localStorage — додаткова локальна копія. Обидва працюють офлайн."],
  fileBackup: ["Kopie in „Dateien“ / iCloud", "Backup in Files / iCloud", "Copia en Archivos / iCloud", "Copia in File / iCloud", "Копія у «Файли» / iCloud"],
  lastBackup: ["Letzte Kopie", "Last backup", "Última copia", "Ultima copia", "Остання копія"],
  createBackup: ["Kopie erstellen", "Create backup", "Crear copia", "Crea copia", "Створити копію"],
  restoreFile: ["Aus Datei wiederherstellen", "Restore from file", "Restaurar desde archivo", "Ripristina da file", "Відновити з файлу"],
  backupExplainer: ["Auf dem iPhone im Teilen-Menü „In Dateien sichern“ wählen.", "On iPhone, choose Save to Files in the Share menu.", "En iPhone, selecciona Guardar en Archivos en el menú Compartir.", "Su iPhone, scegli Salva su File nel menu Condividi.", "На iPhone відкриється меню «Поділитися» — обери «Зберегти у Файли»."],
  snapshots: ["Automatische Sicherungsstände", "Automatic snapshots", "Instantáneas automáticas", "Istantanee automatiche", "Автоматичні знімки"],
  snapshotLimit: ["Bis zu {count} letzte Stände auf diesem Gerät", "Up to {count} recent snapshots on this device", "Hasta {count} instantáneas recientes en este dispositivo", "Fino a {count} istantanee recenti su questo dispositivo", "До {count} останніх станів на цьому пристрої"],
  restore: ["Wiederherstellen", "Restore", "Restaurar", "Ripristina", "Відновити"],
  noSnapshots: ["Nach der ersten Eingabe eines Punkts oder einer Projektnummer wird automatisch ein Sicherungsstand erstellt.", "A snapshot is created after you enter the first point or project number.", "Se crea una instantánea al introducir el primer punto o número de proyecto.", "Un’istantanea viene creata dopo l’inserimento del primo punto o numero di progetto.", "Знімок з’явиться автоматично після першого введеного пункту або номера проєкту."],
  notCreated: ["Noch nicht erstellt", "Not yet created", "Aún no creada", "Non ancora creata", "Ще не створено"],
  backupCreated: ["Sicherungskopie erstellt. In „Dateien“ oder iCloud Drive speichern.", "Backup created. Save it in Files or iCloud Drive.", "Copia creada. Guárdala en Archivos o iCloud Drive.", "Copia creata. Salvala in File o iCloud Drive.", "Резервну копію створено. Збережи її у «Файли» або iCloud Drive."],
  backupFailed: ["Die Datei konnte nicht erstellt werden. Erneut versuchen.", "Could not create the file. Try again.", "No se pudo crear el archivo. Inténtalo de nuevo.", "Impossibile creare il file. Riprova.", "Не вдалося створити файл. Спробуй ще раз."],
  backupInvalid: ["Keine gültige Standpunktprotokoll-Sicherung oder die Datei ist beschädigt.", "This is not a valid Standpunktprotokoll backup, or the file is damaged.", "No es una copia válida de Standpunktprotokoll o el archivo está dañado.", "Non è una copia valida di Standpunktprotokoll oppure il file è danneggiato.", "Цей файл не є резервною копією Standpunktprotokoll або він пошкоджений."],
  restoreConfirm: ["{count} Protokolle aus Datei wiederherstellen? Der aktuelle Stand bleibt in den Sicherungsständen erhalten.", "Restore {count} records from this file? The current state will remain in snapshots.", "¿Restaurar {count} registros del archivo? El estado actual quedará en las instantáneas.", "Ripristinare {count} registri dal file? Lo stato attuale resterà nelle istantanee.", "Відновити протоколи з файлу ({count})? Поточний стан залишиться в автоматичних знімках."],
  restored: ["Protokolle aus Datei wiederhergestellt: {count}.", "Records restored from file: {count}.", "Registros restaurados: {count}.", "Registri ripristinati: {count}.", "Відновлено протоколів із файлу: {count}."],
  snapshotConfirm: ["Stand vom {date} wiederherstellen? Der aktuelle Stand wird ebenfalls gesichert.", "Restore the snapshot from {date}? The current state will also be saved.", "¿Restaurar el estado del {date}? También se guardará el estado actual.", "Ripristinare lo stato del {date}? Sarà salvato anche lo stato attuale.", "Повернути стан на {date}? Поточний стан також буде збережено."],
  snapshotRestored: ["Stand vom {date} wiederhergestellt.", "Snapshot from {date} restored.", "Estado del {date} restaurado.", "Stato del {date} ripristinato.", "Стан відновлено на {date}."],
  valueDirectory: ["Werteverzeichnis", "Saved value list", "Lista de valores guardados", "Elenco dei valori salvati", "Довідник значень"],
  valueHint: ["Änderungen gelten für künftige Vorschläge, nicht für bestehende Protokolle.", "Changes affect future suggestions, not existing records.", "Los cambios afectan a futuras sugerencias, no a registros existentes.", "Le modifiche valgono per i suggerimenti futuri, non per i registri esistenti.", "Зміни впливають на майбутні підказки, але не змінюють уже записані протоколи."],
  rememberRb: ["RB mit dieser Kombination speichern", "Save BS with this combination", "Guardar VE con esta combinación", "Salva MI con questa combinazione", "Зберігати ЗН разом із цією комбінацією"],
  rememberAp: ["AP mit dieser Kombination speichern", "Save CP with this combination", "Guardar PA con esta combinación", "Salva PA con questa combinazione", "Зберігати ПП разом із цією комбінацією"],
  emptyValues: ["Noch keine gespeicherten Werte", "No saved values yet", "Aún no hay valores guardados", "Nessun valore salvato", "Довідник поки порожній"],
  emptyValuesHint: ["Beim ersten Zielpunkt wird die Kombination automatisch gespeichert.", "Add a target point to save its combination automatically.", "Añade un punto visado para guardar su combinación automáticamente.", "Aggiungi un punto collimato per salvare automaticamente la combinazione.", "Додай перший цільовий пункт — комбінація збережеться автоматично."],
  savedSuggestions: ["{label}: gespeicherte Werte", "{label}: saved values", "{label}: valores guardados", "{label}: valori salvati", "{label}: збережені значення"],
  close: ["Schließen", "Close", "Cerrar", "Chiudi", "Закрити"],
  understood: ["Verstanden", "Got it", "Entendido", "Ho capito", "Зрозуміло"],
  offlineIphone: ["Offline auf dem iPhone", "Offline on iPhone", "Sin conexión en iPhone", "Offline su iPhone", "Офлайн на iPhone"],
  iphone1: ["Diese Seite in Safari öffnen.", "Open this page in Safari.", "Abre esta página en Safari.", "Apri questa pagina in Safari.", "Відкрий цю сторінку в Safari."],
  iphone2: ["Auf „Teilen“ tippen.", "Tap Share.", "Pulsa Compartir.", "Tocca Condividi.", "Натисни «Поділитися»."],
  iphone3: ["„Zum Home-Bildschirm“ wählen und bestätigen.", "Choose Add to Home Screen and confirm.", "Elige Añadir a pantalla de inicio y confirma.", "Scegli Aggiungi alla schermata Home e conferma.", "Обери «На початковий екран» і підтвердь."],
  offlineInstall: ["Die App nach der Installation einmal mit Internetverbindung öffnen, um den Offline-Modus vorzubereiten.", "After installation, open the app once online to prepare offline mode.", "Tras instalar, abre la aplicación una vez con conexión para preparar el modo sin conexión.", "Dopo l’installazione, apri l’app una volta con Internet per preparare la modalità offline.", "Після встановлення один раз відкрийте застосунок з інтернетом, щоб підготувати офлайн-режим."],
  about: ["Über die App", "About the app", "Acerca de la aplicación", "Informazioni sull’app", "Про застосунок"],
  version: ["Version {version}", "Version {version}", "Versión {version}", "Versione {version}", "Версія {version}"],
  author: ["Entwickelt von Oleksii Yermakov.", "Developed by Oleksii Yermakov.", "Desarrollado por Oleksii Yermakov.", "Sviluppato da Oleksii Yermakov.", "Розроблено Олексієм Єрмаковим."],
  copyright: ["© 2026 Oleksii Yermakov. Alle Rechte vorbehalten.", "© 2026 Oleksii Yermakov. All rights reserved.", "© 2026 Oleksii Yermakov. Todos los derechos reservados.", "© 2026 Oleksii Yermakov. Tutti i diritti riservati.", "© 2026 Oleksii Yermakov. Усі права захищені."],
  usageTerms: ["Die App ist ein unterstützendes Arbeitswerkzeug. Nutzer prüfen eingegebene Daten und erstellte Protokolle. Die Daten bleiben lokal auf dem Gerät.", "This app is a supporting work tool. Users must verify entered data and generated records. Data is stored locally on the device.", "Esta aplicación es una herramienta auxiliar. El usuario debe comprobar los datos introducidos y los registros generados. Los datos se guardan localmente en el dispositivo.", "L’app è uno strumento di supporto. L’utente deve verificare i dati inseriti e i registri generati. I dati sono salvati localmente sul dispositivo.", "Застосунок є допоміжним робочим інструментом. Користувач перевіряє правильність введених даних і створених протоколів. Дані зберігаються локально на пристрої."],
  restrictions: ["Kopieren des Codes, Änderungen, erneute Veröffentlichung, Weiterverkauf oder kommerzielle Verbreitung ohne schriftliche Zustimmung des Autors sind untersagt.", "Copying the code, modification, republication, resale or commercial distribution without the author’s written consent is prohibited.", "Se prohíben la copia del código, modificación, republicación, reventa o distribución comercial sin el consentimiento escrito del autor.", "Sono vietate la copia del codice, modifica, ripubblicazione, rivendita o distribuzione commerciale senza il consenso scritto dell’autore.", "Копіювання коду, модифікація, повторна публікація, перепродаж або комерційне розповсюдження без письмової згоди автора заборонені."],
  instructions: ["Anleitung", "Instructions", "Instrucciones", "Istruzioni", "Інструкція"],
  instructionIntro: ["Schrittweise Hilfe zu allen Hauptfunktionen.", "Step-by-step help for all main features.", "Ayuda paso a paso para todas las funciones principales.", "Guida passo passo alle funzioni principali.", "Покрокова довідка з усіх основних функцій застосунку."],
  openInstructions: ["Anleitung öffnen", "Open instructions", "Abrir instrucciones", "Apri le istruzioni", "Відкрити інструкцію"],
  install: ["App installieren", "Install the app", "Instalar la aplicación", "Installa l’app", "Встановлення застосунку"],
  iphoneInstall: ["Safari → Teilen → Zum Home-Bildschirm → Hinzufügen.", "Safari → Share → Add to Home Screen → Add.", "Safari → Compartir → Añadir a pantalla de inicio → Añadir.", "Safari → Condividi → Aggiungi alla schermata Home → Aggiungi.", "Safari → «Поділитися» → «На початковий екран» → «Додати»."],
  androidInstall: ["Chrome → Menü ⋮ → App installieren oder Zum Startbildschirm hinzufügen.", "Chrome → menu ⋮ → Install app or Add to Home screen.", "Chrome → menú ⋮ → Instalar aplicación o Añadir a pantalla de inicio.", "Chrome → menu ⋮ → Installa app o Aggiungi a schermata Home.", "Chrome → меню ⋮ → «Встановити застосунок» або «Додати на головний екран»."],
  closeInstructions: ["Anleitung schließen", "Close instructions", "Cerrar instrucciones", "Chiudi le istruzioni", "Закрити інструкцію"],
  pageNumber: ["Seite: {page} von {total}", "Page: {page} of {total}", "Página: {page} de {total}", "Pagina: {page} di {total}", "Сторінка: {page} із {total}"],
  stationHeader: ["Standpunkt / i-Höhe", "Station / inst. height", "Estación / altura instr.", "Stazione / altezza str.", "Станція / вис. приладу"],
  leicaConstant: ["Leica-Konstante: {value} mm", "Leica constant: {value} mm", "Constante Leica: {value} mm", "Costante Leica: {value} mm", "Константа Leica: {value} мм"],
  prismP360: ["Leica 360° Prisma", "Leica 360° prism", "Prisma Leica 360°", "Prisma Leica 360°", "Призма Leica 360°"],
  prismHDS: ["Leica HDS Zielmarke", "Leica HDS target", "Diana Leica HDS", "Mira Leica HDS", "Марка Leica HDS"],
  prismMPR122: ["Leica MPR122", "Leica MPR122", "Leica MPR122", "Leica MPR122", "Leica MPR122"],
  prismMP: ["Leica Miniprisma", "Leica mini prism", "Miniprisma Leica", "Miniprisma Leica", "Мініпризма Leica"],
  prismMP0: ["Leica Miniprisma 0", "Leica mini prism 0", "Miniprisma Leica 0", "Miniprisma Leica 0", "Мініпризма Leica 0"],
  prismMP360: ["Leica Miniprisma 360°", "Leica 360° mini prism", "Miniprisma Leica 360°", "Miniprisma Leica 360°", "Мініпризма Leica 360°"],
  prismRF: ["Leica Reflexfolie", "Leica reflective foil", "Lámina reflectante Leica", "Pellicola riflettente Leica", "Відбивна плівка Leica"],
  prismRP: ["Leica Rundprisma", "Leica round prism", "Prisma circular Leica", "Prisma circolare Leica", "Кругла призма Leica"],
  prismOP: ["Ohne Prisma", "Reflectorless", "Sin prisma", "Senza prisma", "Без призми"],
  typeGVP: ["Gleisvermarkungspunkt", "Track reference point", "Punto de referencia de vía", "Punto di riferimento del binario", "Пункт закріплення колії"],
  typeBGVP: ["Boden-Gleisvermarkungspunkt", "Ground-level track reference point", "Punto de referencia de vía en el suelo", "Punto di riferimento del binario a terra", "Ґрунтовий пункт закріплення колії"],
  typeBVP: ["Bodenvermarkungspunkt", "Ground monument point", "Punto materializado en el suelo", "Punto materializzato a terra", "Ґрунтовий пункт закріплення"],
  typeGKP: ["Gleiskontrollpunkt", "Track control point", "Punto de control de vía", "Punto di controllo del binario", "Пункт контролю колії"],
  typeSP: ["Standpunkt", "Instrument station", "Estación del instrumento", "Stazione strumentale", "Станція встановлення приладу"],
  typePS0: ["Grundnetzpunkt", "Primary network point", "Punto de la red principal", "Punto della rete principale", "Пункт основної мережі"],
  typePS1: ["Basispunkt", "Base point", "Punto base", "Punto base", "Базисний пункт"],
  typePS2: ["Lagefestpunkt", "Horizontal control point", "Punto de apoyo planimétrico", "Punto di appoggio planimetrico", "Плановий опорний пункт"],
  typePS3: ["Höhenfestpunkt", "Vertical control point", "Punto de apoyo altimétrico", "Punto di appoggio altimetrico", "Висотний опорний пункт"],
} as const satisfies Record<string, TranslationRow>;

export type MessageKey = keyof typeof MESSAGES;
export type MessageParams = Record<string, string | number>;
export function isLanguage(value: unknown): value is Language { return LANGUAGES.includes(value as Language); }
export function translate(language: Language, key: MessageKey, params: MessageParams = {}): string {
  return MESSAGES[key][LANGUAGES.indexOf(language)].replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
}
export function formatDate(value: string, language: Language): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}${language === "de" || language === "uk" ? "." : "/"}${month}${language === "de" || language === "uk" ? "." : "/"}${year}`;
}
export function formatBackupDate(value: string | undefined, language: Language): string {
  const date = value ? new Date(value) : null;
  return !date || Number.isNaN(date.getTime()) ? translate(language, "notCreated")
    : new Intl.DateTimeFormat(LOCALES[language], {dateStyle:"medium", timeStyle:"short", hour12:false}).format(date);
}
const COUNT_WORDS = {
  station: {de:["Standpunkt","Standpunkte"],en:["station","stations"],es:["estación","estaciones"],it:["stazione","stazioni"],uk:["станція","станції","станцій"]},
  target: {de:["Zielpunkt","Zielpunkte"],en:["target point","target points"],es:["punto visado","puntos visados"],it:["punto collimato","punti collimati"],uk:["цільовий пункт","цільові пункти","цільових пунктів"]},
  protocol: {de:["Protokoll","Protokolle"],en:["record","records"],es:["registro","registros"],it:["registro","registri"],uk:["протокол","протоколи","протоколів"]},
} as const;
export function countLabel(count: number, kind: keyof typeof COUNT_WORDS, language: Language): string {
  const rule = new Intl.PluralRules(LOCALES[language]).select(count);
  const words = COUNT_WORDS[kind][language];
  return `${count} ${words[rule === "one" ? 0 : language === "uk" && rule !== "few" ? 2 : 1]}`;
}
export const PRISMS = [
  ["P360","prismP360",23.1], ["HDS","prismHDS",34.4], ["MPR122","prismMPR122",28.1],
  ["MP","prismMP",17.5], ["MP0","prismMP0",0], ["MP360","prismMP360",30],
  ["RF","prismRF",34.4], ["RP","prismRP",0], ["OP","prismOP",34.4],
] as const;
// Display abbreviations in DE / EN / ES / IT / UK. HDS and MPR122 are
// manufacturer designations, so they stay unchanged in every language.
const PRISM_ABBREVIATIONS: Record<(typeof PRISMS)[number][0], TranslationRow> = {
  P360: ["P360", "P360", "P360", "P360", "П360"],
  HDS: ["HDS", "HDS", "HDS", "HDS", "HDS"],
  MPR122: ["MPR122", "MPR122", "MPR122", "MPR122", "MPR122"],
  MP: ["MP", "MP", "MP", "MP", "МП"],
  MP0: ["MP0", "MP0", "MP0", "MP0", "МП0"],
  MP360: ["MP360", "MP360", "MP360", "MP360", "МП360"],
  RF: ["RF", "RF", "LR", "PR", "ВП"],
  RP: ["RP", "RP", "PC", "PC", "КП"],
  OP: ["OP", "RL", "SP", "SP", "БП"],
};
// Only exact built-in prism values are display codes. Never translate parts
// of free text, point codes or model names, or write translated labels to data.
export function prismAbbreviation(code: string, language: Language): string {
  return Object.hasOwn(PRISM_ABBREVIATIONS, code)
    ? PRISM_ABBREVIATIONS[code as keyof typeof PRISM_ABBREVIATIONS][LANGUAGES.indexOf(language)]
    : code;
}
export function prismLegendAbbreviation(code: string, language: Language): string {
  const label = prismAbbreviation(code, language);
  return label === code ? code : `${label} (${code})`;
}
export const POINT_TYPES = ["GVP","BGVP","BVP","GKP","SP","PS0","PS1","PS2","PS3"] as const;
const ABBREVIATIONS: Record<string, TranslationRow> = {
  GVP: ["GVP", "TRP", "PRV", "PRB", "ПЗК"],
  BGVP: ["BGVP", "GTRP", "PRVS", "PRBT", "ҐПЗК"],
  BVP: ["BVP", "GMP", "PMS", "PMT", "ҐПЗ"],
  GKP: ["GKP", "TCP", "PCV", "PCB", "ПКК"],
  SP: ["SP", "ST", "EST", "ST", "СТ"],
  RB: ["RB", "BS", "VE", "MI", "ЗН"],
  AP: ["AP", "CP", "PA", "PA", "ПП"],
};
// Translate display labels only; stored codes and user-entered strings stay intact.
export function abbreviation(code: string, language: Language): string {
  return Object.hasOwn(ABBREVIATIONS, code) ? ABBREVIATIONS[code][LANGUAGES.indexOf(language)] : code;
}
export function legendAbbreviation(code: string, language: Language): string {
  const label = abbreviation(code, language);
  return label === code ? code : `${label} (${code})`;
}
export function prismConstant(value: number, language: Language) {
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat(LOCALES[language], {minimumFractionDigits:1,maximumFractionDigits:1}).format(value)}`;
}
export function remarkChoices(language: Language) {
  return PRISMS.map(([value,key,constant]) => ({
    value,
    name: translate(language,key),
    label: `${prismAbbreviation(value,language)} · ${translate(language,key)}`,
    detail: translate(language,"leicaConstant",{value:prismConstant(constant,language)}),
  }));
}
export function pointTypeChoices(language: Language) {
  return POINT_TYPES.map(value=>({value,label:abbreviation(value,language),detail:translate(language,`type${value}`)}));
}
