import * as cheerio from "cheerio";

export interface StudentInfo {
  name: string;
  code: string;
  imageUrl: string;
  Code: string;
  Filière: string;
  Niveau: string;
  Statut: string;
  Section: string;
  Groupe: string;
  "Sous Groupe": string;
  "CNE/Masar": string;
  Nom: string;
  Prénom: string;
  "Nom Arabe": string;
  "Prénom Arabe": string;
  CIN: string;
  Sexe: string;
  "Date Naissance": string;
  Email: string;
  Téléphone: string;
  "Série BAC": string;
  "Année BAC": string;
  "Niveau Accès": string;
  "Annee Accès": string;
  "Voie Accès": string;
  Nationalité: string;
  Académie: string;
  Lieu_Naissance: string;
  Prof_Père: string;
  Prof_Mère: string;
  Adr_Parents: string;
  Ville: string;
  Tel_Parents: string;
}

export interface VerifyResponse {
  success: boolean;
  status: number;
  authenticated: boolean;
  studentInfo: StudentInfo | null;
  message: string;
}

export function extractStudentInfo(html: string): StudentInfo {
  const $ = cheerio.load(html);

  // Extract basic info from sidebar
  const name = $(".user-panel .info span.d-block").first().text().trim();
  const code = $(".user-panel .image img").attr("src")?.split("/").pop() || "";
  const imageUrl = $(".user-panel .image img").attr("src") || "";

  const table = $("table.table.table-striped.table-sm tbody");
  const data: Record<string, string> = {};

  // Loop over each table row <tr>
  table.find("tr").each((_, tr) => {
    const key = $(tr).find("th").text().trim();
    const value = $(tr).find("td").text().trim();
    data[key] = value;
  });

  // const table2 = $("table table-striped table-sm tbody");
  // table2.find("tr").each((_, tr) => {
  //   const key = $(tr).find("th").text().trim();
  //   const value = $(tr).find("td").text().trim();
  //   data[key] = value;
  // });

  return {
    name,
    code,
    imageUrl,
    Code: data["Code"] || code,
    Filière: data["Filière"] || "",
    Niveau: data["Niveau"] || "",
    Statut: data["Statut"] || "",
    Section: data["Section"] || "",
    Groupe: data["Groupe"] || "",
    "Sous Groupe": data["Sous Groupe"] || "",
    "CNE/Masar": data["CNE/Masar"] || "",
    Nom: data["Nom"] || "",
    Prénom: data["Prénom"] || "",
    "Nom Arabe": data["Nom Arabe"] || "",
    "Prénom Arabe": data["Prénom Arabe"] || "",
    CIN: data["CIN"] || "",
    Sexe: data["Sexe"] || "",
    "Date Naissance": data["Date Naissance"] || "",
    Email: data["Email"] || "",
    Téléphone: data["Téléphone"] || "",
    "Série BAC": data["Série BAC"] || "",
    "Année BAC": data["Année BAC"] || "",
    "Niveau Accès": data["Niveau Accès"] || "",
    "Annee Accès": data["Annee Accès"] || "",
    "Voie Accès": data["Voie Accès"] || "",
    Nationalité: data["Nationalité"] || "",
    Académie: data["Académie"] || "",
    Lieu_Naissance: data["Lieu_Naissance"] || "",
    Prof_Père: data["Prof_Père"] || "",
    Prof_Mère: data["Prof_Mère"] || "",
    Adr_Parents: data["Adr_Parents"] || "",
    Ville: data["Ville"] || "",
    Tel_Parents: data["Tel_Parents"] || "",
  };
}

export interface Mark {
  elementCode: string;
  academicYear: string;
  ccMark: string;
  examMark: string;
  tpMark: string;
  moySO: string;
  ratMark: string;
  moySR: string;
  finalMark: string;
  decision: string;
}

export function extractMarks(html: string): Mark[] {
  const $ = cheerio.load(html);
  const marks: Mark[] = [];
  // Find the table with marks data
  const table = $('h4:contains("Notes des elements en cours")')
    .closest(".content-header")
    .nextAll("section.content")
    .find("table.table-striped");

  // Extract data from each row
  table.find("tbody tr").each((i, row) => {
    const tds = $(row).find("td");

    marks.push({
      elementCode: $(tds[0]).text().trim(),
      academicYear: $(tds[1]).text().trim(),
      ccMark: $(tds[2]).text().trim(),
      examMark: $(tds[3]).text().trim(),
      tpMark: $(tds[4]).text().trim(),
      moySO: $(tds[5]).text().trim(),
      ratMark: $(tds[6]).text().trim(),
      moySR: $(tds[7]).text().trim(),
      finalMark: $(tds[8]).text().trim(),
      decision: $(tds[9]).text().trim(),
    });
  });

  return marks;
};

interface YearInfo {
  niveau: string;
  filiere: string;
  au: string;
  statut: string;
  moyenne: string;
  pj: string;
  decision: string;
  classement: string;
  releveUrl: string;
}

export function extractYears(html: string): YearInfo[] {
  const $ = cheerio.load(html);
  const rows = $("table tbody tr");
  const result: YearInfo[] = [];

  rows.each((_, row) => {
    const cols = $(row).find("td");

    result.push({
      niveau: $(cols[0]).text().trim(),
      filiere: $(cols[1]).text().trim(),
      au: $(cols[2]).text().trim(),
      statut: $(cols[3]).text().trim(),
      moyenne: $(cols[4]).text().trim(),
      pj: $(cols[5]).text().trim(),
      decision: $(cols[6]).text().trim(),
      classement: $(cols[7]).text().trim(),
      releveUrl: $(cols[8]).find("a").attr("href") ?? "",
    });
  });

  return result;
}

export interface Element {
  codeElem: string;
  intitule: string;
  vhCTD: string;
  vhTP: string;
  vhEval: string;
  coefCC: string;
  coefEX: string;
  coefEcrit: string;
  coefTP: string;
  coefEelem: string;
}

export interface Module {
  codeMod: string;
  intitule: string;
  descriptif: string;
  niveau: string;
  semestre: string;
  vhMod: string;
  coefMod: string;
  seuil: string;
  eliminatoire: string;
  elements: Element[];
}

export interface StudyPlanOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface StudyPlanData {
  csrfToken: string;
  levels: StudyPlanOption[];
  programs: StudyPlanOption[];
  semesters: StudyPlanOption[];
  selectedLevel: string;
  selectedProgram: string;
  selectedSemester: string;
  modules: Module[];
}

export function extractStudyPlan(html: string): StudyPlanData {
  const $ = cheerio.load(html);
  
  // Extract CSRF token
  const csrfToken = $('input[name="_csrf"]').val() as string;

  // Extract levels
  const levels: StudyPlanOption[] = [];
  $('#niveau option').each((_, option) => {
    levels.push({
      value: $(option).attr('value') || '',
      label: $(option).text().trim(),
      selected: $(option).is(':selected')
    });
  });

  // Extract programs
  const programs: StudyPlanOption[] = [];
  $('#filiere option').each((_, option) => {
    programs.push({
      value: $(option).attr('value') || '',
      label: $(option).text().trim(),
      selected: $(option).is(':selected')
    });
  });

  // Extract semesters
  const semesters: StudyPlanOption[] = [];
  $('#semestre option').each((_, option) => {
    semesters.push({
      value: $(option).attr('value') || '',
      label: $(option).text().trim(),
      selected: $(option).is(':selected')
    });
  });

  const moduleList: Module[] = [];
  $('table.display > tbody > tr.clickable').each((_, moduleRow) => {
    const $row = $(moduleRow);
    const cells = $row.find('td');
    
    const moduleData: Module = {
      codeMod: $(cells[1]).text().trim(),
      intitule: $(cells[2]).text().trim(),
      descriptif: $(cells[3]).text().trim(),
      niveau: $(cells[4]).text().trim(),
      semestre: $(cells[5]).text().trim(),
      vhMod: $(cells[6]).text().trim(),
      coefMod: $(cells[7]).text().trim(),
      seuil: $(cells[8]).text().trim(),
      eliminatoire: $(cells[9]).text().trim(), // Maintenant une string directement
      elements: [],
    };

    const elementRow = $row.next('tr.collapse');
    if (elementRow.length) {
      elementRow.find('table tbody tr').each((_, elRow) => {
        const elCells = $(elRow).find('td');
        const element: Element = {
          codeElem: $(elCells[0]).text().trim(),
          intitule: $(elCells[1]).text().trim(),
          vhCTD: $(elCells[2]).text().trim(),
          vhTP: $(elCells[3]).text().trim(),
          vhEval: $(elCells[4]).text().trim(),
          coefCC: $(elCells[5]).text().trim(),
          coefEX: $(elCells[6]).text().trim(),
          coefEcrit: $(elCells[7]).text().trim(),
          coefTP: $(elCells[8]).text().trim(),
          coefEelem: $(elCells[9]).text().trim(),
        };
        moduleData.elements.push(element);
      });
    }
    moduleList.push(moduleData);
  });

  // Get selected values
  const selectedLevel = $('#niveau').val() as string || '1A';
  const selectedProgram = $('#filiere').val() as string || '';
  const selectedSemester = $('#semestre').val() as string || 'S1';

  return {
    csrfToken,
    levels,
    programs,
    semesters,
    selectedLevel,
    selectedProgram,
    selectedSemester,
    modules: moduleList
  };
}
// Fonction unique pour soumettre le formulaire du plan d'études
export async function submitStudyPlanForm(formData: FormData, sessionId: string) {
  const niveau = formData.get('niveau') as string;
  const filiere = formData.get('filiere') as string;
  const semestre = formData.get('semestre') as string;
  const _csrf = formData.get('_csrf') as string;

  // Prepare form data for submission
  const formDataToSend = new URLSearchParams();
  formDataToSend.append('niveau', niveau);
  formDataToSend.append('filiere', filiere);
  formDataToSend.append('semestre', semestre);
  formDataToSend.append('_csrf', _csrf);

  try {
    const response = await fetch('https://schoolapp.ensam-umi.ac.ma/plan-etudes-view/modules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `JSESSIONID=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      },
      body: formDataToSend.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    return extractStudyPlan(html);
  } catch (error) {
    console.error('Error submitting study plan form:', error);
    throw error;
  }
}

// Helper function to get study plan with specific parameters
export async function getStudyPlan(params: {
  niveau: string;
  filiere: string;
  semestre: string;
  sessionId: string;
}) {
  const { niveau, filiere, semestre, sessionId } = params;

  // First get the form to get CSRF token
  const initialRes = await fetch('https://schoolapp.ensam-umi.ac.ma/plan-etudes-view/modules', {
    headers: {
      'Cookie': `JSESSIONID=${sessionId}`,
    },
  });

  if (!initialRes.ok) {
    throw new Error('Failed to load study plan page');
  }

  const initialHtml = await initialRes.text();
  const initialData = extractStudyPlan(initialHtml);

  // Submit the form with desired parameters
  const formData = new URLSearchParams();
  formData.append('niveau', niveau);
  formData.append('filiere', filiere);
  formData.append('semestre', semestre);
  formData.append('_csrf', initialData.csrfToken);

  const response = await fetch('https://schoolapp.ensam-umi.ac.ma/plan-etudes-view/modules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `JSESSIONID=${sessionId}`,
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to submit study plan form');
  }

  const html = await response.text();
  return extractStudyPlan(html);
}

export function extractAbsenceSummary(html: string): {
  total: { justified: number; nonJustified: number };
  elements: Record<string, { justified: number; nonJustified: number }>;} {
  const $ = cheerio.load(html);

  const result = {
    total: { justified: 0, nonJustified: 0 },
    elements: {} as Record<string, { justified: number; nonJustified: number }>,
  };

  // First absence table (bilan)
  const table = $("table").first();

  table.find("tbody tr").each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length < 4) return;

    const code = $(cols[0]).text().trim();
    const nonJustified = Number($(cols[2]).text().trim());
    const justified = Number($(cols[3]).text().trim());

    result.elements[code] = { justified, nonJustified };

    result.total.justified += justified;
    result.total.nonJustified += nonJustified;
  });

  return result;
}