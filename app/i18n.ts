// App-owned text only. Protocol values and saved combinations never enter this catalog.
export const LANGUAGES = ["de", "en", "es", "it", "uk", "fr", "pl"] as const;
export type Language = typeof LANGUAGES[number];
export const LANGUAGE_NAMES: Record<Language, string> = { de: "Deutsch", en: "English", es: "Español", it: "Italiano", uk: "Українська", fr: "Français", pl: "Polski" };
export const LOCALES: Record<Language, string> = { de: "de-DE", en: "en-GB", es: "es-ES", it: "it-IT", uk: "uk-UA", fr: "fr-FR", pl: "pl-PL" };
export const LANGUAGE_STORAGE_KEY = "standpunktprotokoll-ui-language";
type TranslationRow = readonly [string, string, string, string, string, string, string];

// Column order: German, English, Spanish, Italian, Ukrainian, French, Polish.
export const MESSAGES = {
  stationTime: ["Standpunktzeit", "Station time", "Hora de la estación", "Ora della stazione", "Час станції", "Heure de la station", "Czas stanowiska"],
  pageWeather: ["Wetter je Folgeblatt", "Weather for subsequent sheets", "Tiempo para las hojas siguientes", "Meteo per i fogli successivi", "Погода для наступних аркушів", "Météo des feuilles suivantes", "Pogoda dla kolejnych arkuszy"],
  pageWeatherHint: ["Zeit des ersten Standpunkts prüfen und Temperatur und Luftdruck für jedes Folgeblatt aktualisieren. Ohne Änderung gelten die vorherigen Wetterwerte. Bei älteren Standpunkten die fehlende Zeit ergänzen.", "Check the first station’s time and update temperature and pressure for each subsequent sheet. Unchanged weather values carry over from the previous sheet. Enter missing times for older stations.", "Comprueba la hora de la primera estación y actualiza la temperatura y la presión de cada hoja siguiente. Sin cambios, se mantienen los valores meteorológicos anteriores. Completa las horas que falten en estaciones antiguas.", "Controlla l’ora della prima stazione e aggiorna temperatura e pressione per ogni foglio successivo. Senza modifiche, si mantengono i valori meteo precedenti. Inserisci gli orari mancanti delle stazioni precedenti.", "Перевірте час першої станції та оновіть температуру й тиск для кожного наступного аркуша. Без змін зберігаються попередні погодні значення. Для старих станцій заповніть відсутній час.", "Vérifiez l’heure de la première station et mettez à jour la température et la pression pour chaque feuille suivante. Les valeurs météo inchangées sont reprises de la feuille précédente. Saisissez les heures manquantes des anciennes stations.", "Sprawdź czas pierwszego stanowiska i zaktualizuj temperaturę oraz ciśnienie dla każdego kolejnego arkusza. Niezmienione wartości pogodowe są przenoszone z poprzedniego arkusza. Uzupełnij brakujące czasy starszych stanowisk."],
  language: ["Sprache", "Language", "Idioma", "Lingua", "Мова", "Langue", "Język"],
  appTitle: ["Standpunktprotokoll", "Station record", "Registro de estaciones", "Registro delle stazioni", "Протокол станцій", "Registre de stations", "Protokół stanowisk"],
  appDescription: ["Offline-Feldprotokoll für Vermessungsarbeiten.", "Offline field records for surveying.", "Registro de campo sin conexión para topografía.", "Registro di campagna offline per il rilievo topografico.", "Офлайн-польовий протокол для геодезичного знімання.", "Registres de terrain hors ligne pour la topographie.", "Protokoły polowe offline dla geodezji."],
  fieldLog: ["Feldprotokoll", "Field log", "Registro de campo", "Registro di campagna", "Польовий журнал", "Carnet de terrain", "Dziennik polowy"],
  loading: ["Protokoll wird vorbereitet…", "Preparing record…", "Preparando registro…", "Preparazione del registro…", "Протокол готується…", "Préparation du registre…", "Przygotowanie protokołu…"],
  aboutAria: ["Über die App und Urheberrecht", "About the app and copyright", "Acerca de la aplicación y derechos de autor", "Informazioni sull’app e copyright", "Про застосунок та авторські права", "À propos de l’app et droits d’auteur", "O aplikacji i prawach autorskich"],
  offlineReady: ["Offline bereit", "Ready offline", "Disponible sin conexión", "Pronto offline", "Офлайн готовий", "Prêt hors ligne", "Gotowa offline"],
  offlinePreparing: ["Offline wird vorbereitet", "Preparing offline mode", "Preparando modo sin conexión", "Preparazione modalità offline", "Підготовка офлайн", "Préparation du mode hors ligne", "Przygotowanie trybu offline"],
  offline: ["Keine Verbindung", "No connection", "Sin conexión", "Nessuna connessione", "Без мережі", "Pas de connexion", "Brak połączenia"],
  enableLight: ["Hellen Feldmodus aktivieren", "Enable daylight mode", "Activar modo claro", "Attiva modalità chiara", "Увімкнути світлий польовий режим", "Activer le mode jour", "Włącz tryb dzienny"],
  enableDark: ["Dunklen Modus aktivieren", "Enable dark mode", "Activar modo oscuro", "Attiva modalità scura", "Увімкнути темний режим", "Activer le mode sombre", "Włącz tryb ciemny"],
  light: ["Heller Feldmodus", "Daylight mode", "Modo claro", "Modalità chiara", "Світлий польовий режим", "Mode jour", "Tryb dzienny"],
  dark: ["Dunkler Modus", "Dark mode", "Modo oscuro", "Modalità scura", "Темний режим", "Mode sombre", "Tryb ciemny"],
  settings: ["Einstellungen", "Settings", "Ajustes", "Impostazioni", "Налаштування", "Réglages", "Ustawienia"],
  projectFields: ["Felder der Projektdaten", "Project detail fields", "Campos del proyecto", "Campi del progetto", "Поля даних проєкту", "Champs du projet", "Pola danych projektu"],
  projectFieldsHint: ["Ausgeschaltete Felder erscheinen weder im Formular noch im PDF. Projekt und Datum bleiben immer sichtbar. Bereits eingetragene Werte bleiben gespeichert.", "Fields that are switched off appear neither in the form nor in the PDF. Project and date always stay. Values already entered are kept.", "Los campos desactivados no aparecen ni en el formulario ni en el PDF. Proyecto y fecha siempre se muestran. Los valores ya introducidos se conservan.", "I campi disattivati non compaiono né nel modulo né nel PDF. Progetto e data restano sempre. I valori già inseriti vengono conservati.", "Вимкнені поля не показуються ні у формі, ні в PDF. Проєкт і дата лишаються завжди. Уже введені значення зберігаються.", "Les champs désactivés n’apparaissent ni dans le formulaire ni dans le PDF. Le projet et la date restent toujours. Les valeurs déjà saisies sont conservées.", "Wyłączone pola nie pojawiają się ani w formularzu, ani w PDF. Projekt i data zostają zawsze. Wpisane już wartości są zachowane."],
  standardPointTypes: ["Standard-Punktarten", "Standard point types", "Tipos de punto estándar", "Tipi di punto standard", "Стандартні типи пунктів", "Types de point standard", "Standardowe typy punktów"],
  standardPointTypesHint: ["Ausgeschaltete Punktarten werden bei der Auswahl nicht angeboten. Vorhandene Zielpunkte behalten ihre Punktart.", "Switched-off types are not offered when choosing a point type. Existing target points keep their type.", "Los tipos desactivados no se ofrecen al elegir. Los puntos existentes conservan su tipo.", "I tipi disattivati non vengono proposti nella scelta. I punti esistenti mantengono il loro tipo.", "Вимкнені типи не пропонуються під час вибору. Наявні цільові пункти зберігають свій тип.", "Les types désactivés ne sont pas proposés lors du choix. Les points visés existants conservent leur type.", "Wyłączone typy nie są proponowane przy wyborze. Istniejące punkty celu zachowują swój typ."],
  noCustomPointTypes: ["Noch keine. Eigene Punktarten legen Sie beim Zielpunkt über „Eigene Punktart“ an.", "None yet. Create one when adding a target point via Custom point type.", "Ninguno aún. Créalos al añadir un punto con Tipo de punto propio.", "Nessuno. Creali aggiungendo un punto con Tipo di punto personale.", "Поки немає. Створіть його під час додавання цільового пункту через «Власний тип пункту».", "Aucun pour l’instant. Créez-en un en ajoutant un point visé via « Type de point personnalisé ».", "Na razie brak. Utwórz go przy dodawaniu punktu celu przez „Własny typ punktu”."],
  remove: ["Entfernen", "Remove", "Quitar", "Rimuovi", "Видалити", "Supprimer", "Usuń"],
  menu: ["Menü", "Menu", "Menú", "Menu", "Меню", "Menu", "Menu"],
  help: ["Hilfe", "Help", "Ayuda", "Guida", "Довідка", "Aide", "Pomoc"],
  theme: ["Design", "Theme", "Tema", "Tema", "Тема", "Thème", "Motyw"],
  themeDark: ["Dunkel", "Dark", "Oscuro", "Scuro", "Темна", "Sombre", "Ciemny"],
  themeLight: ["Hell", "Light", "Claro", "Chiaro", "Світла", "Clair", "Jasny"],
  themeAuto: ["Auto", "Auto", "Auto", "Auto", "Авто", "Auto", "Auto"],
  backupMenu: ["Datensicherung", "Backup", "Copia de seguridad", "Backup", "Резервна копія", "Sauvegarde", "Kopia zapasowa"],
  backupNeededBadge: ["Fällig", "Needed", "Pendiente", "Necessario", "Потрібна", "À faire", "Potrzebna"],
  values: ["Werte", "Saved values", "Valores", "Valori", "Довідник", "Valeurs enregistrées", "Zapisane wartości"],
  protocols: ["Protokolle", "Records", "Registros", "Registri", "Протоколи", "Registres", "Protokoły"],
  protocol: ["Protokoll", "Record", "Registro", "Registro", "Протокол", "Registre", "Protokół"],
  new: ["+ Neu", "+ New", "+ Nuevo", "+ Nuovo", "+ Новий", "+ Nouveau", "+ Nowy"],
  offlineSetup: ["Für die Offline-Nutzung vorbereiten", "Prepare for offline use", "Preparar para uso sin conexión", "Prepara per l’uso offline", "Підготувати для роботи без інтернету", "Préparer l’usage hors ligne", "Przygotuj do pracy offline"],
  homeScreen: ["App zum iPhone-Home-Bildschirm hinzufügen", "Add the app to your iPhone Home Screen", "Añade la aplicación a la pantalla de inicio del iPhone", "Aggiungi l’app alla schermata Home dell’iPhone", "Додайте застосунок на початковий екран iPhone", "Ajouter l’app à l’écran d’accueil de l’iPhone", "Dodaj aplikację do ekranu początkowego iPhone’a"],
  backupReminder: ["Externe Sicherungskopie erstellen", "Create an external backup", "Crear una copia de seguridad externa", "Crea una copia di sicurezza esterna", "Створіть зовнішню резервну копію", "Créer une sauvegarde externe", "Utwórz zewnętrzną kopię zapasową"],
  backupReminderDetail: ["Zusätzlich zu lokalen Sicherungen eine Kopie in „Dateien“ oder iCloud speichern.", "Keep a copy in Files or iCloud in addition to local snapshots.", "Guarda una copia en Archivos o iCloud además de las copias locales.", "Salva una copia in File o iCloud oltre alle istantanee locali.", "Окрім локальних автознімків, збережіть копію у «Файли» або iCloud.", "Gardez une copie dans Fichiers ou iCloud en plus des instantanés locaux.", "Zachowaj kopię w Plikach lub iCloud oprócz lokalnych migawek."],
  currentProtocol: ["Aktuelles Protokoll", "Current record", "Registro actual", "Registro attuale", "Поточний протокол", "Registre actuel", "Bieżący protokół"],
  autosave: ["✓ Automatisch gespeichert", "✓ Saved automatically", "✓ Guardado automático", "✓ Salvataggio automatico", "✓ Зберігається автоматично", "✓ Enregistré automatiquement", "✓ Zapisywane automatycznie"],
  projectData: ["Projektdaten", "Project details", "Datos del proyecto", "Dati del progetto", "Дані проєкту", "Données du projet", "Dane projektu"],
  fillProject: ["Projektdaten ergänzen", "Enter project details", "Completa los datos del proyecto", "Compila i dati del progetto", "Заповніть дані проєкту", "Saisir les données du projet", "Wpisz dane projektu"],
  project: ["Projekt", "Project", "Proyecto", "Progetto", "Проєкт", "Projet", "Projekt"],
  projectNumber: ["Projekt-Nr.", "Project no.", "N.º de proyecto", "N. progetto", "№ проєкту", "N° de projet", "Nr projektu"],
  date: ["Datum", "Date", "Fecha", "Data", "Дата", "Date", "Data"],
  start: ["Beginn", "Start time", "Hora de inicio", "Ora di inizio", "Початок", "Début", "Początek"],
  time: ["Uhrzeit", "Time", "Hora", "Ora", "Час", "Heure", "Godzina"],
  instrument: ["Instrument", "Instrument", "Instrumento", "Strumento", "Прилад", "Instrument", "Instrument"],
  crew: ["Messtrupp", "Survey crew", "Equipo topográfico", "Squadra di rilievo", "Геодезична бригада", "Équipe", "Ekipa pomiarowa"],
  temperature: ["Temperatur", "Temperature", "Temperatura", "Temperatura", "Температура", "Température", "Temperatura"],
  pressure: ["Luftdruck", "Air pressure", "Presión atmosférica", "Pressione atmosferica", "Атмосферний тиск", "Pression atmosphérique", "Ciśnienie atmosferyczne"],
  fpStatus: ["FP-Netz aktuell abgestimmt", "Control network checked", "Red de apoyo verificada", "Rete di appoggio verificata", "Актуальність опорної мережі узгоджено", "Réseau d’appui vérifié", "Osnowa sprawdzona"],
  fpFile: ["FP-Netz-Datei / Stand", "Control network file / revision", "Archivo de red / revisión", "File della rete / revisione", "Файл опорної мережі / версія", "Fichier du réseau d’appui / version", "Plik osnowy / wersja"],
  namesPlaceholder: ["Namen / Kürzel", "Names / initials", "Nombres / iniciales", "Nomi / iniziali", "Імена / скорочення", "Noms / initiales", "Nazwiska / inicjały"],
  statusPlaceholder: ["Datum / Stand", "Date / revision", "Fecha / revisión", "Data / revisione", "Дата / версія", "Date / version", "Data / wersja"],
  filePlaceholder: ["Dateiname / Datum", "File name / date", "Nombre de archivo / fecha", "Nome del file / data", "Назва файлу / дата", "Nom du fichier / date", "Nazwa pliku / data"],
  exampleProject: ["z. B. RK", "e.g. RK", "p. ej. RK", "es. RK", "напр. RK", "ex. RK", "np. RK"],
  exampleNumber: ["z. B. 2024-121", "e.g. 2024-121", "p. ej. 2024-121", "es. 2024-121", "напр. 2024-121", "ex. 2024-121", "np. 2024-121"],
  exampleInstrument: ["z. B. MS60", "e.g. MS60", "p. ej. MS60", "es. MS60", "напр. MS60", "ex. MS60", "np. MS60"],
  exampleHeight: ["z. B. 0,100", "e.g. 0.100", "p. ej. 0,100", "es. 0,100", "напр. 0,100", "ex. 0,100", "np. 0,100"],
  datePlaceholder: ["TT.MM.JJJJ", "DD/MM/YYYY", "DD/MM/AAAA", "GG/MM/AAAA", "ДД.ММ.РРРР", "JJ/MM/AAAA", "DD.MM.RRRR"],
  timePlaceholder: ["HH:MM", "HH:MM", "HH:MM", "HH:MM", "ГГ:ХХ", "HH:MM", "GG:MM"],
  heightPlaceholder: ["0,000", "0.000", "0,000", "0,000", "0,000", "0,000", "0,000"],
  showLogo: ["Firmenlogo im PDF anzeigen", "Show company logo in PDF", "Mostrar el logotipo de la empresa en el PDF", "Mostra il logo aziendale nel PDF", "Показувати логотип компанії у PDF", "Afficher le logo de l’entreprise dans le PDF", "Pokaż logo firmy w PDF"],
  logoDetail: ["Logo und Firmenzusatz ein- oder ausblenden", "Show or hide the logo and company caption", "Mostrar u ocultar el logotipo y su leyenda", "Mostra o nascondi il logo e la dicitura aziendale", "Показує або приховує логотип і підпис компанії", "Afficher ou masquer le logo et la légende de l’entreprise", "Pokazuje lub ukrywa logo i podpis firmy"],
  companyLogo: ["Firmenlogo", "Company logo", "Logotipo de la empresa", "Logo aziendale", "Логотип компанії", "Logo de l’entreprise", "Logo firmy"],
  companyLogoDetail: ["Gilt für alle Protokolle. PNG oder JPG, am besten mit hellem oder transparentem Hintergrund.", "Applies to all protocols. PNG or JPG, ideally on a light or transparent background.", "Se aplica a todos los protocolos. PNG o JPG, preferiblemente con fondo claro o transparente.", "Vale per tutti i protocolli. PNG o JPG, preferibilmente su sfondo chiaro o trasparente.", "Діє для всіх протоколів. PNG або JPG, краще на світлому чи прозорому фоні.", "S’applique à tous les registres. PNG ou JPG, idéalement sur fond clair ou transparent.", "Dotyczy wszystkich protokołów. PNG lub JPG, najlepiej na jasnym lub przezroczystym tle."],
  uploadLogo: ["Eigenes Logo wählen", "Choose your logo", "Elegir logotipo propio", "Scegli il tuo logo", "Вибрати свій логотип", "Choisir votre logo", "Wybierz logo"],
  replaceLogo: ["Logo ersetzen", "Replace logo", "Cambiar logotipo", "Sostituisci logo", "Замінити логотип", "Remplacer le logo", "Zmień logo"],
  resetLogo: ["Standardlogo", "Default logo", "Logotipo predeterminado", "Logo predefinito", "Стандартний логотип", "Logo par défaut", "Logo domyślne"],
  logoCaption: ["Text unter dem Logo", "Text below the logo", "Texto bajo el logotipo", "Testo sotto il logo", "Текст під логотипом", "Texte sous le logo", "Tekst pod logo"],
  logoCaptionPlaceholder: ["optional, z. B. Vermessung", "optional, e.g. Surveying", "opcional, p. ej. Topografía", "facoltativo, es. Rilievi", "необов’язково, напр. Геодезія", "facultatif, ex. Topographie", "opcjonalnie, np. Geodezja"],
  logoError: ["Das Bild konnte nicht gelesen werden.", "The image could not be read.", "No se pudo leer la imagen.", "Impossibile leggere l’immagine.", "Не вдалося прочитати зображення.", "L’image n’a pas pu être lue.", "Nie udało się odczytać obrazu."],
  companyCaption: ["Ingenieure im Bauwesen", "Civil engineering", "Ingeniería civil", "Ingegneria civile", "Інженери в будівництві", "Ingénieurs en génie civil", "Inżynierowie budownictwa"],
  station: ["Standpunkt", "Station", "Estación", "Stazione", "Станція", "Station", "Stanowisko"],
  stations: ["Standpunkte", "Stations", "Estaciones", "Stazioni", "Станції", "Stations", "Stanowiska"],
  stationDetail: ["Jeder Standpunkt wird als eigener Block gespeichert", "Each station is stored as a separate block", "Cada estación se guarda en un bloque independiente", "Ogni stazione viene salvata in un blocco separato", "Кожна станція зберігається окремим блоком", "Chaque station est enregistrée dans un bloc séparé", "Każde stanowisko jest zapisywane jako osobny blok"],
  newStation: ["+ Neuer Standpunkt", "+ New station", "+ Nueva estación", "+ Nuova stazione", "+ Нова станція", "+ Nouvelle station", "+ Nowe stanowisko"],
  pointNumber: ["Punktnummer", "Point number", "Número de punto", "Numero del punto", "Номер пункту", "Numéro de point", "Numer punktu"],
  instrumentHeight: ["Instrumentenhöhe i [m]", "Instrument height i [m]", "Altura del instrumento i [m]", "Altezza strumentale i [m]", "Висота приладу i [м]", "Hauteur d’instrument i [m]", "Wysokość instrumentu i [m]"],
  target: ["Zielpunkt", "Target point", "Punto visado", "Punto collimato", "Цільовий пункт", "Point visé", "Punkt celu"],
  targets: ["Zielpunkte", "Target points", "Puntos visados", "Punti collimati", "Цільові пункти", "Points visés", "Punkty celu"],
  targetHeight: ["Zielhöhe", "Target height", "Altura del prisma", "Altezza del prisma", "Висота цілі", "Hauteur de cible", "Wysokość celu"],
  targetHeightUnit: ["Zielhöhe [m]", "Target height [m]", "Altura del prisma [m]", "Altezza del prisma [m]", "Висота цілі [м]", "Hauteur de cible [m]", "Wysokość celu [m]"],
  targetColumns: ["Zielpunkt · RB · AP · Zielhöhe · Bemerkung", "Target point · BS · CP · Height · Remark", "Punto visado · VE · PA · Altura · Observación", "Punto collimato · MI · PA · Altezza · Nota", "Цільовий пункт · ЗН · ПП · Висота · Примітка", "Point visé · VA · PR · Hauteur · Remarque", "Punkt celu · WS · PN · Wysokość · Uwagi"],
  add: ["+ Hinzufügen", "+ Add", "+ Añadir", "+ Aggiungi", "+ Додати", "+ Ajouter", "+ Dodaj"],
  edit: ["Bearbeiten", "Edit", "Editar", "Modifica", "Змінити", "Modifier", "Edytuj"],
  noRemark: ["ohne Bemerkung", "no remark", "sin observación", "nessuna nota", "без примітки", "sans remarque", "bez uwag"],
  firstTarget: ["Ersten Zielpunkt hinzufügen", "Add the first target point", "Añadir el primer punto visado", "Aggiungi il primo punto collimato", "Додати перший цільовий пункт", "Ajouter le premier point visé", "Dodaj pierwszy punkt celu"],
  firstTargetDetail: ["Gespeicherte Werte erscheinen im Werteverzeichnis", "Saved values appear in the value list", "Los valores guardados aparecen en la lista", "I valori salvati compaiono nell’elenco", "Після збереження значення з’явиться у довіднику", "Les valeurs enregistrées apparaissent dans la liste des valeurs", "Zapisane wartości pojawiają się na liście wartości"],
  noTargets: ["Noch keine Zielpunkte", "No target points yet", "Aún no hay puntos visados", "Nessun punto collimato", "Цільові пункти ще не додані", "Aucun point visé pour l’instant", "Brak punktów celu"],
  bottomTargetHint: ["Die Zielpunkt-Schaltfläche in der unteren Leiste verwenden", "Use the Target point button in the bottom bar", "Usa el botón Punto visado de la barra inferior", "Usa il pulsante Punto collimato nella barra inferiore", "Використайте кнопку «Цільовий пункт» у нижній панелі", "Utilisez le bouton Point visé de la barre inférieure", "Użyj przycisku Punkt celu na dolnym pasku"],
  deleteStation: ["Standpunkt löschen", "Delete station", "Eliminar estación", "Elimina stazione", "Видалити станцію", "Supprimer la station", "Usuń stanowisko"],
  changesSaved: ["Änderungen gespeichert", "Changes saved", "Cambios guardados", "Modifiche salvate", "Зміни збережено", "Modifications enregistrées", "Zmiany zapisane"],
  officeReady: ["Bereit fürs Büro", "Ready for the office", "Listo para la oficina", "Pronto per l’ufficio", "Готово для офісу", "Prêt pour le bureau", "Gotowe dla biura"],
  pdfDetail: ["Querformat mit drei fortlaufenden Spalten. Lange Standpunkte werden automatisch fortgesetzt.", "Landscape layout with three sequential columns. Long stations continue automatically.", "Formato horizontal con tres columnas consecutivas. Las estaciones largas continúan automáticamente.", "Formato orizzontale con tre colonne consecutive. Le stazioni lunghe proseguono automaticamente.", "Альбомна форма з послідовним заповненням трьох стовпців. Довгі станції продовжуються автоматично.", "Mise en page paysage à trois colonnes successives. Les longues stations continuent automatiquement.", "Układ poziomy z trzema kolejnymi kolumnami. Długie stanowiska są automatycznie kontynuowane."],
  quickActions: ["Schnellaktionen", "Quick actions", "Acciones rápidas", "Azioni rapide", "Швидкі дії", "Actions rapides", "Szybkie działania"],
  pdfRecord: ["PDF-Protokoll", "PDF record", "Registro PDF", "Registro PDF", "PDF-протокол", "Registre PDF", "Protokół PDF"],
  viewPrint: ["Ansehen und drucken", "View and print", "Ver e imprimir", "Visualizza e stampa", "Перегляд і друк", "Afficher et imprimer", "Pokaż i drukuj"],
  viewPrintDetail: ["PDF in der Systemansicht öffnen", "Open PDF in the system viewer", "Abrir el PDF en el visor del sistema", "Apri il PDF nel visualizzatore di sistema", "Відкрити стандартний системний перегляд PDF", "Ouvrir le PDF dans la visionneuse du système", "Otwórz PDF w przeglądarce systemowej"],
  saveShare: ["Speichern oder teilen", "Save or share", "Guardar o compartir", "Salva o condividi", "Зберегти або переслати", "Enregistrer ou partager", "Zapisz lub udostępnij"],
  saveShareDetail: ["Datei mit Projektname und Datum weitergeben", "Share the file with its project name and date", "Compartir el archivo con el nombre del proyecto y la fecha", "Condividi il file con nome del progetto e data", "Передати файл із правильною назвою та датою", "Partager le fichier avec le nom du projet et la date", "Udostępnij plik z nazwą projektu i datą"],
  pdfError: ["PDF konnte nicht erstellt werden. Bitte erneut versuchen.", "Could not create the PDF. Please try again.", "No se pudo crear el PDF. Inténtalo de nuevo.", "Impossibile creare il PDF. Riprova.", "Не вдалося створити PDF. Спробуйте ще раз.", "Impossible de créer le PDF. Veuillez réessayer.", "Nie udało się utworzyć PDF. Spróbuj ponownie."],
  editTarget: ["Zielpunkt bearbeiten", "Edit target point", "Editar punto visado", "Modifica punto collimato", "Змінити цільовий пункт", "Modifier le point visé", "Edytuj punkt celu"],
  newTarget: ["Neuer Zielpunkt", "New target point", "Nuevo punto visado", "Nuovo punto collimato", "Новий цільовий пункт", "Nouveau point visé", "Nowy punkt celu"],
  recent: ["Letzte Kombinationen", "Recent combinations", "Combinaciones recientes", "Combinazioni recenti", "Останні комбінації", "Combinaisons récentes", "Ostatnie kombinacje"],
  pointPlaceholder: ["Punkt eingeben oder auswählen", "Enter or select a point", "Introduce o selecciona un punto", "Inserisci o seleziona un punto", "Введіть або виберіть пункт", "Saisir ou choisir un point", "Wpisz lub wybierz punkt"],
  pointType: ["Punktart", "Point type", "Tipo de punto", "Tipo di punto", "Тип пункту", "Type de point", "Typ punktu"],
  noPointType: ["Keine Punktart", "No point type", "Sin tipo de punto", "Nessun tipo di punto", "Без типу пункту", "Sans type de point", "Bez typu punktu"],
  backsight: ["Rückblick", "Backsight", "Visual de espalda", "Mira indietro", "Зворотний напрямок", "Visée arrière", "Wstecz"],
  connection: ["Anschlusspunkt", "Control point", "Punto de apoyo", "Punto di appoggio", "Пункт прив’язки", "Point de rattachement", "Punkt nawiązania"],
  rbHint: ["Diesen Zielpunkt als Rückblick markieren", "Mark this target point as a backsight", "Marcar este punto como visual de espalda", "Segna questo punto come mira indietro", "Позначити цей цільовий пункт як зворотний напрямок", "Marquer ce point visé comme visée arrière", "Oznacz ten punkt celu jako wstecz"],
  apHint: ["Diesen Zielpunkt als Anschlusspunkt markieren", "Mark this target as a control point", "Marcar este punto como punto de apoyo", "Segna questo punto come punto di appoggio", "Позначити цей цільовий пункт як пункт прив’язки", "Marquer ce point comme point de rattachement", "Oznacz ten punkt jako punkt nawiązania"],
  prismSelection: ["Prismenauswahl", "Prism selection", "Selección de prisma", "Selezione del prisma", "Вибір призми", "Choix du prisme", "Wybór pryzmatu"],
  customRemark: ["Eigene Bemerkung", "Custom remark", "Observación personalizada", "Nota personalizzata", "Власна примітка", "Remarque personnalisée", "Własna uwaga"],
  remark: ["Bemerkung", "Remark", "Observación", "Nota", "Примітка", "Remarque", "Uwagi"],
  remarkPlaceholder: ["Eigene Abkürzung / Bemerkung", "Custom abbreviation / remark", "Abreviatura / observación propia", "Abbreviazione / nota personale", "Власне скорочення / примітка", "Abréviation / remarque personnalisée", "Własny skrót / uwaga"],
  select: ["Auswählen", "Select", "Seleccionar", "Seleziona", "Вибрати", "Choisir", "Wybierz"],
  previous: ["Früher verwendet", "Previously used", "Usado anteriormente", "Usato in precedenza", "Використано раніше", "Déjà utilisés", "Używane wcześniej"],
  other: ["Andere…", "Other…", "Otro…", "Altro…", "Інше…", "Autre…", "Inne…"],
  customPointType: ["Eigene Punktart", "Custom point type", "Tipo de punto propio", "Tipo di punto personale", "Власний тип пункту", "Type de point personnalisé", "Własny typ punktu"],
  enterPointType: ["Kürzel und Beschreibung eingeben", "Enter abbreviation and description", "Introduce abreviatura y descripción", "Inserisci sigla e descrizione", "Ввести скорочення й опис", "Saisir l’abréviation et la description", "Wpisz skrót i opis"],
  pointTypeCode: ["Kürzel der Punktart", "Point type abbreviation", "Abreviatura del tipo", "Sigla del tipo", "Скорочення типу", "Abréviation du type", "Skrót typu"],
  pointTypeCodePlaceholder: ["z. B. HP", "e.g. BM", "p. ej. BM", "es. CS", "напр. РП", "ex. RN", "np. RP"],
  pointTypeDetail: ["Beschreibung (für die Legende)", "Description (for the legend)", "Descripción (para la leyenda)", "Descrizione (per la legenda)", "Опис (для легенди)", "Description (pour la légende)", "Opis (do legendy)"],
  pointTypeDetailPlaceholder: ["z. B. Höhenpunkt", "e.g. Benchmark", "p. ej. Punto de nivelación", "es. Caposaldo", "напр. Репер", "ex. Repère de nivellement", "np. Reper"],
  customPointTypes: ["Eigene Punktarten", "Custom point types", "Tipos de punto propios", "Tipi di punto personali", "Власні типи пунктів", "Types de point personnalisés", "Własne typy punktów"],
  deleteCustomPointType: ["Punktart entfernen", "Remove point type", "Quitar tipo", "Rimuovi tipo", "Видалити тип", "Supprimer le type de point", "Usuń typ punktu"],
  enterRemark: ["Eigene Bemerkung eingeben", "Enter a custom remark", "Introduce una observación", "Inserisci una nota personale", "Ввести власну примітку", "Saisir une remarque personnalisée", "Wpisz własną uwagę"],
  cancel: ["Abbrechen", "Cancel", "Cancelar", "Annulla", "Скасувати", "Annuler", "Anuluj"],
  save: ["Speichern", "Save", "Guardar", "Salva", "Зберегти", "Enregistrer", "Zapisz"],
  saveTarget: ["Zielpunkt speichern", "Save target point", "Guardar punto visado", "Salva punto collimato", "Зберегти цільовий пункт", "Enregistrer le point visé", "Zapisz punkt celu"],
  delete: ["Löschen", "Delete", "Eliminar", "Elimina", "Видалити", "Supprimer", "Usuń"],
  deleteItem: ["{name} löschen", "Delete {name}", "Eliminar {name}", "Elimina {name}", "Видалити {name}", "Supprimer {name}", "Usuń {name}"],
  deleteStationTitle: ["Standpunkt löschen?", "Delete station?", "¿Eliminar estación?", "Eliminare la stazione?", "Видалити станцію?", "Supprimer la station ?", "Usunąć stanowisko?"],
  deleteTargetTitle: ["Zielpunkt löschen?", "Delete target point?", "¿Eliminar punto visado?", "Eliminare il punto collimato?", "Видалити цільовий пункт?", "Supprimer le point visé ?", "Usunąć punkt celu?"],
  deleteProtocolTitle: ["Protokoll löschen?", "Delete record?", "¿Eliminar registro?", "Eliminare il registro?", "Видалити протокол?", "Supprimer le registre ?", "Usunąć protokół?"],
  deleteStationBody: ["Der Standpunkt einschließlich aller Zielpunkte ({count}) wird aus dem Protokoll gelöscht.", "The station and all its target points ({count}) will be deleted from this record.", "Se eliminará del registro la estación y todos sus puntos visados ({count}).", "La stazione e tutti i suoi punti collimati ({count}) saranno eliminati dal registro.", "Станцію та всі її цільові пункти ({count}) буде видалено з протоколу.", "La station et tous ses points visés ({count}) seront supprimés de ce registre.", "Stanowisko i wszystkie jego punkty celu ({count}) zostaną usunięte z tego protokołu."],
  deleteTargetBody: ["Der Punkt wird aus dem Standpunkt {name} gelöscht.", "The point will be removed from station {name}.", "Se eliminará el punto de la estación {name}.", "Il punto sarà eliminato dalla stazione {name}.", "Пункт буде видалено зі станції {name}.", "Le point sera retiré de la station {name}.", "Punkt zostanie usunięty ze stanowiska {name}."],
  deleteProtocolBody: ["Das Protokoll mit {stations} Standpunkten und {targets} Zielpunkten wird gelöscht.", "The record containing {stations} stations and {targets} target points will be deleted.", "Se eliminará el registro con {stations} estaciones y {targets} puntos visados.", "Sarà eliminato il registro con {stations} stazioni e {targets} punti collimati.", "Буде видалено протокол: станцій — {stations}, цільових пунктів — {targets}.", "Le registre avec {stations} stations et {targets} points visés sera supprimé.", "Protokół zawierający stanowiska ({stations}) i punkty celu ({targets}) zostanie usunięty."],
  beforeDelete: ["Vor dem Löschen wird der aktuelle Stand automatisch gesichert.", "A snapshot is saved automatically before deletion.", "Antes de eliminar se guarda una copia automática.", "Prima dell’eliminazione viene salvata un’istantanea automatica.", "Перед видаленням поточний стан автоматично збережеться у знімках.", "Un instantané est enregistré automatiquement avant la suppression.", "Przed usunięciem automatycznie zapisywana jest migawka."],
  deleteProtocol: ["Protokoll löschen", "Delete record", "Eliminar registro", "Elimina registro", "Видалити протокол", "Supprimer le registre", "Usuń protokół"],
  dataProtection: ["Datensicherung", "Data protection", "Protección de datos", "Protezione dei dati", "Захист даних", "Protection des données", "Ochrona danych"],
  backupSummary: ["Kopien, Sicherungsstände und Wiederherstellung", "Backups, snapshots and recovery", "Copias de seguridad, instantáneas y restauración", "Copie, istantanee e ripristino", "Копії, автознімки та відновлення", "Sauvegardes, instantanés et restauration", "Kopie, migawki i przywracanie"],
  newProtocol: ["Neues Protokoll", "New record", "Nuevo registro", "Nuovo registro", "Новий протокол", "Nouveau registre", "Nowy protokół"],
  carryHint: ["Projekt und Instrument werden übernommen", "Project and instrument are carried over", "Se conservan el proyecto y el instrumento", "Progetto e strumento vengono mantenuti", "Проєкт та інструмент будуть перенесені", "Le projet et l’instrument sont repris", "Projekt i instrument zostaną przeniesione"],
  active: ["Geöffnet", "Open", "Abierto", "Aperto", "Відкрито", "Ouvert", "Otwarty"],
  localStorageTitle: ["Daten werden auf diesem Gerät gespeichert", "Data is saved on this device", "Los datos se guardan en este dispositivo", "I dati sono salvati su questo dispositivo", "Дані зберігаються на цьому пристрої", "Les données sont enregistrées sur cet appareil", "Dane są zapisywane na tym urządzeniu"],
  localStorageDetail: ["Jede Änderung wird sofort und ohne Internet gespeichert, zur Sicherheit doppelt.", "Every change is saved at once, without internet, and kept twice for safety.", "Cada cambio se guarda al instante, sin internet y por duplicado para mayor seguridad.", "Ogni modifica viene salvata subito, senza internet e in doppia copia per sicurezza.", "Кожна зміна зберігається одразу, без інтернету і для надійності у двох копіях.", "Chaque modification est enregistrée aussitôt, sans internet, et conservée en double par sécurité.", "Każda zmiana jest zapisywana od razu, bez internetu, i przechowywana podwójnie dla bezpieczeństwa."],
  deleteTarget: ["Zielpunkt löschen", "Delete target point", "Eliminar punto visado", "Elimina punto collimato", "Видалити цільовий пункт", "Supprimer le point visé", "Usuń punkt celu"],
  quickStart: ["So starten Sie", "Getting started", "Cómo empezar", "Come iniziare", "Як почати", "Pour commencer", "Jak zacząć"],
  quickStep1: ["Projektnamen eintragen", "Enter the project name", "Escribe el nombre del proyecto", "Inserisci il nome del progetto", "Впишіть назву проєкту", "Saisissez le nom du projet", "Wpisz nazwę projektu"],
  quickStep1Detail: ["im Block „Projektdaten“", "in the Project details block", "en el bloque Datos del proyecto", "nel blocco Dati del progetto", "у блоці «Дані проєкту»", "dans le bloc Données du projet", "w bloku Dane projektu"],
  quickStep2: ["Ersten Standpunkt ausfüllen", "Fill in the first station", "Completa la primera estación", "Compila la prima stazione", "Заповніть першу станцію", "Remplissez la première station", "Wypełnij pierwsze stanowisko"],
  quickStep2Detail: ["Punktnummer und Instrumentenhöhe", "point number and instrument height", "número de punto y altura del instrumento", "numero del punto e altezza strumentale", "номер пункту й висота приладу", "numéro de point et hauteur d’instrument", "numer punktu i wysokość instrumentu"],
  quickStep3: ["Zielpunkte hinzufügen", "Add target points", "Añade puntos visados", "Aggiungi i punti collimati", "Додайте цільові пункти", "Ajoutez des points visés", "Dodaj punkty celu"],
  quickStep3Detail: ["orangefarbene Taste unten", "orange button at the bottom", "botón naranja de abajo", "pulsante arancione in basso", "помаранчева кнопка внизу", "bouton orange en bas", "pomarańczowy przycisk na dole"],
  quickStartMore: ["Mehr dazu: Menü → Hilfe", "More: Menu → Help", "Más información: Menú → Ayuda", "Altre informazioni: Menu → Guida", "Докладніше: Меню → Довідка", "Plus : Menu → Aide", "Więcej: Menu → Pomoc"],
  stationLetter: ["S", "S", "E", "S", "С", "S", "S"],
  toggleSign: ["Vorzeichen wechseln", "Change sign", "Cambiar signo", "Cambia segno", "Змінити знак", "Changer le signe", "Zmień znak"],
  fileBackup: ["Kopie in „Dateien“ / iCloud", "Backup in Files / iCloud", "Copia en Archivos / iCloud", "Copia in File / iCloud", "Копія у «Файли» / iCloud", "Sauvegarde dans Fichiers / iCloud", "Kopia w Plikach / iCloud"],
  lastBackup: ["Letzte Kopie", "Last backup", "Última copia", "Ultima copia", "Остання копія", "Dernière sauvegarde", "Ostatnia kopia"],
  createBackup: ["Kopie erstellen", "Create backup", "Crear copia", "Crea copia", "Створити копію", "Créer une sauvegarde", "Utwórz kopię"],
  restoreFile: ["Aus Datei wiederherstellen", "Restore from file", "Restaurar desde archivo", "Ripristina da file", "Відновити з файлу", "Restaurer depuis un fichier", "Przywróć z pliku"],
  backupExplainer: ["Auf dem iPhone im Teilen-Menü „In Dateien sichern“ wählen.", "On iPhone, choose Save to Files in the Share menu.", "En iPhone, selecciona Guardar en Archivos en el menú Compartir.", "Su iPhone, scegli Salva su File nel menu Condividi.", "На iPhone відкриється меню «Поділитися» — виберіть «Зберегти у Файли».", "Sur iPhone, choisissez Enregistrer dans Fichiers dans le menu Partager.", "Na iPhonie wybierz Zachowaj w Plikach w menu Udostępnij."],
  snapshots: ["Automatische Sicherungsstände", "Automatic snapshots", "Instantáneas automáticas", "Istantanee automatiche", "Автоматичні знімки", "Instantanés automatiques", "Automatyczne migawki"],
  snapshotLimit: ["Bis zu {count} letzte Stände auf diesem Gerät", "Up to {count} recent snapshots on this device", "Hasta {count} instantáneas recientes en este dispositivo", "Fino a {count} istantanee recenti su questo dispositivo", "До {count} останніх станів на цьому пристрої", "Jusqu’à {count} instantanés récents sur cet appareil", "Do {count} ostatnich migawek na tym urządzeniu"],
  restore: ["Wiederherstellen", "Restore", "Restaurar", "Ripristina", "Відновити", "Restaurer", "Przywróć"],
  noSnapshots: ["Nach der ersten Eingabe eines Punkts oder einer Projektnummer wird automatisch ein Sicherungsstand erstellt.", "A snapshot is created after you enter the first point or project number.", "Se crea una instantánea al introducir el primer punto o número de proyecto.", "Un’istantanea viene creata dopo l’inserimento del primo punto o numero di progetto.", "Знімок з’явиться автоматично після першого введеного пункту або номера проєкту.", "Un instantané est créé après la saisie du premier point ou du numéro de projet.", "Migawka powstaje po wpisaniu pierwszego punktu lub numeru projektu."],
  notCreated: ["Noch nicht erstellt", "Not yet created", "Aún no creada", "Non ancora creata", "Ще не створено", "Pas encore créée", "Jeszcze nie utworzono"],
  backupCreated: ["Sicherungskopie erstellt. In „Dateien“ oder iCloud Drive speichern.", "Backup created. Save it in Files or iCloud Drive.", "Copia creada. Guárdala en Archivos o iCloud Drive.", "Copia creata. Salvala in File o iCloud Drive.", "Резервну копію створено. Збережіть її у «Файли» або iCloud Drive.", "Sauvegarde créée. Enregistrez-la dans Fichiers ou iCloud Drive.", "Kopia utworzona. Zapisz ją w Plikach lub iCloud Drive."],
  backupFailed: ["Die Datei konnte nicht erstellt werden. Erneut versuchen.", "Could not create the file. Try again.", "No se pudo crear el archivo. Inténtalo de nuevo.", "Impossibile creare il file. Riprova.", "Не вдалося створити файл. Спробуйте ще раз.", "Impossible de créer le fichier. Réessayez.", "Nie udało się utworzyć pliku. Spróbuj ponownie."],
  backupInvalid: ["Keine gültige Standpunktprotokoll-Sicherung oder die Datei ist beschädigt.", "This is not a valid Standpunktprotokoll backup, or the file is damaged.", "No es una copia válida de Standpunktprotokoll o el archivo está dañado.", "Non è una copia valida di Standpunktprotokoll oppure il file è danneggiato.", "Цей файл не є резервною копією Standpunktprotokoll або він пошкоджений.", "Ce n’est pas une sauvegarde Standpunktprotokoll valide, ou le fichier est endommagé.", "To nie jest prawidłowa kopia Standpunktprotokoll albo plik jest uszkodzony."],
  restoreConfirm: ["{count} Protokolle aus Datei wiederherstellen? Der aktuelle Stand bleibt in den Sicherungsständen erhalten.", "Restore {count} records from this file? The current state will remain in snapshots.", "¿Restaurar {count} registros del archivo? El estado actual quedará en las instantáneas.", "Ripristinare {count} registri dal file? Lo stato attuale resterà nelle istantanee.", "Відновити протоколи з файлу ({count})? Поточний стан залишиться в автоматичних знімках.", "Restaurer {count} registres depuis ce fichier ? L’état actuel restera dans les instantanés.", "Przywrócić protokoły z tego pliku ({count})? Obecny stan pozostanie w migawkach."],
  restored: ["Protokolle aus Datei wiederhergestellt: {count}.", "Records restored from file: {count}.", "Registros restaurados: {count}.", "Registri ripristinati: {count}.", "Відновлено протоколів із файлу: {count}.", "Registres restaurés depuis le fichier : {count}.", "Przywrócono protokoły z pliku: {count}."],
  snapshotConfirm: ["Stand vom {date} wiederherstellen? Der aktuelle Stand wird ebenfalls gesichert.", "Restore the snapshot from {date}? The current state will also be saved.", "¿Restaurar el estado del {date}? También se guardará el estado actual.", "Ripristinare lo stato del {date}? Sarà salvato anche lo stato attuale.", "Повернути стан на {date}? Поточний стан також буде збережено.", "Restaurer l’instantané du {date} ? L’état actuel sera aussi enregistré.", "Przywrócić migawkę z {date}? Obecny stan również zostanie zapisany."],
  snapshotRestored: ["Stand vom {date} wiederhergestellt.", "Snapshot from {date} restored.", "Estado del {date} restaurado.", "Stato del {date} ripristinato.", "Стан відновлено на {date}.", "Instantané du {date} restauré.", "Przywrócono migawkę z {date}."],
  valueDirectory: ["Werteverzeichnis", "Saved value list", "Lista de valores guardados", "Elenco dei valori salvati", "Довідник значень", "Liste des valeurs enregistrées", "Lista zapisanych wartości"],
  valueHint: ["Änderungen gelten für künftige Vorschläge, nicht für bestehende Protokolle.", "Changes affect future suggestions, not existing records.", "Los cambios afectan a futuras sugerencias, no a registros existentes.", "Le modifiche valgono per i suggerimenti futuri, non per i registri esistenti.", "Зміни впливають на майбутні підказки, але не змінюють уже записані протоколи.", "Les modifications concernent les suggestions futures, pas les registres existants.", "Zmiany dotyczą przyszłych podpowiedzi, a nie istniejących protokołów."],
  rememberRb: ["RB mit dieser Kombination speichern", "Save BS with this combination", "Guardar VE con esta combinación", "Salva MI con questa combinazione", "Зберігати ЗН разом із цією комбінацією", "Enregistrer VA avec cette combinaison", "Zapisz WS z tą kombinacją"],
  rememberAp: ["AP mit dieser Kombination speichern", "Save CP with this combination", "Guardar PA con esta combinación", "Salva PA con questa combinazione", "Зберігати ПП разом із цією комбінацією", "Enregistrer PR avec cette combinaison", "Zapisz PN z tą kombinacją"],
  emptyValues: ["Noch keine gespeicherten Werte", "No saved values yet", "Aún no hay valores guardados", "Nessun valore salvato", "Довідник поки порожній", "Aucune valeur enregistrée", "Brak zapisanych wartości"],
  emptyValuesHint: ["Beim ersten Zielpunkt wird die Kombination automatisch gespeichert.", "Add a target point to save its combination automatically.", "Añade un punto visado para guardar su combinación automáticamente.", "Aggiungi un punto collimato per salvare automaticamente la combinazione.", "Додайте перший цільовий пункт — комбінація збережеться автоматично.", "Ajoutez un point visé pour enregistrer sa combinaison automatiquement.", "Dodaj punkt celu, aby automatycznie zapisać jego kombinację."],
  savedSuggestions: ["{label}: gespeicherte Werte", "{label}: saved values", "{label}: valores guardados", "{label}: valori salvati", "{label}: збережені значення", "{label} : valeurs enregistrées", "{label}: zapisane wartości"],
  close: ["Schließen", "Close", "Cerrar", "Chiudi", "Закрити", "Fermer", "Zamknij"],
  understood: ["Verstanden", "Got it", "Entendido", "Ho capito", "Зрозуміло", "Compris", "Rozumiem"],
  offlineIphone: ["Offline auf dem iPhone", "Offline on iPhone", "Sin conexión en iPhone", "Offline su iPhone", "Офлайн на iPhone", "Hors ligne sur iPhone", "Offline na iPhonie"],
  iphone1: ["Diese Seite in Safari öffnen.", "Open this page in Safari.", "Abre esta página en Safari.", "Apri questa pagina in Safari.", "Відкрийте цю сторінку в Safari.", "Ouvrez cette page dans Safari.", "Otwórz tę stronę w Safari."],
  iphone2: ["Auf „Teilen“ tippen.", "Tap Share.", "Pulsa Compartir.", "Tocca Condividi.", "Натисніть «Поділитися».", "Touchez Partager.", "Stuknij Udostępnij."],
  iphone3: ["„Zum Home-Bildschirm“ wählen und bestätigen.", "Choose Add to Home Screen and confirm.", "Elige Añadir a pantalla de inicio y confirma.", "Scegli Aggiungi alla schermata Home e conferma.", "Виберіть «На початковий екран» і підтвердьте.", "Choisissez Sur l’écran d’accueil et confirmez.", "Wybierz Do ekranu początkowego i potwierdź."],
  offlineInstall: ["Die App nach der Installation einmal mit Internetverbindung öffnen, um den Offline-Modus vorzubereiten.", "After installation, open the app once online to prepare offline mode.", "Tras instalar, abre la aplicación una vez con conexión para preparar el modo sin conexión.", "Dopo l’installazione, apri l’app una volta con Internet per preparare la modalità offline.", "Після встановлення один раз відкрийте застосунок з інтернетом, щоб підготувати офлайн-режим.", "Après l’installation, ouvrez l’app une fois en ligne pour préparer le mode hors ligne.", "Po instalacji otwórz aplikację raz online, aby przygotować tryb offline."],
  about: ["Über die App", "About the app", "Acerca de la aplicación", "Informazioni sull’app", "Про застосунок", "À propos de l’app", "O aplikacji"],
  version: ["Version {version}", "Version {version}", "Versión {version}", "Versione {version}", "Версія {version}", "Version {version}", "Wersja {version}"],
  author: ["Entwickelt von Oleksii Yermakov.", "Developed by Oleksii Yermakov.", "Desarrollado por Oleksii Yermakov.", "Sviluppato da Oleksii Yermakov.", "Розроблено Олексієм Єрмаковим.", "Développé par Oleksii Yermakov.", "Opracowane przez Oleksiia Yermakova."],
  copyright: ["© 2026 Oleksii Yermakov. Alle Rechte vorbehalten.", "© 2026 Oleksii Yermakov. All rights reserved.", "© 2026 Oleksii Yermakov. Todos los derechos reservados.", "© 2026 Oleksii Yermakov. Tutti i diritti riservati.", "© 2026 Oleksii Yermakov. Усі права захищені.", "© 2026 Oleksii Yermakov. Tous droits réservés.", "© 2026 Oleksii Yermakov. Wszelkie prawa zastrzeżone."],
  usageTerms: ["Die App ist ein unterstützendes Arbeitswerkzeug. Nutzer prüfen eingegebene Daten und erstellte Protokolle. Die Daten bleiben lokal auf dem Gerät.", "This app is a supporting work tool. Users must verify entered data and generated records. Data is stored locally on the device.", "Esta aplicación es una herramienta auxiliar. El usuario debe comprobar los datos introducidos y los registros generados. Los datos se guardan localmente en el dispositivo.", "L’app è uno strumento di supporto. L’utente deve verificare i dati inseriti e i registri generati. I dati sono salvati localmente sul dispositivo.", "Застосунок є допоміжним робочим інструментом. Користувач перевіряє правильність введених даних і створених протоколів. Дані зберігаються локально на пристрої.", "Cette app est un outil de travail d’appoint. Les utilisateurs doivent vérifier les données saisies et les registres générés. Les données sont stockées localement sur l’appareil.", "Aplikacja jest pomocniczym narzędziem pracy. Użytkownik musi sprawdzać wprowadzone dane i utworzone protokoły. Dane są przechowywane lokalnie na urządzeniu."],
  restrictions: ["Kopieren des Codes, Änderungen, erneute Veröffentlichung, Weiterverkauf oder kommerzielle Verbreitung ohne schriftliche Zustimmung des Autors sind untersagt.", "Copying the code, modification, republication, resale or commercial distribution without the author’s written consent is prohibited.", "Se prohíben la copia del código, modificación, republicación, reventa o distribución comercial sin el consentimiento escrito del autor.", "Sono vietate la copia del codice, modifica, ripubblicazione, rivendita o distribuzione commerciale senza il consenso scritto dell’autore.", "Копіювання коду, модифікація, повторна публікація, перепродаж або комерційне розповсюдження без письмової згоди автора заборонені.", "La copie du code, la modification, la republication, la revente ou la diffusion commerciale sans l’accord écrit de l’auteur sont interdites.", "Kopiowanie kodu, modyfikacja, ponowna publikacja, odsprzedaż lub dystrybucja komercyjna bez pisemnej zgody autora są zabronione."],
  instructions: ["Anleitung", "Instructions", "Instrucciones", "Istruzioni", "Інструкція", "Instructions", "Instrukcja"],
  instructionIntro: ["Schrittweise Hilfe zu allen Hauptfunktionen.", "Step-by-step help for all main features.", "Ayuda paso a paso para todas las funciones principales.", "Guida passo passo alle funzioni principali.", "Покрокова довідка з усіх основних функцій застосунку.", "Aide pas à pas pour toutes les fonctions principales.", "Pomoc krok po kroku dla wszystkich głównych funkcji."],
  openInstructions: ["Anleitung öffnen", "Open instructions", "Abrir instrucciones", "Apri le istruzioni", "Відкрити інструкцію", "Ouvrir les instructions", "Otwórz instrukcję"],
  install: ["App installieren", "Install the app", "Instalar la aplicación", "Installa l’app", "Встановлення застосунку", "Installer l’app", "Zainstaluj aplikację"],
  iphoneInstall: ["Safari → Teilen → Zum Home-Bildschirm → Hinzufügen.", "Safari → Share → Add to Home Screen → Add.", "Safari → Compartir → Añadir a pantalla de inicio → Añadir.", "Safari → Condividi → Aggiungi alla schermata Home → Aggiungi.", "Safari → «Поділитися» → «На початковий екран» → «Додати».", "Safari → Partager → Sur l’écran d’accueil → Ajouter.", "Safari → Udostępnij → Do ekranu początkowego → Dodaj."],
  androidInstall: ["Chrome → Menü ⋮ → App installieren oder Zum Startbildschirm hinzufügen.", "Chrome → menu ⋮ → Install app or Add to Home screen.", "Chrome → menú ⋮ → Instalar aplicación o Añadir a pantalla de inicio.", "Chrome → menu ⋮ → Installa app o Aggiungi a schermata Home.", "Chrome → меню ⋮ → «Встановити застосунок» або «Додати на головний екран».", "Chrome → menu ⋮ → Installer l’application ou Ajouter à l’écran d’accueil.", "Chrome → menu ⋮ → Zainstaluj aplikację lub Dodaj do ekranu głównego."],
  closeInstructions: ["Anleitung schließen", "Close instructions", "Cerrar instrucciones", "Chiudi le istruzioni", "Закрити інструкцію", "Fermer les instructions", "Zamknij instrukcję"],
  pageNumber: ["Seite: {page} von {total}", "Page: {page} of {total}", "Página: {page} de {total}", "Pagina: {page} di {total}", "Сторінка: {page} із {total}", "Page : {page} sur {total}", "Strona: {page} z {total}"],
  stationHeader: ["Standpunkt / i-Höhe", "Station / inst. height", "Estación / altura instr.", "Stazione / altezza str.", "Станція / вис. приладу", "Station / haut. instr.", "Stanowisko / wys. instr."],
  leicaConstant: ["Leica-Konstante: {value} mm", "Leica constant: {value} mm", "Constante Leica: {value} mm", "Costante Leica: {value} mm", "Константа Leica: {value} мм", "Constante Leica : {value} mm", "Stała Leica: {value} mm"],
  prismP360: ["Leica 360° Prisma", "Leica 360° prism", "Prisma Leica 360°", "Prisma Leica 360°", "Призма Leica 360°", "Prisme 360° Leica", "Pryzmat 360° Leica"],
  prismHDS: ["Leica HDS Zielmarke", "Leica HDS target", "Diana Leica HDS", "Mira Leica HDS", "Марка Leica HDS", "Cible HDS Leica", "Tarcza HDS Leica"],
  prismMPR122: ["Leica MPR122", "Leica MPR122", "Leica MPR122", "Leica MPR122", "Leica MPR122", "Leica MPR122", "Leica MPR122"],
  prismMP: ["Leica Miniprisma", "Leica mini prism", "Miniprisma Leica", "Miniprisma Leica", "Мініпризма Leica", "Mini-prisme Leica", "Minipryzmat Leica"],
  prismMP0: ["Leica Miniprisma 0", "Leica mini prism 0", "Miniprisma Leica 0", "Miniprisma Leica 0", "Мініпризма Leica 0", "Mini-prisme Leica 0", "Minipryzmat Leica 0"],
  prismMP360: ["Leica Miniprisma 360°", "Leica 360° mini prism", "Miniprisma Leica 360°", "Miniprisma Leica 360°", "Мініпризма Leica 360°", "Mini-prisme 360° Leica", "Minipryzmat 360° Leica"],
  prismRF: ["Leica Reflexfolie", "Leica reflective foil", "Lámina reflectante Leica", "Pellicola riflettente Leica", "Відбивна плівка Leica", "Feuille réfléchissante Leica", "Folia odblaskowa Leica"],
  prismRP: ["Leica Rundprisma", "Leica round prism", "Prisma circular Leica", "Prisma circolare Leica", "Кругла призма Leica", "Prisme rond Leica", "Pryzmat okrągły Leica"],
  prismOP: ["Ohne Prisma", "Reflectorless", "Sin prisma", "Senza prisma", "Без призми", "Sans réflecteur", "Bezlustrowo"],
  typeGVP: ["Gleisvermarkungspunkt", "Track reference point", "Punto de referencia de vía", "Punto di riferimento del binario", "Пункт закріплення колії", "Point de référence de voie", "Punkt odniesienia toru"],
  typeBGVP: ["Boden-Gleisvermarkungspunkt", "Ground-level track reference point", "Punto de referencia de vía en el suelo", "Punto di riferimento del binario a terra", "Ґрунтовий пункт закріплення колії", "Point de référence de voie au sol", "Gruntowy punkt odniesienia toru"],
  typeBVP: ["Bodenvermarkungspunkt", "Ground monument point", "Punto materializado en el suelo", "Punto materializzato a terra", "Ґрунтовий пункт закріплення", "Point matérialisé au sol", "Punkt stabilizowany w gruncie"],
  typeGKP: ["Gleiskontrollpunkt", "Track control point", "Punto de control de vía", "Punto di controllo del binario", "Пункт контролю колії", "Point de contrôle de voie", "Punkt kontrolny toru"],
  typeSP: ["Standpunkt", "Instrument station", "Estación del instrumento", "Stazione strumentale", "Станція встановлення приладу", "Station de l’instrument", "Stanowisko instrumentu"],
  typePS0: ["Grundnetzpunkt", "Primary network point", "Punto de la red principal", "Punto della rete principale", "Пункт основної мережі", "Point du réseau principal", "Punkt osnowy podstawowej"],
  typePS1: ["Basispunkt", "Base point", "Punto base", "Punto base", "Базисний пункт", "Point de base", "Punkt bazowy"],
  typePS2: ["Lagefestpunkt", "Horizontal control point", "Punto de apoyo planimétrico", "Punto di appoggio planimetrico", "Плановий опорний пункт", "Point d’appui planimétrique", "Punkt osnowy poziomej"],
  typePS3: ["Höhenfestpunkt", "Vertical control point", "Punto de apoyo altimétrico", "Punto di appoggio altimetrico", "Висотний опорний пункт", "Point d’appui altimétrique", "Punkt osnowy wysokościowej"],
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
  const separator = language === "de" || language === "uk" || language === "pl" ? "." : "/";
  return `${day}${separator}${month}${separator}${year}`;
}
export function formatBackupDate(value: string | undefined, language: Language): string {
  const date = value ? new Date(value) : null;
  return !date || Number.isNaN(date.getTime()) ? translate(language, "notCreated")
    : new Intl.DateTimeFormat(LOCALES[language], {dateStyle:"medium", timeStyle:"short", hour12:false}).format(date);
}
const COUNT_WORDS = {
  station: {de:["Standpunkt","Standpunkte"],en:["station","stations"],es:["estación","estaciones"],it:["stazione","stazioni"],uk:["станція","станції","станцій"],fr:["station","stations"],pl:["stanowisko","stanowiska","stanowisk"]},
  target: {de:["Zielpunkt","Zielpunkte"],en:["target point","target points"],es:["punto visado","puntos visados"],it:["punto collimato","punti collimati"],uk:["цільовий пункт","цільові пункти","цільових пунктів"],fr:["point visé","points visés"],pl:["punkt celu","punkty celu","punktów celu"]},
  protocol: {de:["Protokoll","Protokolle"],en:["record","records"],es:["registro","registros"],it:["registro","registri"],uk:["протокол","протоколи","протоколів"],fr:["registre","registres"],pl:["protokół","protokoły","protokołów"]},
} as const;
export function countLabel(count: number, kind: keyof typeof COUNT_WORDS, language: Language): string {
  const rule = new Intl.PluralRules(LOCALES[language]).select(count);
  const words = COUNT_WORDS[kind][language];
  // Ukrainian and Polish have a separate "many" form (5 станцій, 5 stanowisk).
  return `${count} ${words[rule === "one" ? 0 : (language === "uk" || language === "pl") && rule !== "few" ? 2 : 1]}`;
}
export const PRISMS = [
  ["P360","prismP360",23.1], ["HDS","prismHDS",34.4], ["MPR122","prismMPR122",28.1],
  ["MP","prismMP",17.5], ["MP0","prismMP0",0], ["MP360","prismMP360",30],
  ["RF","prismRF",34.4], ["RP","prismRP",0], ["OP","prismOP",34.4],
] as const;
// Display abbreviations in DE / EN / ES / IT / UK / FR / PL. HDS and MPR122 are
// manufacturer designations, so they stay unchanged in every language.
const PRISM_ABBREVIATIONS: Record<(typeof PRISMS)[number][0], TranslationRow> = {
  P360: ["P360", "P360", "P360", "P360", "П360", "P360", "P360"],
  HDS: ["HDS", "HDS", "HDS", "HDS", "HDS", "HDS", "HDS"],
  MPR122: ["MPR122", "MPR122", "MPR122", "MPR122", "MPR122", "MPR122", "MPR122"],
  MP: ["MP", "MP", "MP", "MP", "МП", "MP", "MP"],
  MP0: ["MP0", "MP0", "MP0", "MP0", "МП0", "MP0", "MP0"],
  MP360: ["MP360", "MP360", "MP360", "MP360", "МП360", "MP360", "MP360"],
  RF: ["RF", "RF", "LR", "PR", "ВП", "FR", "FO"],
  RP: ["RP", "RP", "PC", "PC", "КП", "RD", "PO"],
  OP: ["OP", "RL", "SP", "SP", "БП", "SR", "BL"],
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
  GVP: ["GVP", "TRP", "PRV", "PRB", "ПЗК", "PRV", "POT"],
  BGVP: ["BGVP", "GTRP", "PRVS", "PRBT", "ҐПЗК", "PRVS", "GPOT"],
  BVP: ["BVP", "GMP", "PMS", "PMT", "ҐПЗ", "PMS", "PSG"],
  GKP: ["GKP", "TCP", "PCV", "PCB", "ПКК", "PCV", "PKT"],
  SP: ["SP", "ST", "EST", "ST", "СТ", "ST", "ST"],
  RB: ["RB", "BS", "VE", "MI", "ЗН", "VA", "WS"],
  AP: ["AP", "CP", "PA", "PA", "ПП", "PR", "PN"],
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
