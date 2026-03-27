import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType,
  VerticalAlign, HeadingLevel, PageNumber, PageBreak
} from 'docx';
import fs from 'fs';

// Load the logo
const logoPath = '/private/tmp/benji-ref-unpacked/word/media/image1.png';
const logoData = fs.readFileSync(logoPath);

// Company colors (blue tones for fish store)
const PRIMARY_COLOR = "1B5E90";    // Deep ocean blue
const SECONDARY_COLOR = "2E86C1";  // Medium blue
const ACCENT_COLOR = "AED6F1";     // Light blue
const HEADER_BG = "1B5E90";        // Header background
const ROW_BG = "EAF4FB";           // Alternating row background

// Border definition
const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
};

// Helper: header cell (white text on blue background)
function headerCell(text, width) {
  return new TableCell({
    borders: cellBorder,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22, font: "Arial" })]
    })]
  });
}

// Helper: data cell
function dataCell(text, width, bgColor, align, bold) {
  return new TableCell({
    borders: cellBorder,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bgColor || "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align || AlignmentType.RIGHT,
      children: [new TextRun({ text, size: 20, font: "Arial", bold: bold || false })]
    })]
  });
}

// Table width: 9360 (US Letter with 1" margins)
// Three columns: day 1440, morning 3960, evening 3960
const tableWidth = 9360;
const dayColW = 1440;
const mornColW = 3960;
const eveColW = 3960;

// Feeding Schedule
const feedingSchedule = [
  { day: "ראשון", morning: "האכלת טחון - 2 כפות לכל 10 ליטר", evening: "בדיקת pH ואמוניה" },
  { day: "שני", morning: "האכלת פתיתים - כמות קטנה", evening: "האכלת טחון - 1 כף לכל 10 ליטר" },
  { day: "שלישי", morning: "האכלת כיח / חי", evening: "החלפת 20% מהמים" },
  { day: "רביעי", morning: "יום צום - ניקוי מסנן", evening: "בדיקת טמפרטורה וחנקות" },
  { day: "חמישי", morning: "האכלת פתיתים - כמות קטנה", evening: "האכלת טחון - 1 כף לכל 10 ליטר" },
  { day: "שישי", morning: "האכלת כיח / חי", evening: "בדיקת מים מלאה" },
  { day: "שבת", morning: "האכלת פתיתים - כמות מינימלית", evening: "מנוחה - צפייה בדגים" },
];

function buildFeedingRow(item, rowIndex) {
  const bg = rowIndex % 2 === 0 ? "FFFFFF" : ROW_BG;
  return new TableRow({
    children: [
      dataCell(item.day, dayColW, bg, AlignmentType.CENTER, true),
      dataCell(item.morning, mornColW, bg, AlignmentType.RIGHT),
      dataCell(item.evening, eveColW, bg, AlignmentType.RIGHT),
    ]
  });
}

const feedingTable = new Table({
  width: { size: tableWidth, type: WidthType.DXA },
  columnWidths: [dayColW, mornColW, eveColW],
  rows: [
    new TableRow({
      children: [
        headerCell("יום", dayColW),
        headerCell("האכלה - בוקר", mornColW),
        headerCell("האכלה / משימה - ערב", eveColW),
      ]
    }),
    ...feedingSchedule.map((item, i) => buildFeedingRow(item, i))
  ]
});

// Daily task checklists
const morningTasks = [
  "בדיקת טמפרטורת המים",
  "בדיקת תאורה ומחשמל",
  "האכלה בוקר",
  "הסרת מזון שלא נאכל",
  "בדיקת בריאות הדגים",
  "ניקוי שמשות מבחוץ",
];

const eveningTasks = [
  "האכלה ערב (לפי לוח)",
  "בדיקת pH (פעמיים בשבוע)",
  "בדיקת אמוניה (פעמיים בשבוע)",
  "כיבוי תאורה בשעה קבועה",
  "בדיקת ציוד סינון",
  "רישום יומן תצפיות",
];

// Build checklist cell content
function buildChecklistCellContent(title, items) {
  const paragraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 120 },
      children: [new TextRun({ text: title, bold: true, size: 24, font: "Arial", color: "FFFFFF" })]
    })
  ];
  items.forEach(item => {
    paragraphs.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({ text: "[ ] ", size: 20, font: "Courier New", bold: false }),
        new TextRun({ text: item, size: 20, font: "Arial" })
      ]
    }));
  });
  return paragraphs;
}

const halfWidth = 4680;
const checklistTable = new Table({
  width: { size: tableWidth, type: WidthType.DXA },
  columnWidths: [halfWidth, halfWidth],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorder,
          width: { size: halfWidth, type: WidthType.DXA },
          shading: { fill: SECONDARY_COLOR, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 200, left: 160, right: 160 },
          children: buildChecklistCellContent("משימות בוקר", morningTasks),
        }),
        new TableCell({
          borders: cellBorder,
          width: { size: halfWidth, type: WidthType.DXA },
          shading: { fill: SECONDARY_COLOR, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 200, left: 160, right: 160 },
          children: buildChecklistCellContent("משימות ערב", eveningTasks),
        }),
      ]
    })
  ]
});

// Important notes
const importantNotes = [
  "אין להאכיל יתר על המידה - עודף מזון מזהם את המים",
  "יש לשמור על טמפרטורה קבועה בין 24-28 מעלות",
  "החלפת מים - 20-25% בשבוע",
  "ניקוי מסנן ביולוגי - אחת לחודש בלבד",
  "בדיקת מים מלאה - פעם בשבוע",
  "תרופות - רק לפי הוראות מומחה",
];

const notesTableRows = importantNotes.map((note, i) => {
  const bg = i % 2 === 0 ? "FFFFFF" : ROW_BG;
  return new TableRow({
    children: [
      new TableCell({
        borders: cellBorder,
        width: { size: 800, type: WidthType.DXA },
        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `${i + 1}`, bold: true, color: "FFFFFF", size: 20, font: "Arial" })]
        })]
      }),
      new TableCell({
        borders: cellBorder,
        width: { size: tableWidth - 800, type: WidthType.DXA },
        shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: note, size: 20, font: "Arial" })]
        })]
      }),
    ]
  });
});

const notesTable = new Table({
  width: { size: tableWidth, type: WidthType.DXA },
  columnWidths: [800, tableWidth - 800],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorder,
          width: { size: 800, type: WidthType.DXA },
          shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "#", bold: true, color: "FFFFFF", size: 22, font: "Arial" })]
          })]
        }),
        new TableCell({
          borders: cellBorder,
          width: { size: tableWidth - 800, type: WidthType.DXA },
          shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "הערה חשובה", bold: true, color: "FFFFFF", size: 22, font: "Arial" })]
          })]
        }),
      ]
    }),
    ...notesTableRows
  ]
});

// Section heading helper
function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 280, after: 140 },
    alignment: AlignmentType.RIGHT,
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: SECONDARY_COLOR, space: 1 }
    },
    children: [new TextRun({
      text,
      bold: true,
      size: 28,
      font: "Arial",
      color: PRIMARY_COLOR
    })]
  });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_COLOR, space: 1 }
              },
              spacing: { after: 100 },
              children: [
                new ImageRun({
                  type: "png",
                  data: logoData,
                  transformation: { width: 200, height: 60 },
                  altText: { title: "בנגי דגים", description: "לוגו חנות בנגי דגים", name: "logo" }
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: {
                top: { style: BorderStyle.SINGLE, size: 4, color: PRIMARY_COLOR, space: 1 }
              },
              spacing: { before: 100 },
              children: [
                new TextRun({ text: "בנגי דגים - נהלי האכלה שבועיים  |  עמוד ", size: 18, color: "666666", font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "666666", font: "Arial" }),
                new TextRun({ text: " מתוך ", size: 18, color: "666666", font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "666666", font: "Arial" }),
              ]
            })
          ]
        })
      },
      children: [
        // Main Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({ text: "נהלי האכלה שבועיים", bold: true, size: 52, font: "Arial", color: PRIMARY_COLOR })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [
            new TextRun({ text: "בנגי דגים - המדריך המלא לטיפול שבועי", size: 26, font: "Arial", color: SECONDARY_COLOR })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [
            new TextRun({ text: `עודכן: ${new Date().toLocaleDateString('he-IL')}`, size: 20, font: "Arial", color: "888888" })
          ]
        }),

        // Section 1: Feeding Schedule
        sectionHeading("לוח האכלה השבועי"),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 80, after: 160 },
          children: [new TextRun({ text: "הלוח הבא מפרט את תדירות ואופן ההאכלה לכל יום בשבוע:", size: 20, font: "Arial" })]
        }),
        feedingTable,

        // Section 2: Daily Task Checklists
        sectionHeading("רשימות משימות יומיות"),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 80, after: 160 },
          children: [new TextRun({ text: "סמן כל משימה לאחר ביצועה. שתי עמודות - בוקר וערב:", size: 20, font: "Arial" })]
        }),
        checklistTable,

        // Section 3: Important Notes
        sectionHeading("הערות חשובות ועקרונות בסיסיים"),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 80, after: 160 },
          children: [new TextRun({ text: "יש להקפיד על הכללים הבאים לשמירה על בריאות הדגים:", size: 20, font: "Arial" })]
        }),
        notesTable,

        // Contact info at bottom
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 80 },
          children: [
            new TextRun({ text: "לשאלות נוספות - פנה לצוות בנגי דגים: ", size: 18, color: "666666", font: "Arial" }),
            new TextRun({ text: "03-1234567", bold: true, size: 18, color: PRIMARY_COLOR, font: "Arial" })
          ]
        }),
      ]
    }
  ]
});

const outputPath = '/tmp/benji-dagim-docx-workspace/iteration-1/eval-0-feeding-procedures/with_skill/outputs/feeding_procedures.docx';
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log('Document created successfully:', outputPath);
  console.log('File size:', buffer.length, 'bytes');
}).catch(err => {
  console.error('Error creating document:', err.message);
  console.error(err.stack);
  process.exit(1);
});
