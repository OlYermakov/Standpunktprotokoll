"use client";
import { useLanguage } from "./i18n-context";
import { abbreviation, prismAbbreviation, LANGUAGES, remarkChoices, pointTypeChoices, type MessageKey } from "./i18n";

// Every section is a title plus short numbered steps, in the DE / EN / ES / IT / UK order of the UI catalog.
// {key} is replaced by the current label of that button or screen, so the guide never drifts from the UI;
// {RB} and {AP} become the localized abbreviations.
type Section = { title: readonly string[]; steps: readonly (readonly string[])[] };

const GUIDE: readonly Section[] = [
  {
    title: ["Schnellstart", "Quick start", "Inicio rápido", "Avvio rapido", "Швидкий старт"],
    steps: [
      ["Unter „{projectData}“ den Projektnamen eintragen.", "Enter the project name under “{projectData}”.", "Escribe el nombre del proyecto en «{projectData}».", "Inserisci il nome del progetto in «{projectData}».", "Впишіть назву проєкту в блоці «{projectData}»."],
      ["Im ersten Standpunkt Punktnummer und Instrumentenhöhe eingeben.", "Enter the point number and instrument height of the first station.", "Introduce el número de punto y la altura del instrumento de la primera estación.", "Inserisci numero del punto e altezza strumentale della prima stazione.", "У першій станції введіть номер пункту й висоту приладу."],
      ["Mit der orangefarbenen Taste „{target}“ unten die Zielpunkte erfassen.", "Add target points with the orange “{target}” button at the bottom.", "Añade los puntos con el botón naranja «{target}» de abajo.", "Aggiungi i punti con il pulsante arancione «{target}» in basso.", "Додавайте пункти помаранчевою кнопкою «{target}» унизу."],
      ["Am Ende unten „PDF“ wählen und das Protokoll sichern oder senden.", "When finished, choose “PDF” at the bottom to save or send the record.", "Al terminar, pulsa «PDF» abajo para guardar o enviar el registro.", "Alla fine tocca «PDF» in basso per salvare o inviare il registro.", "Наприкінці натисніть «PDF» унизу, щоб зберегти або надіслати протокол."],
      ["Alles wird sofort und ohne Internet auf diesem Gerät gespeichert.", "Everything is saved at once on this device, without internet.", "Todo se guarda al instante en este dispositivo, sin internet.", "Tutto viene salvato subito su questo dispositivo, senza internet.", "Усе зберігається одразу на цьому пристрої, без інтернету."],
    ],
  },
  {
    title: ["Neues Protokoll und Protokollliste", "New record and record list", "Nuevo registro y lista de registros", "Nuovo registro ed elenco", "Новий протокол і список протоколів"],
    steps: [
      ["Menü oben rechts öffnen und „{newProtocol}“ wählen.", "Open the menu at the top right and choose “{newProtocol}”.", "Abre el menú arriba a la derecha y elige «{newProtocol}».", "Apri il menu in alto a destra e scegli «{newProtocol}».", "Відкрийте меню вгорі праворуч і виберіть «{newProtocol}»."],
      ["Projekt, Instrument und Messtrupp werden übernommen; Datum und Beginn werden neu gesetzt.", "Project, instrument and crew are carried over; date and start time are set anew.", "Se conservan proyecto, instrumento y equipo; la fecha y la hora de inicio se actualizan.", "Progetto, strumento e squadra vengono mantenuti; data e ora di inizio si aggiornano.", "Проєкт, прилад і бригада переносяться; дата й час початку встановлюються заново."],
      ["Frühere Protokolle: Menü → „{protocols}“, dann das gewünschte antippen.", "Earlier records: Menu → “{protocols}”, then tap the one you need.", "Registros anteriores: Menú → «{protocols}» y toca el que necesites.", "Registri precedenti: Menu → «{protocols}», poi tocca quello che ti serve.", "Попередні протоколи: Меню → «{protocols}», далі торкніться потрібного."],
    ],
  },
  {
    title: ["Projektdaten", "Project details", "Datos del proyecto", "Dati del progetto", "Дані проєкту"],
    steps: [
      ["Projekt, Datum und nach Bedarf Nummer, Instrument, Messtrupp, Temperatur und Luftdruck eintragen.", "Enter the project, date and, as needed, number, instrument, crew, temperature and air pressure.", "Introduce proyecto, fecha y, si hace falta, número, instrumento, equipo, temperatura y presión.", "Inserisci progetto, data e, se servono, numero, strumento, squadra, temperatura e pressione.", "Впишіть проєкт, дату і за потреби номер, прилад, бригаду, температуру й тиск."],
      ["Minusgrade: Zahl eingeben und rechts im Feld „±“ antippen.", "Below zero: type the number, then tap “±” on the right of the field.", "Bajo cero: escribe el número y toca «±» a la derecha del campo.", "Sotto zero: scrivi il numero e tocca «±» a destra del campo.", "Мороз: введіть число й торкніться «±» праворуч у полі."],
      ["Nicht benötigte Felder lassen sich unter Menü → „{settings}“ ausblenden.", "Fields you do not need can be hidden in Menu → “{settings}”.", "Los campos que no necesites se ocultan en Menú → «{settings}».", "I campi che non ti servono si nascondono in Menu → «{settings}».", "Непотрібні поля можна приховати: Меню → «{settings}»."],
    ],
  },
  {
    title: ["Standpunkte", "Stations", "Estaciones", "Stazioni", "Станції"],
    steps: [
      ["Unten „{station}“ wählen: Der neue Block erscheint nach dem letzten Standpunkt.", "Choose “{station}” at the bottom: the new block appears after the last station.", "Pulsa «{station}» abajo: el nuevo bloque aparece al final.", "Tocca «{station}» in basso: il nuovo blocco appare dopo l’ultima stazione.", "Натисніть «{station}» унизу: новий блок з’явиться після останньої станції."],
      ["Punktnummer und Instrumentenhöhe in Metern eingeben; die Uhrzeit wird automatisch gesetzt.", "Enter the point number and instrument height in metres; the time is set automatically.", "Introduce el número de punto y la altura del instrumento en metros; la hora se pone sola.", "Inserisci numero del punto e altezza strumentale in metri; l’ora viene impostata da sola.", "Введіть номер пункту й висоту приладу в метрах; час ставиться автоматично."],
      ["Einen Standpunkt entfernen: im Block ganz unten „{deleteStation}“.", "To remove a station, use “{deleteStation}” at the bottom of its block.", "Para quitar una estación, usa «{deleteStation}» al final de su bloque.", "Per rimuovere una stazione usa «{deleteStation}» in fondo al blocco.", "Щоб прибрати станцію, натисніть «{deleteStation}» унизу її блоку."],
    ],
  },
  {
    title: ["Zielpunkte", "Target points", "Puntos visados", "Punti collimati", "Цільові пункти"],
    steps: [
      ["Die orangefarbene Taste unten fügt einen Zielpunkt zum letzten Standpunkt hinzu; für einen anderen Standpunkt dessen „{add}“ verwenden.", "The orange button at the bottom adds a target to the last station; for another station use its “{add}” button.", "El botón naranja añade un punto a la última estación; para otra estación usa su botón «{add}».", "Il pulsante arancione aggiunge un punto all’ultima stazione; per un’altra stazione usa il suo «{add}».", "Помаранчева кнопка внизу додає пункт до останньої станції; для іншої станції натисніть «{add}» у її блоці."],
      ["Punktnummer und Zielhöhe eingeben und „{save}“ wählen.", "Enter the point number and target height and choose “{save}”.", "Introduce el número de punto y la altura y pulsa «{save}».", "Inserisci numero del punto e altezza e tocca «{save}».", "Введіть номер пункту й висоту цілі та натисніть «{save}»."],
      ["Ändern: den Zielpunkt in der Liste antippen.", "To change a target, tap it in the list.", "Para cambiar un punto, tócalo en la lista.", "Per modificare un punto, toccalo nell’elenco.", "Щоб змінити пункт, торкніться його у списку."],
      ["Löschen: Zielpunkt antippen und unten „{deleteTarget}“ wählen.", "To delete it, tap the target and choose “{deleteTarget}” at the bottom.", "Para borrarlo, tócalo y elige «{deleteTarget}» abajo.", "Per eliminarlo, toccalo e scegli «{deleteTarget}» in basso.", "Щоб видалити, торкніться пункту й виберіть унизу «{deleteTarget}»."],
    ],
  },
  {
    title: ["Prisma, Punktart, {RB} und {AP}", "Prism, point type, {RB} and {AP}", "Prisma, tipo de punto, {RB} y {AP}", "Prisma, tipo di punto, {RB} e {AP}", "Призма, тип пункту, {RB} та {AP}"],
    steps: [
      ["„{prismSelection}“ zeigt Kürzel, Namen und Leica-Konstante jedes Prismas.", "“{prismSelection}” shows the abbreviation, name and Leica constant of each prism.", "«{prismSelection}» muestra la abreviatura, el nombre y la constante Leica de cada prisma.", "«{prismSelection}» mostra abbreviazione, nome e costante Leica di ogni prisma.", "«{prismSelection}» показує скорочення, назву й константу Leica кожної призми."],
      ["Unter „{pointType}“ eine Punktart aus der Liste wählen. Eine eigene Punktart: „{customPointType}“ wählen, Kürzel und Beschreibung eingeben. Danach steht sie in der Liste und in der PDF-Legende.", "Choose a point type from the list under “{pointType}”. For your own type, choose “{customPointType}” and enter an abbreviation and description. It then appears in the list and in the PDF legend.", "Elige un tipo de punto de la lista en «{pointType}». Para uno propio, elige «{customPointType}» y escribe abreviatura y descripción. Después aparece en la lista y en la leyenda del PDF.", "Scegli un tipo di punto dall’elenco in «{pointType}». Per uno tuo, scegli «{customPointType}» e inserisci abbreviazione e descrizione. Poi compare nell’elenco e nella legenda del PDF.", "У полі «{pointType}» виберіть тип пункту зі списку. Власний тип: виберіть «{customPointType}» і введіть скорочення та опис. Далі він буде у списку й у легенді PDF."],
      ["{RB} (Rückblick) oder {AP} (Anschlusspunkt) bei Bedarf ankreuzen; beides zugleich ist nicht möglich.", "Tick {RB} (backsight) or {AP} (connection point) when needed; the two cannot be combined.", "Marca {RB} o {AP} si hace falta; no pueden activarse a la vez.", "Spunta {RB} o {AP} se serve; non si possono attivare insieme.", "За потреби позначте {RB} або {AP}; одночасно обидва вибрати не можна."],
    ],
  },
  {
    title: ["Schneller eingeben: Vorschläge", "Faster entry: suggestions", "Entrada más rápida: sugerencias", "Inserimento più rapido: suggerimenti", "Швидше введення: підказки"],
    steps: [
      ["Beim Anlegen eines Zielpunkts erscheinen oben bis zu 12 zuletzt verwendete Kombinationen: Antippen übernimmt alle Werte.", "When adding a target, up to 12 recent combinations appear at the top: tap one to fill in all values.", "Al añadir un punto aparecen arriba hasta 12 combinaciones recientes: toca una para rellenar todos los valores.", "Quando aggiungi un punto compaiono in alto fino a 12 combinazioni recenti: toccane una per inserire tutti i valori.", "Під час додавання пункту вгорі з’являються до 12 останніх комбінацій: торкніться потрібної, і всі значення підставляться."],
      ["Beim Tippen einer Punktnummer werden früher verwendete Punkte vorgeschlagen.", "While typing a point number, points you have used before are suggested.", "Al escribir un número de punto se sugieren los que ya has usado.", "Mentre scrivi un numero di punto vengono suggeriti quelli già usati.", "Під час введення номера пропонуються пункти, які ви вже використовували."],
      ["Vorschläge ändern oder löschen: Menü → „{values}“. Bestehende Protokolle ändern sich dadurch nicht.", "To change or delete suggestions, open Menu → “{values}”. Existing records are not affected.", "Para cambiar o borrar sugerencias: Menú → «{values}». Los registros existentes no cambian.", "Per modificare o eliminare i suggerimenti: Menu → «{values}». I registri esistenti non cambiano.", "Змінити або видалити підказки: Меню → «{values}». Уже записані протоколи при цьому не змінюються."],
    ],
  },
  {
    title: ["PDF erstellen", "Create the PDF", "Crear el PDF", "Creare il PDF", "Створення PDF"],
    steps: [
      ["Unten „PDF“ wählen.", "Choose “PDF” at the bottom.", "Pulsa «PDF» abajo.", "Tocca «PDF» in basso.", "Натисніть «PDF» унизу."],
      ["Hat das Protokoll mehrere Blätter, lassen sich unter „{pageWeather}“ Uhrzeit, Temperatur und Luftdruck je Blatt eintragen.", "If the record has several sheets, enter the time, temperature and air pressure of each sheet under “{pageWeather}”.", "Si el registro tiene varias hojas, indica hora, temperatura y presión de cada una en «{pageWeather}».", "Se il registro ha più fogli, inserisci ora, temperatura e pressione di ciascuno in «{pageWeather}».", "Якщо в протоколі кілька аркушів, у блоці «{pageWeather}» можна вказати час, температуру й тиск для кожного."],
      ["„{viewPrint}“ öffnet das PDF zum Ansehen und Drucken; „{saveShare}“ speichert die Datei oder sendet sie weiter.", "“{viewPrint}” opens the PDF to view and print; “{saveShare}” saves the file or sends it on.", "«{viewPrint}» abre el PDF para verlo e imprimirlo; «{saveShare}» guarda el archivo o lo envía.", "«{viewPrint}» apre il PDF per vederlo e stamparlo; «{saveShare}» salva il file o lo invia.", "«{viewPrint}» відкриває PDF для перегляду й друку; «{saveShare}» зберігає файл або надсилає його."],
      ["Das PDF ist A4 quer mit Legende; Höhen stehen mit drei Nachkommastellen, der Dateiname enthält Projekt und Datum.", "The PDF is A4 landscape with a legend; heights have three decimals and the file name contains the project and date.", "El PDF es A4 horizontal con leyenda; las alturas llevan tres decimales y el nombre del archivo incluye proyecto y fecha.", "Il PDF è A4 orizzontale con legenda; le altezze hanno tre decimali e il nome del file contiene progetto e data.", "PDF має формат A4 альбомно з легендою; висоти подано з трьома знаками після коми, а назва файлу містить проєкт і дату."],
    ],
  },
  {
    title: ["Eigenes Firmenlogo", "Your company logo", "Logotipo de tu empresa", "Logo della tua azienda", "Власний логотип компанії"],
    steps: [
      ["Unter „{projectData}“ „{uploadLogo}“ antippen und ein Bild auswählen.", "Under “{projectData}”, tap “{uploadLogo}” and pick an image.", "En «{projectData}», toca «{uploadLogo}» y elige una imagen.", "In «{projectData}» tocca «{uploadLogo}» e scegli un’immagine.", "У блоці «{projectData}» натисніть «{uploadLogo}» і виберіть зображення."],
      ["Optional einen Text unter dem Logo eintragen, zum Beispiel den Firmennamen.", "Optionally add a line of text below the logo, such as the company name.", "Si quieres, añade un texto bajo el logotipo, por ejemplo el nombre de la empresa.", "Se vuoi, aggiungi un testo sotto il logo, ad esempio il nome dell’azienda.", "За бажанням додайте текст під логотипом, наприклад назву компанії."],
      ["Das Logo gilt für alle Protokolle. Mit dem Häkchen „{showLogo}“ lässt es sich für ein einzelnes Protokoll ausblenden.", "The logo applies to all records. Untick “{showLogo}” to hide it for a single record.", "El logotipo vale para todos los registros. Desmarca «{showLogo}» para ocultarlo en un registro concreto.", "Il logo vale per tutti i registri. Togli la spunta a «{showLogo}» per nasconderlo in un singolo registro.", "Логотип діє для всіх протоколів. Зніміть галочку «{showLogo}», щоб приховати його в окремому протоколі."],
    ],
  },
  {
    title: ["Einstellungen, Sprache und Design", "Settings, language and theme", "Ajustes, idioma y tema", "Impostazioni, lingua e tema", "Налаштування, мова й тема"],
    steps: [
      ["Menü → „{settings}“ → „{projectFields}“: nicht benötigte Felder ausschalten. Sie verschwinden aus dem Formular und aus dem PDF.", "Menu → “{settings}” → “{projectFields}”: switch off the fields you do not need. They disappear from the form and from the PDF.", "Menú → «{settings}» → «{projectFields}»: desactiva los campos que no necesites. Desaparecen del formulario y del PDF.", "Menu → «{settings}» → «{projectFields}»: disattiva i campi che non ti servono. Spariscono dal modulo e dal PDF.", "Меню → «{settings}» → «{projectFields}»: вимкніть непотрібні поля. Вони зникнуть із форми та з PDF."],
      ["Menü → „{settings}“: unter „{standardPointTypes}“ nicht benötigte Punktarten ausblenden, unter „{customPointTypes}“ eigene entfernen.", "Menu → “{settings}”: hide unneeded types under “{standardPointTypes}” and remove your own under “{customPointTypes}”.", "Menú → «{settings}»: oculta los tipos que no uses en «{standardPointTypes}» y quita los tuyos en «{customPointTypes}».", "Menu → «{settings}»: nascondi i tipi che non usi in «{standardPointTypes}» e rimuovi i tuoi in «{customPointTypes}».", "Меню → «{settings}»: непотрібні типи приховайте в «{standardPointTypes}», а власні видаляйте в «{customPointTypes}»."],
      ["Design: im Menü unten Dunkel, Hell oder „{themeAuto}“ (wie das Gerät) wählen.", "Theme: at the bottom of the menu choose Dark, Light or “{themeAuto}” (follows the device).", "Tema: al final del menú elige Oscuro, Claro o «{themeAuto}» (como el dispositivo).", "Tema: in fondo al menu scegli Scuro, Chiaro o «{themeAuto}» (come il dispositivo).", "Тема: унизу меню виберіть темну, світлу або «{themeAuto}» (як на пристрої)."],
      ["Sprache: oben rechts die Sprachtaste (DE, EN …) antippen und eine Sprache wählen. Sie gilt auch für das PDF.", "Language: tap the language button (DE, EN …) at the top right and pick a language. It also applies to the PDF.", "Idioma: toca el botón de idioma (DE, EN …) arriba a la derecha y elige uno. También se aplica al PDF.", "Lingua: tocca il pulsante della lingua (DE, EN …) in alto a destra e scegline una. Vale anche per il PDF.", "Мова: торкніться кнопки мови (DE, EN …) вгорі праворуч і виберіть мову. Вона діє і для PDF."],
    ],
  },
  {
    title: ["Sicherung und neues Gerät", "Backup and a new device", "Copia de seguridad y dispositivo nuevo", "Backup e nuovo dispositivo", "Резервні копії та новий пристрій"],
    steps: [
      ["Die Daten liegen nur in diesem Browser auf diesem Gerät. Browserdaten nicht ohne eigene Sicherung löschen.", "Your data lives only in this browser on this device. Do not clear browser data without a backup of your own.", "Los datos están solo en este navegador de este dispositivo. No borres los datos del navegador sin una copia propia.", "I dati si trovano solo in questo browser su questo dispositivo. Non cancellare i dati del browser senza una copia tua.", "Дані зберігаються лише в цьому браузері на цьому пристрої. Не очищайте дані браузера без власної копії."],
      ["Von Hand: Menü → „{backupMenu}“ → „{createBackup}“ und die Datei außerhalb des Browsers sichern, z. B. in „Dateien“, in einer Cloud oder per Mail.", "By hand: Menu → “{backupMenu}” → “{createBackup}”, then keep the file outside the browser, for example in Files, a cloud drive or an e-mail.", "A mano: Menú → «{backupMenu}» → «{createBackup}» y guarda el archivo fuera del navegador, por ejemplo en Archivos, en la nube o por correo.", "A mano: Menu → «{backupMenu}» → «{createBackup}», poi conserva il file fuori dal browser, ad esempio in File, in un cloud o per e-mail.", "Вручну: Меню → «{backupMenu}» → «{createBackup}», далі збережіть файл поза браузером, наприклад у «Файли», у хмарі або поштою."],
      ["Ist eine Sicherung fällig, erscheint am Menüknopf ein orangefarbener Punkt.", "When a backup is due, an orange dot appears on the menu button.", "Cuando toca hacer una copia, aparece un punto naranja en el botón del menú.", "Quando serve un backup, sul pulsante del menu compare un punto arancione.", "Коли час зробити копію, на кнопці меню з’являється помаранчева крапка."],
      ["Neues Gerät oder anderer Browser: Menü → „{backupMenu}“ → „{restoreFile}“ und die Sicherungsdatei wählen.", "New device or another browser: Menu → “{backupMenu}” → “{restoreFile}” and pick the backup file.", "Dispositivo o navegador nuevo: Menú → «{backupMenu}» → «{restoreFile}» y elige el archivo de copia.", "Nuovo dispositivo o altro browser: Menu → «{backupMenu}» → «{restoreFile}» e scegli il file di backup.", "Новий пристрій чи інший браузер: Меню → «{backupMenu}» → «{restoreFile}» і виберіть файл копії."],
      ["Zwei Geräte werden nicht miteinander synchronisiert.", "Two devices are not synchronised with each other.", "Dos dispositivos no se sincronizan entre sí.", "Due dispositivi non si sincronizzano tra loro.", "Два пристрої між собою не синхронізуються."],
    ],
  },
  {
    title: ["Löschen und rückgängig machen", "Deleting and undoing", "Borrar y deshacer", "Eliminare e annullare", "Видалення та скасування"],
    steps: [
      ["Ein Protokoll löschen: Menü → „{protocols}“ und rechts in der Zeile „×“ antippen.", "To delete a record, open Menu → “{protocols}” and tap “×” on the right of its row.", "Para borrar un registro: Menú → «{protocols}» y toca «×» a la derecha de su fila.", "Per eliminare un registro: Menu → «{protocols}» e tocca «×» a destra della riga.", "Щоб видалити протокол, відкрийте Меню → «{protocols}» і торкніться «×» праворуч у рядку."],
      ["Vor jedem Löschen fragt die App nach und sichert den aktuellen Stand.", "The app asks before every deletion and keeps the current state.", "La app pregunta antes de borrar y guarda el estado actual.", "L’app chiede conferma prima di eliminare e conserva lo stato attuale.", "Перед кожним видаленням застосунок перепитує і зберігає поточний стан."],
      ["Versehentlich gelöscht? Menü → „{backupMenu}“ → „{snapshots}“ und beim gewünschten Zeitpunkt „{restore}“ wählen.", "Deleted by mistake? Open Menu → “{backupMenu}” → “{snapshots}” and choose “{restore}” next to the moment you need.", "¿Borrado por error? Menú → «{backupMenu}» → «{snapshots}» y pulsa «{restore}» en el momento que necesites.", "Eliminato per errore? Menu → «{backupMenu}» → «{snapshots}» e scegli «{restore}» accanto al momento che ti serve.", "Видалили помилково? Меню → «{backupMenu}» → «{snapshots}» і натисніть «{restore}» біля потрібного моменту."],
    ],
  },
];

export function InstructionGuide({children}:{children?:React.ReactNode}){
  const {language,t}=useLanguage();
  const column=LANGUAGES.indexOf(language);
  const prisms=remarkChoices(language);
  const pointTypes=pointTypeChoices(language);
  const fill=(text:string)=>text.replace(/\{(\w+)\}/g,(_,key:string)=>key==="RB"||key==="AP" ? abbreviation(key,language) : t(key as MessageKey).replace(/^[+＋]\s*/,""));
  return <div className="modal-scroll instruction-guide">
    {GUIDE.map((section,index)=><article key={index}><h3>{index+1}. {fill(section.title[column])}</h3><ol>{section.steps.map((step,stepIndex)=><li key={stepIndex}>{fill(step[column])}</li>)}</ol></article>)}
    <article><h3>{GUIDE.length+1}. {t("install")}</h3><p><b>iPhone:</b> {t("iphoneInstall")}</p><p><b>Android:</b> {t("androidInstall")}</p><p>{t("offlineInstall")}</p></article>
    <article><h3>{GUIDE.length+2}. {({de:"Abkürzungen",en:"Abbreviations",es:"Abreviaturas",it:"Abbreviazioni",uk:"Скорочення"})[language]}</h3>
      <dl className="abbreviation-list"><dt>{abbreviation("RB",language)}</dt><dd>{t("backsight")}</dd><dt>{abbreviation("AP",language)}</dt><dd>{t("connection")}</dd>
        {pointTypes.map(type=><div key={type.value}><dt>{type.label}</dt><dd>{type.detail}</dd></div>)}
        {prisms.map(prism=><div key={prism.value}><dt>{prismAbbreviation(prism.value,language)}</dt><dd>{prism.name} · {prism.detail}</dd></div>)}
      </dl>
    </article>
    {children}
  </div>;
}
