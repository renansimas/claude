import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars"
    );
  }

  const key = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId() {
  const sheetId = process.env.BOLAO_SHEET_ID;
  if (!sheetId) {
    throw new Error("Missing BOLAO_SHEET_ID env var");
  }
  return sheetId;
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export async function readSheet(tabName: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: tabName,
  });
  return (res.data.values as string[][]) ?? [];
}

export async function appendRow(
  tabName: string,
  headers: string[],
  row: Record<string, string | number | boolean>
): Promise<void> {
  const sheets = getSheetsClient();
  const values = headers.map((h) => String(row[h] ?? ""));
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: tabName,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function updateRowById(
  tabName: string,
  headers: string[],
  idColumn: string,
  idValue: string,
  patch: Record<string, string | number | boolean>
): Promise<boolean> {
  const sheets = getSheetsClient();
  const rows = await readSheet(tabName);
  const idIndex = headers.indexOf(idColumn);

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] === idValue) {
      targetRowIndex = i;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return false;
  }

  const existingRow = rows[targetRowIndex];
  const updatedRow = headers.map((h, colIndex) => {
    if (h in patch) return String(patch[h]);
    return existingRow[colIndex] ?? "";
  });

  const rowNumber = targetRowIndex + 1; // 1-indexed in the sheet
  const lastColLetter = columnLetter(headers.length);
  const range = `${tabName}!A${rowNumber}:${lastColLetter}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [updatedRow] },
  });

  return true;
}

function columnLetter(colCount: number): string {
  let result = "";
  let n = colCount;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}
